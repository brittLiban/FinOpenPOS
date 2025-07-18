"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllRoles, updateUserRole, addUser, deleteUser } from "./role-utils";

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




  // Add User Handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add user.");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("");
      setSuccess("User added successfully.");
      // Refresh users
      const supabase = createClient();
      const { data: usersData, error } = await supabase.rpc('get_users_with_roles');
      if (!error) setUsers(usersData || []);
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
      await deleteUser(userId);
      setSuccess("User deleted successfully.");
      // Refresh users
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_users_with_roles');
      if (!error) setUsers(data || []);
    } catch (e: any) {
      setError(e.message || "Failed to delete user.");
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      // Fetch all users and aggregate their roles using the working RPC
      const { data, error } = await supabase.rpc('get_users_with_roles');
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setUsers(data || []);
      try {
        const rolesData = await getAllRoles();
        setRoles(rolesData);
      } catch (e: any) {
        setError(e.message);
      }
      setLoading(false);
    };
    fetchUsers();
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
      // Refresh users
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, email, user_roles: user_roles(role_id, roles: roles(name))");
      const usersFlat = (data || []).map((u: any) => {
        let role_id = "";
        let roles = [];
        if (u.user_roles && Array.isArray(u.user_roles) && u.user_roles.length > 0) {
          role_id = u.user_roles[0]?.role_id || "";
          roles = u.user_roles.map((ur: any) => ur.roles?.name).filter(Boolean);
        }
        return {
          user_id: u.id,
          email: u.email,
          role_id,
          roles
        };
      });
      setUsers(usersFlat);
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
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">User Roles Management</h1>
      <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
        After making any changes, please refresh the page to see updates.
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {/* Add User Form */}
      <form onSubmit={handleAddUser} className="mb-6 flex gap-2 items-end">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="new-user-email">Email</label>
          <input
            id="new-user-email"
            type="email"
            className="border rounded px-2 py-1"
            value={newUserEmail}
            onChange={e => setNewUserEmail(e.target.value)}
            required
            placeholder="Enter email"
            title="User email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="new-user-password">Password</label>
          <input
            id="new-user-password"
            type="password"
            className="border rounded px-2 py-1"
            value={newUserPassword}
            onChange={e => setNewUserPassword(e.target.value)}
            required
            placeholder="Enter password"
            title="User password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="new-user-role">Role <span className="text-red-500">*</span></label>
          <select
            id="new-user-role"
            className="border rounded px-2 py-1"
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
        <Button type="submit" size="sm" disabled={adding || !newUserEmail || !newUserPassword}>
          {adding ? "Adding..." : "Add User"}
        </Button>
      </form>
      {/* User List */}
      {!loading && !error && (
        <div className="space-y-4">
          {users.length === 0 && <div>No profiles found. Please check your database.</div>}
          {users.map((user) => (
            <Card key={user.user_id} className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-6">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate whitespace-nowrap overflow-hidden max-w-xs md:max-w-sm lg:max-w-md" title={user.email || user.user_id}>
                  {user.email || user.user_id}
                </div>
                <div className="text-sm text-gray-500">
                  {user.role_names ? `Current role: ${user.role_names}` : 'No role assigned'}
                </div>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 mt-2 md:mt-0 w-full md:w-auto">
                <select
                  className="border rounded px-2 py-1"
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
