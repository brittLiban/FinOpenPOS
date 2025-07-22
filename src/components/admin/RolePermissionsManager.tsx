"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Permission {
  item_key: string;
  enabled: boolean;
}

interface Role {
  id: number;
  name: string;
}

interface RolePermissions {
  [roleId: number]: {
    name: string;
    permissions: Permission[];
  };
}

export default function RolePermissionsManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
  const [allSidebarItems, setAllSidebarItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch role permissions data
  useEffect(() => {
    fetchRolePermissions();
  }, []);

  const fetchRolePermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/role-permissions');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch role permissions');
      }
      
      setRoles(data.roles);
      setRolePermissions(data.rolePermissions);
      setAllSidebarItems(data.allSidebarItems);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update permission for a role
  const handlePermissionChange = (roleId: number, itemKey: string, enabled: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        permissions: prev[roleId].permissions.map(p => 
          p.item_key === itemKey ? { ...p, enabled } : p
        )
      }
    }));
  };

  // Save permissions for a role
  const saveRolePermissions = async (roleId: number) => {
    try {
      setSaving(roleId);
      setError(null);
      setSuccess(null);

      const permissions = rolePermissions[roleId].permissions;
      
      const response = await fetch('/api/admin/role-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, permissions })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save permissions');
      }
      
      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  // Format sidebar item names for display
  const formatItemName = (itemKey: string) => {
    return itemKey
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading role permissions...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Role Permissions Management</h2>
        <p className="text-gray-600 mt-2">
          Configure what features each role can access in your company.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid gap-6">
        {roles.map(role => (
          <Card key={role.id} className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold capitalize">
                {role.name} Role
              </h3>
              <Button 
                onClick={() => saveRolePermissions(role.id)}
                disabled={saving === role.id}
                className="min-w-[100px]"
              >
                {saving === role.id ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {rolePermissions[role.id]?.permissions.map(permission => (
                <div key={permission.item_key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${role.id}-${permission.item_key}`}
                    checked={permission.enabled}
                    onCheckedChange={(checked: boolean) => 
                      handlePermissionChange(role.id, permission.item_key, checked)
                    }
                  />
                  <label 
                    htmlFor={`${role.id}-${permission.item_key}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {formatItemName(permission.item_key)}
                  </label>
                </div>
              ))}
            </div>

            {/* Role description */}
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
              {role.name === 'admin' && 'Full system access - can manage all features and settings'}
              {role.name === 'manager' && 'Management access - can handle inventory, reports, and staff'}
              {role.name === 'cashier' && 'Sales focused - can process transactions and handle customers'}
              {role.name === 'employee' && 'Basic access - limited to essential POS functions'}
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h4 className="font-semibold text-blue-800">Permission Definitions:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-blue-700">
          <div><strong>Dashboard:</strong> View analytics and overview</div>
          <div><strong>POS:</strong> Access point-of-sale system</div>
          <div><strong>Orders:</strong> View and manage orders</div>
          <div><strong>Products:</strong> Manage inventory items</div>
          <div><strong>Customers:</strong> Manage customer information</div>
          <div><strong>Employees:</strong> Manage staff and roles</div>
          <div><strong>Inventory:</strong> Stock management and tracking</div>
          <div><strong>Returns:</strong> Process returns and refunds</div>
          <div><strong>Settings:</strong> System configuration</div>
          <div><strong>Audit Log:</strong> View system activity logs</div>
        </div>
      </div>
    </div>
  );
}
