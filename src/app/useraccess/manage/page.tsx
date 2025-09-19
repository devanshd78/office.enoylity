"use client";

import React, { FC, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { post } from '@/app/utils/apiClient';

const permissionsList = [
  'View payslip details',
  'Generate payslip',
  'View Invoice details',
  'Generate invoice details',
  'Add Employee Details',
  'View Employee Details',
  'KPI',
  'Manage KPI',
];

interface Employee {
  employeeId: string;
  name: string;
}

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const ManageAccess: FC = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const result = await post<{
          success: boolean;
          data: { employees: Employee[] };
          message?: string;
        }>('/employee/getlist', { page: 1, pageSize: 100 });

        if (result.success) {
          setEmployees(result.data.employees);
        } else {
          throw new Error(result.message || 'Failed to load employees');
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Could not fetch employee list.';
        console.error(err);
        await Swal.fire({
          icon: 'error',
          title: 'Load Failed',
          text: msg,
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handlePermissionToggle = (perm: string) => {
    setSelectedPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const validatePassword = (pwd: string) => {
    if (!pwd) return 'Password is required.';
    if (!passwordRegex.test(pwd)) {
      return 'Must be 8+ chars with uppercase, lowercase, number, and special character.';
    }
    return null;
  };

  const onPasswordChange = (val: string) => {
    setPassword(val);
    setPasswordError(validatePassword(val));
  };

  const handleSubmit = async () => {
    // Frontend validation first
    const pwdErr = validatePassword(password);
    if (!selectedEmployee || !username || !password || selectedPermissions.length === 0 || pwdErr) {
      setPasswordError(pwdErr);
      await Swal.fire({
        icon: 'warning',
        title: 'Incomplete / Invalid Form',
        text:
          pwdErr ??
          'Please fill all fields and pick at least one permission.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const adminId = localStorage.getItem('adminId') || '';

      const payload = {
        // ⚠️ Keep key names exactly as backend expects
        adminid: adminId,                  // if backend expects "adminid"
        employeeid: selectedEmployee,      // if backend expects "employeeid"
        username,
        password,
        // If backend expects an object map; if it expects an array, send selectedPermissions instead.
        permissions: selectedPermissions.reduce<Record<string, number>>((acc, perm) => {
          acc[perm] = 1;
          return acc;
        }, {}),
      };

      const result = await post<{ success: boolean; message?: string }>(
        '/subadmin/register',
        payload
      );

      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Registered!',
          text: 'Subadmin created successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
        setSelectedEmployee('');
        setUsername('');
        setPassword('');
        setPasswordError(null);
        setSelectedPermissions([]);
        router.push('/useraccess');
      } else {
        // Backend responded with success: false
        throw new Error(result.message || 'Registration failed');
      }
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message || // Axios-style
        err?.data?.message ||           // fetch wrapper variants
        err?.message ||
        'Could not register subadmin.';
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: serverMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordValid = !validatePassword(password);

  return (
    <div className="min-h-screen bg-indigo-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">User Access Control</h1>

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Select Employee
        </label>
        <select
          value={selectedEmployee}
          onChange={e => setSelectedEmployee(e.target.value)}
          disabled={isLoading}
          className="w-full mb-4 p-2 border rounded-lg"
        >
          <option value="">
            {isLoading ? 'Loading employees…' : '-- Choose an employee --'}
          </option>
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
          disabled={isLoading}
          className="w-full mb-4 p-2 border rounded-lg"
          placeholder="e.g., john.doe"
        />

        <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => onPasswordChange(e.target.value)}
          disabled={isLoading}
          className={`w-full p-2 border rounded-lg ${passwordError ? 'border-red-500' : 'mb-2'}`}
          placeholder="Min 8 chars, Aa1@"
        />
        <p className={`text-xs mb-4 ${passwordError ? 'text-red-600' : 'text-gray-500'}`}>
          Must include uppercase, lowercase, number, and special character.
        </p>

        <p className="text-sm font-medium text-gray-700 mb-2">Assign Permissions</p>
        <div className="space-y-2 mb-4">
          {permissionsList.map(perm => (
            <label key={perm} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedPermissions.includes(perm)}
                onChange={() => handlePermissionToggle(perm)}
                disabled={isLoading}
              />
              <span>{perm}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={
            isLoading ||
            !selectedEmployee ||
            !username ||
            !password ||
            !isPasswordValid ||
            selectedPermissions.length === 0
          }
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving…' : 'Save Access'}
        </button>
      </div>
    </div>
  );
};

export default ManageAccess;
