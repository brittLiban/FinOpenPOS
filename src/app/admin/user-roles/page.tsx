"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UserRolesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      // Fetch all users and their roles
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, roles(name), users:profiles(email)");
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">User Roles Management</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          {users.length === 0 && <div>No users found.</div>}
          {users.map((user) => (
            <Card key={user.user_id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{user.users?.email || user.user_id}</div>
                <div className="text-sm text-muted-foreground">Role: {user.roles?.[0]?.name || "None"}</div>
              </div>
              <Button size="sm" variant="outline">Change Role</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
