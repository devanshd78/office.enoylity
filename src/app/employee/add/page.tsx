"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type EmployeeInput = {
  name: string;
  dob: string;
  dateOfJoining: string;
  department: string;
  baseSalary: number;
  annualCtc: number;
  bankName: string;
  ifsc: string;
  accountNumber: string;
  address: string;
  panCard: string;
  email: string;
  phone: string;
};

export default function AddEmployeePage() {
  const router = useRouter();
  const [emp, setEmp] = useState<EmployeeInput>({
    name: "",
    dob: "",
    dateOfJoining: "",
    department: "",
    baseSalary: 0,
    annualCtc: 0,
    bankName: "",
    ifsc: "",
    accountNumber: "",
    address: "",
    panCard: "",
    email: "",
    phone: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: submit data to API or context
    router.push("/employee");
  };

  return (
    <div className="min-h-screen bg-indigo-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mb-10">
        <h1 className="text-3xl font-semibold mb-6">Add Employee</h1>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              required
              value={emp.name}
              onChange={(e) => setEmp({ ...emp, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={emp.dob}
                onChange={(e) => setEmp({ ...emp, dob: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Joining Date</label>
              <input
                type="date"
                required
                value={emp.dateOfJoining}
                onChange={(e) => setEmp({ ...emp, dateOfJoining: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              type="text"
              required
              value={emp.department}
              onChange={(e) => setEmp({ ...emp, department: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Salary & CTC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Base Salary</label>
              <input
                type="number"
                required
                value={emp.baseSalary}
                onChange={(e) => setEmp({ ...emp, baseSalary: Number(e.target.value) })}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Annual CTC</label>
              <input
                type="number"
                required
                value={emp.annualCtc}
                onChange={(e) => setEmp({ ...emp, annualCtc: Number(e.target.value) })}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <label className="block text-sm font-medium mb-1">Bank Name</label>
            <input
              type="text"
              required
              value={emp.bankName}
              onChange={(e) => setEmp({ ...emp, bankName: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">IFSC Code</label>
              <input
                type="text"
                required
                value={emp.ifsc}
                onChange={(e) => setEmp({ ...emp, ifsc: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <input
                type="text"
                required
                value={emp.accountNumber}
                onChange={(e) => setEmp({ ...emp, accountNumber: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Other Details */}
          <div>
            <label className="block text-sm font-medium mb-1">PAN Card Number</label>
            <input
              type="text"
              required
              value={emp.panCard}
              onChange={(e) => setEmp({ ...emp, panCard: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={emp.email}
                onChange={(e) => setEmp({ ...emp, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={emp.phone}
                onChange={(e) => setEmp({ ...emp, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              required
              value={emp.address}
              onChange={(e) => setEmp({ ...emp, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/employee"
              className="px-6 py-2 rounded-md border hover:bg-gray-100 text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
