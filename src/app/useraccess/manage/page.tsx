"use client";

import React, { FC, useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const permissions = [
  'View payslip details',
  'Generate payslip',
  'View Invoice details',
  'Generate invoice details',
  'Add Employee details',
  'View employee details'
];

const ManageAccess: FC = () => {
  const [employees, setEmployees] = useState<{ employeeId: string; name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch employees from backend
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('http://127.0.0.1:4000/employee/getlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            page: 1,
            pageSize: 100  // Adjust based on your needs
          })
        });

        const result = await response.json();
        if (result.success) {
          setEmployees(result.data.employees);
        } else {
          console.error(result.message);
        }
      } catch (error) {
        console.error("Failed to fetch employees", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handlePermissionChange = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !username || !password || selectedPermissions.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please fill in all fields and select at least one permission.'
      });
      return;
    }

    const adminId = localStorage.getItem('adminId');

    const payload = {
      adminid: adminId,
      employeeid: selectedEmployee,
      username,
      password,
      permissions: selectedPermissions.reduce<Record<string, boolean>>((acc, perm) => {
        acc[perm] = true;
        return acc;
      }, {})
    };

    try {
      const response = await fetch('http://127.0.0.1:4000/subadmin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Subadmin registered successfully!'
        });

        // Optional: Reset form
        setSelectedEmployee('');
        setUsername('');
        setPassword('');
        setSelectedPermissions([]);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error || 'Something went wrong'
        });
      }
    } catch (error) {
      console.error('Error during registration', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'An error occurred. Please try again later.'
      });
    }
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
          disabled={loading}
        >
          <option value="">{loading ? 'Loading employees...' : '-- Choose an employee --'}</option>
          {employees.map(emp => (
            <option key={emp.employeeId} value={emp.employeeId}>
              {emp.name}
            </option>
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
