"use client";

import React, { FC, useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

type EmployeeInput = {
  name: string;
  dob: string;
  dateOfJoining: string;
  department: string;
  designation: string;
  baseSalary: number;
  annualCtc: number;
  bankDetails: {
    bank_name: string;
    ifsc: string;
    account_number: string;
  };
  address: {
    line1: string;
    city: string;
    state: string;
    pin: string;
    cities: string[];
  };
  panCard: string;
  email: string;
  phone: string;
  adharnumber: string;
};

export default function AddEditEmployeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employeeId");
  const isEdit = Boolean(employeeId);

  const [emp, setEmp] = useState<EmployeeInput>({
    name: "",
    dob: "",
    dateOfJoining: "",
    department: "",
    designation: "",
    baseSalary: 0,
    annualCtc: 0,
    bankDetails: {
      bank_name: "",
      ifsc: "",
      account_number: "",
    },
    address: {
      line1: "",
      city: "",
      state: "",
      pin: "",
      cities: [],
    },
    panCard: "",
    email: "",
    phone: "",
    adharnumber: "",
  });

  // Fetch existing employee if editing
  useEffect(() => {
    console.log("Fetching employee data for ID:", employeeId);
    
    if (!isEdit) return;
    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/employee/getrecord?employeeId=${employeeId}`);
        const result = await res.json();
        if (result.success) {
          const e = result.data.employee;
          setEmp({
            name: e.name || "",
            dob: e.dob || "",
            dateOfJoining: e.date_of_joining || "",
            department: e.department || "",
            designation: e.designation || "",
            baseSalary: e.monthly_salary || 0,
            annualCtc: e.annual_salary || 0,
            bankDetails: {
              bank_name: e.bank_details.bank_name || "",
              ifsc: e.bank_details.ifsc || "",
              account_number: e.bank_details.account_number || "",
            },
            address: {
              line1: e.address.line1 || "",
              city: e.address.city || "",
              state: e.address.state || "",
              pin: e.address.pin || "",
              cities: e.address.cities || [],
            },
            panCard: e.pan_number || "",
            email: e.email || "",
            phone: e.phone || "",
            adharnumber: e.adharnumber || "",
          });
        } else {
          alert(result.message);
          router.back();
        }
      } catch (err) {
        console.error(err);
        router.back();
      }
    })();
  }, [employeeId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
  
    const payload = {
      ...(isEdit && { employeeId }),
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      dob: emp.dob,
      adharnumber: emp.adharnumber,
      pan_number: emp.panCard,
      date_of_joining: emp.dateOfJoining,
      annual_salary: emp.annualCtc,
      base_salary: emp.baseSalary,
      department: emp.department,
      designation: emp.designation,
      bank_details: {
        account_number: emp.bankDetails.account_number,
        ifsc: emp.bankDetails.ifsc,
        bank_name: emp.bankDetails.bank_name,
      },
      address: {
        line1: emp.address.line1,
        city: emp.address.city,
        state: emp.address.state,
        pin: emp.address.pin,
        cities: emp.address.cities,
      },
    };
  
    try {
      const url = isEdit
        ? 'http://localhost:5000/employee/update'
        : 'http://localhost:5000/employee/SaveRecord';
  
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const result = await res.json();
  
      if (res.ok && result.success) {
        await Swal.fire({
          icon: 'success',
          title: isEdit ? 'Employee Updated' : 'Employee Added',
          text: isEdit
            ? 'Employee record updated successfully!'
            : 'Employee record added successfully!',
          confirmButtonColor: '#6366f1',
        });
        router.push('/employee');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: result.message || 'Operation failed.',
          confirmButtonColor: '#ef4444',
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Something went wrong',
        text: 'Please try again later.',
        confirmButtonColor: '#ef4444',
      });
    }
  };  

  return (
    <div className="min-h-screen bg-indigo-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mb-10">
      <h1 className="text-3xl font-semibold mb-6">{isEdit ? 'Edit' : 'Add'} Employee</h1>
      <form onSubmit={handleSubmit} className="space-y-6">

          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Aadhar Number</label>
              <input
                type="text"
                required
                value={emp.adharnumber || ""}
                onChange={(e) => setEmp({ ...emp, adharnumber: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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
          </div>

          {/* Job Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
            <div>
              <label className="block text-sm font-medium mb-1">Designation</label>
              <input
                type="text"
                required
                value={emp.designation}
                onChange={(e) => setEmp({ ...emp, designation: e.target.value })}
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

          {/* Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Base Salary */}
            <div>
              <label className="block text-sm font-medium mb-1">Base Salary</label>
              <input
                type="number"
                required
                value={emp.baseSalary}
                onChange={e => {
                  const base = Number(e.target.value);
                  setEmp({
                    ...emp,
                    baseSalary: base,
                    annualCtc: base * 12,          // <— update CTC here
                  });
                }}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Annual CTC (read‑only) */}
            <div>
              <label className="block text-sm font-medium mb-1">Annual CTC</label>
              <input
                type="number"
                required
                readOnly                        // <— use readOnly, not disabled
                value={emp.annualCtc}          // <— now comes from state
                className="w-full px-4 py-2 border bg-gray-100 rounded-md"
              />
            </div>

          </div>

          {/* Bank Details */}
          <div>
            <label className="block text-sm font-medium mb-2">Bank Details</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <input
                type="text"
                required
                placeholder="Bank Name"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                value={emp.bankDetails.bank_name}
                onChange={(e) => setEmp({ ...emp, bankDetails: { ...emp.bankDetails, bank_name: e.target.value } })}
              />
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="IFSC"
                value={emp.bankDetails.ifsc}
                onChange={(e) => setEmp({ ...emp, bankDetails: { ...emp.bankDetails, ifsc: e.target.value } })}
              />
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="Account Number"
                value={emp.bankDetails.account_number}
                onChange={(e) => setEmp({ ...emp, bankDetails: { ...emp.bankDetails, account_number: e.target.value } })}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="Address Line 1"
                value={emp.address.line1}
                onChange={(e) => setEmp({ ...emp, address: { ...emp.address, line1: e.target.value } })}
              />
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="City"
                value={emp.address.city}
                onChange={(e) => setEmp({ ...emp, address: { ...emp.address, city: e.target.value } })}
              />
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="State"
                value={emp.address.state}
                onChange={(e) => setEmp({ ...emp, address: { ...emp.address, state: e.target.value } })}
              />
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="PIN Code"
                value={emp.address.pin}
                onChange={(e) => setEmp({ ...emp, address: { ...emp.address, pin: e.target.value } })}
              />
            </div>
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