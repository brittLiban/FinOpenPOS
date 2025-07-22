
"use client";
import { useState, useEffect } from "react";
import { SIDEBAR_ITEMS } from "@/lib/sidebar-items";
import { getAllRoles } from "@/app/admin/user-roles/role-utils";
// import { createClient } from "@/lib/supabase/client";
import LanguagePicker from "@/components/language-picker";
import RolePermissionsManager from "@/components/admin/RolePermissionsManager";

import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  // For dark mode toggle (simple local state, you may want to use context or next-themes for real app)
  const [darkMode, setDarkMode] = useState(false);
  // For password change (placeholder, you should implement real logic)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleDarkModeToggle = () => {
    setDarkMode((prev) => !prev);
    // TODO: Integrate with your theme provider or next-themes
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  const [pwChangeStatus, setPwChangeStatus] = useState<string | null>(null);
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwChangeStatus(null);
    if (password !== confirmPassword) {
      setPwChangeStatus("Passwords do not match");
      return;
    }
    if (!password) {
      setPwChangeStatus("Password cannot be empty");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setPwChangeStatus(error.message || "Failed to change password");
    } else {
      setPwChangeStatus("Password changed successfully!");
      setPassword("");
      setConfirmPassword("");
    }
  };


  // Sidebar permissions state (admin only)
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [sidebarPerms, setSidebarPerms] = useState<{ [itemKey: string]: boolean }>({});
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  // --- Tax rate state (admin only) ---
  const [taxRate, setTaxRate] = useState<string>("");
  const [taxStatus, setTaxStatus] = useState<string | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);

  useEffect(() => {
    if (userRole !== 'admin') return;
    setTaxLoading(true);
    fetch("/api/settings?key=tax_rate")
      .then(res => res.json())
      .then(data => {
        if (data.value !== undefined) setTaxRate(data.value);
        setTaxLoading(false);
      })
      .catch(() => setTaxLoading(false));
  }, [userRole]);

  const handleSaveTaxRate = async () => {
    setTaxStatus(null);
    setTaxLoading(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "tax_rate", value: taxRate })
    });
    const data = await res.json();
    setTaxStatus(data.success ? "Saved!" : data.error || "Error");
    setTaxLoading(false);
  };

  // Fetch current user's role
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: rolesData, error } = await supabase.rpc('get_users_with_roles');
        if (!error && Array.isArray(rolesData)) {
          const userRow = rolesData.find((u: any) => u.user_id === data.user.id);
          setUserRole(userRow?.role_names || '');
        }
      }
    });
  }, []);

  // Fetch roles and users on mount (admin only)
  useEffect(() => {
    if (userRole !== 'admin') return;
    getAllRoles().then(setRoles);
    // Fetch all users for per-user permissions
    const supabase = createClient();
    supabase.rpc('get_users_with_roles').then(({ data }) => {
      setUsers(Array.isArray(data) ? data : []);
    });
  }, [userRole]);

  // Fetch sidebar permissions for selected role or user (admin only)
  useEffect(() => {
    if (userRole !== 'admin') return;
    setLoadingPerms(true);
    const supabase = createClient();
    (async () => {
      let data = null;
      if (selectedUser) {
        // Per-user permissions
        const res = await supabase
          .from("sidebar_permissions")
          .select("item_key, enabled")
          .eq("user_id", selectedUser);
        data = res.data;
      } else if (selectedRole) {
        // Per-role permissions
        const res = await supabase
          .from("sidebar_permissions")
          .select("item_key, enabled")
          .eq("role_id", selectedRole);
        data = res.data;
      }
      const perms: { [itemKey: string]: boolean } = {};
      SIDEBAR_ITEMS.forEach(item => {
        const found = data?.find((row: any) => row.item_key === item.key);
        perms[item.key] = found ? found.enabled : true;
      });
      setSidebarPerms(perms);
      setLoadingPerms(false);
    })();
  }, [selectedRole, selectedUser, userRole]);

  // Save sidebar permissions (admin only)
  const handleSaveSidebarPerms = async () => {
    if (userRole !== 'admin' || (!selectedRole && !selectedUser)) return;
    setSaveStatus(null);
    setLoadingPerms(true);
    const supabase = createClient();
    // Upsert all sidebar permissions for this role or user
    const updates = SIDEBAR_ITEMS.map(item => ({
      role_id: selectedUser ? null : selectedRole,
      user_id: selectedUser || null,
      item_key: item.key,
      enabled: !!sidebarPerms[item.key],
    }));
    const { error } = await supabase.from("sidebar_permissions").upsert(updates, { onConflict: selectedUser ? "user_id,item_key" : "role_id,item_key" });
    setLoadingPerms(false);
    setSaveStatus(error ? error.message : "Saved!");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      {userRole === 'admin' && (
        <div>
          <h2 className="font-semibold mb-2">Sidebar Permissions (Admin Only)</h2>
          <div className="mb-2 flex gap-4">
            <div>
              <label className="font-medium mr-2">Role:</label>
              <select
                className="border rounded px-2 py-1"
                value={selectedRole ?? ""}
                onChange={e => {
                  setSelectedRole(Number(e.target.value));
                  setSelectedUser(null);
                }}
                title="Select role"
              >
                <option value="">Select role</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-medium mr-2">User:</label>
              <select
                className="border rounded px-2 py-1"
                value={selectedUser ?? ""}
                onChange={e => {
                  setSelectedUser(e.target.value || null);
                  setSelectedRole(null);
                }}
                title="Select user"
              >
                <option value="">Select user</option>
                {users.map(u => (
                  <option key={u.user_id} value={u.user_id}>{u.email || u.user_id}</option>
                ))}
              </select>
            </div>
          </div>
          {(selectedRole || selectedUser) && (
            <div className="space-y-2 border rounded p-4 bg-muted/30">
              {SIDEBAR_ITEMS.map(item => (
                <label key={item.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!sidebarPerms[item.key]}
                    onChange={e => setSidebarPerms(p => ({ ...p, [item.key]: e.target.checked }))}
                    disabled={loadingPerms}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
              <button
                className="mt-4 border rounded px-3 py-1 bg-primary text-white disabled:opacity-50"
                onClick={handleSaveSidebarPerms}
                disabled={loadingPerms}
              >
                {loadingPerms ? "Saving..." : "Save"}
              </button>
              {saveStatus && (
                <div className={saveStatus === "Saved!" ? "text-green-600" : "text-red-500"}>{saveStatus}</div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Role Permissions Management (Admin Only) */}
      {userRole === 'admin' && (
        <div className="mb-8">
          <RolePermissionsManager />
        </div>
      )}

      {/* Tax Rate Setting (Admin Only) */}
      {userRole === 'admin' && (
        <div className="mb-8">
          <h2 className="font-semibold mb-2">Tax Rate (%)</h2>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="border rounded px-2 py-1 w-32"
              value={taxRate}
              onChange={e => setTaxRate(e.target.value)}
              disabled={taxLoading}
              placeholder="e.g. 13.00"
              title="Tax rate percentage"
            />
            <button
              className="border rounded px-3 py-1 bg-primary text-white disabled:opacity-50"
              onClick={handleSaveTaxRate}
              disabled={taxLoading}
            >
              {taxLoading ? "Saving..." : "Save"}
            </button>
            {taxStatus && (
              <span className={taxStatus === "Saved!" ? "text-green-600" : "text-red-500"}>{taxStatus}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">This tax rate will be applied to all checkouts. Only admins can change it.</p>
        </div>
      )}
      <div>
        <h2 className="font-semibold mb-2">Language</h2>
        <LanguagePicker />
      </div>
      <div>
        <h2 className="font-semibold mb-2">Appearance</h2>
        <button
          className="border rounded px-3 py-1"
          onClick={handleDarkModeToggle}
        >
          {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </button>
      </div>
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <h2 className="font-semibold mb-2">Change Password</h2>
        <input
          type="password"
          placeholder="New Password"
          className="border rounded px-2 py-1 w-full"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="border rounded px-2 py-1 w-full"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
        <button type="submit" className="border rounded px-3 py-1 bg-primary text-white">
          Change Password
        </button>
        {pwChangeStatus && (
          <div className={pwChangeStatus.includes("success") ? "text-green-600" : "text-red-500"}>{pwChangeStatus}</div>
        )}
      </form>
    </div>
  );
}
