import React from 'react';
import EmployeeTable from '@/components/employees/employee-table';
import { Button } from '@/components/ui/button';

export default function EmployeesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Employee Management</h1>
        <Button>Add Employee</Button>
      </div>
      <EmployeeTable />
    </div>
  );
}
