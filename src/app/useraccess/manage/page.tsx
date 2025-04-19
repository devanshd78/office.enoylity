"use client";

import React, { FC, useState } from 'react';

const employees = [
  'John Doe',
  'Jane Smith',
  'Alice Johnson',
  'Bob Brown'
];

const permissions = [
  'View payslip details',
  'Generate payslip',
  'View Invoice details',
  'Generate invoice details',
  'Add Employee details',
  'View employee details'
];

const ManageAccess: FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handlePermissionChange = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = () => {
    alert(`Access granted to ${selectedEmployee} with username '${username}' for: ${selectedPermissions.join(', ')}`);
    console.log({ selectedEmployee, username, password, selectedPermissions });
  };

  return (
    <div className="min-h-screen bg-indigo-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">User Access Control</h1>

        <label className="block mb-2 text-sm font-medium text-gray-700">Select Employee</label>
        <select
          value={selectedEmployee}
          onChange={e => setSelectedEmployee(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded-lg"
        >
          <option value="">-- Choose an employee --</option>
          {employees.map(emp => (
            <option key={emp} value={emp}>{emp}</option>
          ))}
        </select>

        <label className="block mb-2 text-sm font-medium text-gray-700">Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded-lg"
        />

        <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded-lg"
        />

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Assign Permissions</p>
          <div className="space-y-2">
            {permissions.map(permission => (
              <label key={permission} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission)}
                  onChange={() => handlePermissionChange(permission)}
                />
                <span>{permission}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedEmployee || !username || !password || selectedPermissions.length === 0}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Save Access
        </button>
      </div>
    </div>
  );
};

export default ManageAccess;
