"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllRoles, updateUserRole, addUser } from "./role-utils";

export default function UserRolesPage() {
  const [pwResetUser, setPwResetUser] = useState<string | null>(null);
  const [pwReset, setPwReset] = useState("");
  const [pwResetConfirm, setPwResetConfirm] = useState("");
  const [pwResetStatus, setPwResetStatus] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("");
  const [adding, setAdding] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roleChanges, setRoleChanges] = useState<{ [userId: string]: number }>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userMetaCompanyId, setUserMetaCompanyId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);



  const [seedingRoles, setSeedingRoles] = useState(false);

  // Seed Default Roles Handler
  const handleSeedRoles = async () => {
    setSeedingRoles(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/seed-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to seed roles.");
      
      setSuccess(`${data.message}. Refreshing roles...`);
      
      // Refresh roles
      const supabase = createClient();
      const { data: currentUser } = await supabase.auth.getUser();
      if (currentUser.user) {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', currentUser.user.id)
          .single();
        
        if (adminProfile?.company_id) {
          const { data: rolesData } = await supabase
            .from('roles')
            .select('id, name, description')
            .eq('company_id', adminProfile.company_id)
            .order('name');
          
          setRoles(rolesData || []);
        }
      }
      
    } catch (e: any) {
      setError(e.message || "Failed to seed roles.");
    }
    setSeedingRoles(false);
  };

  // Add User Handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const effectiveCompanyId = userMetaCompanyId || companyId;
    if (!effectiveCompanyId) {
      setError("Company ID is not set. Please refresh the page or contact support.");
      return;
    }
    if (!newUserPassword) {
      setError("Password is required.");
      return;
    }
    if (!newUserRole) {
      setError("Role is required.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/admin/user-roles/add-user-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role_id: Number(newUserRole),
          company_id: effectiveCompanyId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add user.");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("");
      setSuccess("User added successfully.");
      
      // Refresh users list
      const supabase = createClient();
      const { data: usersData } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          company_id
        `)
        .eq('company_id', effectiveCompanyId);

      // For each user, get their roles
      const usersWithRoles = await Promise.all(
        (usersData || []).map(async (user: any) => {
          const { data: userRolesData } = await supabase
            .from('user_roles')
            .select(`
              role_id,
              roles (
                id,
                name
              )
            `)
            .eq('user_id', user.id);

          return {
            user_id: user.id,
            email: user.email,
            company_id: user.company_id,
            role_names: (userRolesData || []).map((ur: any) => ur.roles?.name).filter(Boolean),
            role_id: (userRolesData || [])[0]?.role_id || null
          };
        })
      );
      
      setUsers(usersWithRoles);
    } catch (e: any) {
      setError(e.message || "Failed to add user.");
    }
    setAdding(false);
  };

  // Delete User Handler
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/delete-user?userId=${userId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }
      
      setSuccess("User deleted successfully.");
      
      // Refresh users list
      const supabase = createClient();
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', currentUser.user.id)
        .single();
      
      if (!adminProfile?.company_id) return;

      const { data: usersData } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          company_id
        `)
        .eq('company_id', adminProfile.company_id);

      // For each user, get their roles
      const usersWithRoles = await Promise.all(
        (usersData || []).map(async (user: any) => {
          const { data: userRolesData } = await supabase
            .from('user_roles')
            .select(`
              role_id,
              roles (
                id,
                name
              )
            `)
            .eq('user_id', user.id);

          return {
            user_id: user.id,
            email: user.email,
            company_id: user.company_id,
            role_names: (userRolesData || []).map((ur: any) => ur.roles?.name).filter(Boolean),
            role_id: (userRolesData || [])[0]?.role_id || null
          };
        })
      );
      
      setUsers(usersWithRoles);
    } catch (e: any) {
      setError(e.message || "Failed to delete user.");
    }
  };

  useEffect(() => {
    const fetchUsersAndCompanyId = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      
      try {
        // Get current user
        const { data: currentUser } = await supabase.auth.getUser();
        if (!currentUser.user) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        setCurrentUserId(currentUser.user.id);
        const metaCompanyId = currentUser.user.user_metadata?.company_id || null;
        setUserMetaCompanyId(metaCompanyId);

        // Get admin's company_id from profile
        const { data: adminProfile, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', currentUser.user.id)
          .single();
        
        if (profileError || !adminProfile?.company_id) {
          setError('No company associated with user profile');
          setLoading(false);
          return;
        }

        setCompanyId(adminProfile.company_id);
        const companyId = adminProfile.company_id;

        // Fetch users in the same company with their roles
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            company_id
          `)
          .eq('company_id', companyId);

        if (usersError) {
          setError(`Failed to fetch users: ${usersError.message}`);
          setLoading(false);
          return;
        }

        // For each user, get their roles
        const usersWithRoles = await Promise.all(
          (usersData || []).map(async (user: any) => {
            const { data: userRolesData } = await supabase
              .from('user_roles')
              .select(`
                role_id,
                roles (
                  id,
                  name
                )
              `)
              .eq('user_id', user.id);

            return {
              user_id: user.id,
              email: user.email,
              company_id: user.company_id,
              role_names: (userRolesData || []).map((ur: any) => ur.roles?.name).filter(Boolean),
              role_id: (userRolesData || [])[0]?.role_id || null
            };
          })
        );

        setUsers(usersWithRoles);

        // Fetch roles for this company
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('id, name, description')
          .eq('company_id', companyId)
          .order('name');

        if (rolesError) {
          console.error('Failed to fetch roles:', rolesError);
          setRoles([]);
        } else {
          setRoles(rolesData || []);
        }

      } catch (e: any) {
        setError(`Error: ${e.message}`);
        setCompanyId(null);
        setUserMetaCompanyId(null);
        setCurrentUserId(null);
      }
      
      setLoading(false);
    };
    
    fetchUsersAndCompanyId();
  }, []);

  const handleRoleChange = (userId: string, roleId: number) => {
    setRoleChanges((prev) => ({ ...prev, [userId]: roleId }));
  };

  const handleSave = async (userId: string) => {
    if (!roleChanges[userId]) return;
    setSaving(userId);
    setError(null);
    setSuccess(null);
    try {
      await updateUserRole(userId, roleChanges[userId]);
      
      // Refresh users list with updated roles
      const supabase = createClient();
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', currentUser.user.id)
        .single();
      
      if (!adminProfile?.company_id) return;

      // Fetch users in the same company with their roles
      const { data: usersData } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          company_id
        `)
        .eq('company_id', adminProfile.company_id);

      // For each user, get their roles
      const usersWithRoles = await Promise.all(
        (usersData || []).map(async (user: any) => {
          const { data: userRolesData } = await supabase
            .from('user_roles')
            .select(`
              role_id,
              roles (
                id,
                name
              )
            `)
            .eq('user_id', user.id);

          return {
            user_id: user.id,
            email: user.email,
            company_id: user.company_id,
            role_names: (userRolesData || []).map((ur: any) => ur.roles?.name).filter(Boolean),
            role_id: (userRolesData || [])[0]?.role_id || null
          };
        })
      );
      
      setUsers(usersWithRoles);
      setRoleChanges((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      setSuccess("Role updated successfully.");
      setTimeout(() => setSuccess(null), 2000);
    } catch (e: any) {
      setError(e.message || "Failed to update role.");
      // eslint-disable-next-line no-console
      console.error("Role update error:", e);
    }
    setSaving(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">User Roles Management</h1>
      
      {/* Debug Info */}
      <Card className="mb-6 p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><b>Company ID:</b> {companyId || userMetaCompanyId || 'N/A'}</div>
          <div><b>Available Roles:</b> {roles.length} role(s) found</div>
          {roles.length > 0 && (
            <div className="md:col-span-2"><b>Role Names:</b> {roles.map(r => r.name).join(', ')}</div>
          )}
        </div>
      </Card>

      {/* Seed Roles Button */}
      {roles.length <= 1 && (
        <Card className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-blue-800 mb-3">
                <b>Need more roles?</b> You currently have {roles.length} role(s). 
                Click below to create default roles for your company.
              </p>
              <Button 
                onClick={handleSeedRoles} 
                disabled={seedingRoles}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {seedingRoles ? "Creating Roles..." : "Create Default Roles (Admin, Manager, Cashier, Employee)"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!companyId && !userMetaCompanyId && (
        <Card className="mb-6 p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-800">
                <b>Warning:</b> Your company ID is not set. You cannot add users until this is fixed.<br />
                Please contact support or use the admin tools to set your company ID.
              </p>
            </div>
          </div>
        </Card>
      )}

      {success && (
        <Card className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-yellow-800">
                After making any changes, please refresh the page to see updates.
              </p>
            </div>
          </div>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      )}

      {error && (
        <Card className="mb-6 p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {success && (
        <Card className="mb-6 p-4 bg-green-50 border-l-4 border-green-400">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        </Card>
      )}
      {/* Add User Form */}
      <Card className="mb-6 p-4">
        <h2 className="text-lg font-semibold mb-4">Add New User</h2>
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="new-user-email">Email</label>
            <input
              id="new-user-email"
              type="email"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={newUserEmail}
              onChange={e => setNewUserEmail(e.target.value)}
              required
              placeholder="Enter email"
              title="User email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="new-user-password">Password</label>
            <input
              id="new-user-password"
              type="password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={newUserPassword}
              onChange={e => setNewUserPassword(e.target.value)}
              required
              placeholder="Enter password"
              title="User password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="new-user-role">Role <span className="text-red-500">*</span></label>
            <select
              id="new-user-role"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={newUserRole}
              onChange={e => setNewUserRole(e.target.value)}
              title="Select role"
              required
            >
              <option value="">Select role</option>
              {roles.map((role: any) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button 
              type="submit" 
              disabled={adding || !newUserEmail || !newUserPassword || !(companyId || userMetaCompanyId)}
              className="px-6"
            >
              {adding ? "Adding..." : "Add User"}
            </Button>
          </div>
        </form>
      </Card>
      {/* User List */}
      {!loading && !error && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Users</h2>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-2">No users found. Please check your database.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.user_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900" title={user.email || user.user_id}>
                            {user.email || user.user_id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.role_names && user.role_names.length > 0 
                              ? `Current role: ${Array.isArray(user.role_names) ? user.role_names.join(', ') : user.role_names}` 
                              : 'No role assigned'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            <b>Company ID:</b> {user.company_id || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
                      <select
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={roleChanges[user.user_id] || user.role_id || ""}
                        onChange={e => handleRoleChange(user.user_id, Number(e.target.value))}
                        title="Select role"
                      >
                        <option value="">Select role</option>
                        {roles.map((role: any) => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving === user.user_id || !roleChanges[user.user_id] || roleChanges[user.user_id] === user.role_id}
                  onClick={() => handleSave(user.user_id)}
                >
                  {saving === user.user_id ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteUser(user.user_id)}
                >
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPwResetUser(user.user_id);
                    setPwReset("");
                    setPwResetConfirm("");
                    setPwResetStatus(null);
                  }}
                >
                  Change Password
                </Button>
              </div>
            </div>
              {pwResetUser === user.user_id && (
                <>
                  {/* Modal Overlay */}
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    {/* Modal Content */}
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative animate-fade-in">
                      <form
                        className="flex flex-col gap-3"
                        onSubmit={async e => {
                          e.preventDefault();
                          setPwResetStatus(null);
                          if (!pwReset || !pwResetConfirm) {
                            setPwResetStatus("Password and confirmation required");
                            return;
                          }
                          if (pwReset !== pwResetConfirm) {
                            setPwResetStatus("Passwords do not match");
                            return;
                          }
                          const res = await fetch("/admin/user-roles/change-password-api", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ user_id: user.user_id, password: pwReset }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            setPwResetStatus(data.error || "Failed to change password");
                          } else {
                            setPwResetStatus("Password changed successfully!");
                            setPwReset("");
                            setPwResetConfirm("");
                            setTimeout(() => setPwResetUser(null), 1500);
                          }
                        }}
                      >
                        <h3 className="text-lg font-semibold mb-2">Change Password</h3>
                        <input
                          type="password"
                          className="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                          placeholder="New password"
                          value={pwReset}
                          onChange={e => setPwReset(e.target.value)}
                          autoFocus
                        />
                        <input
                          type="password"
                          className="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                          placeholder="Confirm password"
                          value={pwResetConfirm}
                          onChange={e => setPwResetConfirm(e.target.value)}
                        />
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" type="submit">Save</Button>
                          <Button size="sm" variant="ghost" type="button" onClick={() => setPwResetUser(null)}>Cancel</Button>
                        </div>
                        {pwResetStatus && (
                          <div className={pwResetStatus.includes("success") ? "text-green-600 mt-2" : "text-red-500 mt-2"}>{pwResetStatus}</div>
                        )}
                      </form>
                    </div>
                  </div>
                </>
              )}
            </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
