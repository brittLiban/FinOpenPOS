
export default function EmployeeTable({ employees = [], onEdit, onRemove }: { employees: any[], onEdit: (emp: any) => void, onRemove: (id: number) => void }) {
  const [editEmp, setEditEmp] = useState<any | null>(null);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});

  // Open edit modal and prefill form
  const handleEdit = (emp: any) => {
    setEditEmp(emp);
    setForm(emp);
  };

  // Save edit
  const handleSave = () => {
    onEdit(form);
    setEditEmp(null);
  };

  // Remove
  const handleRemove = () => {
    if (removeId != null) onRemove(removeId);
    setRemoveId(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b">Name</th>
            <th className="px-4 py-2 border-b">Role</th>
            <th className="px-4 py-2 border-b">Pay</th>
            <th className="px-4 py-2 border-b">Status</th>
            {/* Last Shift removed */}
            <th className="px-4 py-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id} className="text-center">
              <td className="px-4 py-2 border-b">{emp.name}</td>
              <td className="px-4 py-2 border-b">{emp.role}</td>
              <td className="px-4 py-2 border-b">{emp.pay}</td>
              <td className="px-4 py-2 border-b">{emp.status}</td>
              {/* Last Shift removed */}
              <td className="px-4 py-2 border-b">
                <button className="text-blue-600 hover:underline mr-2" onClick={() => handleEdit(emp)}>Edit</button>
                <button className="text-red-600 hover:underline" onClick={() => setRemoveId(emp.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editEmp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Edit Employee</h2>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="mb-2">
                <label className="block text-sm mb-1">Name</label>
                <input className="border rounded px-2 py-1 w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Full name" title="Employee name" />
              </div>
              <div className="mb-2">
                <label className="block text-sm mb-1">Role</label>
                <select className="border rounded px-2 py-1 w-full" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required title="Role">
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                  <option value="Stock">Stock</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm mb-1">Pay</label>
                <input className="border rounded px-2 py-1 w-full" value={form.pay} onChange={e => setForm({ ...form, pay: e.target.value })} required placeholder="$15/hr" title="Pay" />
              </div>
              <div className="mb-2">
                <label className="block text-sm mb-1">Status</label>
                <select className="border rounded px-2 py-1 w-full" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} required title="Status">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              {/* Last Shift removed */}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded border" onClick={() => setEditEmp(null)}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {removeId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-bold mb-4">Remove Employee</h2>
            <div className="mb-4">Are you sure you want to remove this employee?</div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setRemoveId(null)}>Cancel</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={handleRemove}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
