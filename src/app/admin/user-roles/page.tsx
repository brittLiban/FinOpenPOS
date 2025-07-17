"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllRoles, updateUserRole } from "./role-utils";

export default function UserRolesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roleChanges, setRoleChanges] = useState<{ [userId: string]: number }>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      // Fetch all users from profiles and join to user_roles and roles
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, user_roles: user_roles(role_id, roles: roles(name))");
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Map to a flat structure for UI, robust to user_roles being empty or not an array
      const usersFlat = (data || []).map((u: any) => {
        let role_id = "";
        let role = "None";
        if (u.user_roles && Array.isArray(u.user_roles) && u.user_roles.length > 0) {
          role_id = u.user_roles[0]?.role_id || "";
          role = u.user_roles[0]?.roles?.name || "None";
        }
        return {
          user_id: u.id,
          email: u.email,
          role_id,
          role
        };
      });
      setUsers(usersFlat);
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
        let role = "None";
        if (u.user_roles && Array.isArray(u.user_roles) && u.user_roles.length > 0) {
          role_id = u.user_roles[0]?.role_id || "";
          role = u.user_roles[0]?.roles?.name || "None";
        }
        return {
          user_id: u.id,
          email: u.email,
          role_id,
          role
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
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          {users.length === 0 && <div>No users found.</div>}
          {users.map((user) => (
            <Card key={user.user_id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{user.email || user.user_id}</div>
                <div className="text-sm text-muted-foreground">Current Role: {user.role}</div>
              </div>
              <div className="flex items-center gap-2">
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
