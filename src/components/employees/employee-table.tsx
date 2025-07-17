import React from 'react';

const mockEmployees = [
  { id: 1, name: 'Alice Johnson', role: 'Cashier', pay: '$15/hr', status: 'Active', lastShift: '2025-07-15' },
  { id: 2, name: 'Bob Smith', role: 'Manager', pay: '$25/hr', status: 'Active', lastShift: '2025-07-14' },
  { id: 3, name: 'Carlos Diaz', role: 'Stock', pay: '$13/hr', status: 'Inactive', lastShift: '2025-07-10' },
];

export default function EmployeeTable() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b">Name</th>
            <th className="px-4 py-2 border-b">Role</th>
            <th className="px-4 py-2 border-b">Pay</th>
            <th className="px-4 py-2 border-b">Status</th>
            <th className="px-4 py-2 border-b">Last Shift</th>
            <th className="px-4 py-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {mockEmployees.map(emp => (
            <tr key={emp.id} className="text-center">
              <td className="px-4 py-2 border-b">{emp.name}</td>
              <td className="px-4 py-2 border-b">{emp.role}</td>
              <td className="px-4 py-2 border-b">{emp.pay}</td>
              <td className="px-4 py-2 border-b">{emp.status}</td>
              <td className="px-4 py-2 border-b">{emp.lastShift}</td>
              <td className="px-4 py-2 border-b">
                <button className="text-blue-600 hover:underline mr-2">Edit</button>
                <button className="text-red-600 hover:underline">Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
