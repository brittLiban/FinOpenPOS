"use client";
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmployeeTable from '@/components/employees/employee-table';

// Fetch employees from the API
async function fetchEmployees() {
  const res = await fetch('/api/employees');
  if (!res.ok) return [];
  return await res.json();
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<{ id: number; name: string; role: string; pay: string; status: string; lastShift: string; }[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    role: 'Cashier',
    pay: '',
    status: 'Active',
    lastShift: ''
  });

  useEffect(() => {
    fetchEmployees().then(setEmployees);
  }, []);

  // Add employee via API
  async function addEmployeeAPI(emp: any) {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emp),
    });
    if (!res.ok) return null;
    return await res.json();
  }

  // Edit employee via API
  async function editEmployeeAPI(emp: any) {
    const res = await fetch(`/api/employees/${emp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emp),
    });
    if (!res.ok) return null;
    return await res.json();
  }

  // Remove employee via API
  async function removeEmployeeAPI(id: number) {
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    return res.ok;
  }

  const filtered = employees.filter((emp: any) => {
    return (
      (!search || emp.name.toLowerCase().includes(search.toLowerCase())) &&
      (!roleFilter || emp.role === roleFilter) &&
      (!statusFilter || emp.status === statusFilter)
    );
  });

  const total = employees.length;
  const active = employees.filter((e: any) => e.status === 'Active').length;
  const inactive = employees.filter((e: any) => e.status === 'Inactive').length;
  const lastShift = employees.reduce((latest: string, e: any) => e.lastShift > latest ? e.lastShift : latest, '');

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Employee Management</h1>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total: <b>{total}</b></span>
            <span>Active: <b>{active}</b></span>
            <span>Inactive: <b>{inactive}</b></span>
            <span>Last Shift: <b>{lastShift || 'N/A'}</b></span>
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Employee</Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-48"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
          title="Filter by role"
        >
          <option value="">All Roles</option>
          <option value="Cashier">Cashier</option>
          <option value="Manager">Manager</option>
          <option value="Stock">Stock</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
          title="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      <EmployeeTable
        employees={filtered}
        onEdit={async emp => {
          const updated = await editEmployeeAPI(emp);
          if (updated) setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
        }}
        onRemove={async id => {
          const ok = await removeEmployeeAPI(id);
          if (ok) setEmployees(prev => prev.filter(e => e.id !== id));
        }}
      />
      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add Employee</h2>
            <form
              onSubmit={async e => {
                e.preventDefault();
                const added = await addEmployeeAPI(addForm);
                if (added) setEmployees(prev => [...prev, added]);
                setShowAddModal(false);
                setAddForm({ name: '', role: 'Cashier', pay: '', status: 'Active', lastShift: '' });
              }}
            >
              <div className="mb-2">
                <label className="block text-sm mb-1">Name</label>
                <input className="border rounded px-2 py-1 w-full" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required placeholder="Full name" title="Employee name" />
              </div>
              <div className="mb-2">
                <label className="block text-sm mb-1">Role</label>
                <select className="border rounded px-2 py-1 w-full" value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} required title="Role">
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                  <option value="Stock">Stock</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm mb-1">Pay</label>
                <input className="border rounded px-2 py-1 w-full" value={addForm.pay} onChange={e => setAddForm(f => ({ ...f, pay: e.target.value }))} required placeholder="$15/hr" title="Pay" />
              </div>
              <div className="mb-2">
                <label className="block text-sm mb-1">Status</label>
                <select className="border rounded px-2 py-1 w-full" value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))} required title="Status">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm mb-1">Last Shift</label>
                <input type="date" className="border rounded px-2 py-1 w-full" value={addForm.lastShift} onChange={e => setAddForm(f => ({ ...f, lastShift: e.target.value }))} required placeholder="YYYY-MM-DD" title="Last shift date" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
