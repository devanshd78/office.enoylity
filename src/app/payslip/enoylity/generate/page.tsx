"use client";

import React, { FC, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const employeeList = [
  { name: 'John Doe', department: 'HR', designation: 'Manager', email: 'john@example.com', dob: '1990-05-15', doj: '2015-06-01', pan: 'ABCDE1234F', bankDetails: 'XYZ Bank, Account No: 1234567890' },
  { name: 'Jane Smith', department: 'Finance', designation: 'Analyst', email: 'jane@example.com', dob: '1988-08-22', doj: '2016-04-20', pan: 'FGHIJ5678K', bankDetails: 'ABC Bank, Account No: 9876543210' },
  { name: 'Alice Johnson', department: 'Engineering', designation: 'Developer', email: 'alice@example.com', dob: '1992-02-10', doj: '2018-01-15', pan: 'LMNOP6789Q', bankDetails: 'PQR Bank, Account No: 1122334455' },
];

const GeneratePayslip: FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [form, setForm] = useState({
    basic: '',
    hra: '',
    transport: '',
    medical: '',
    overtime: '',
    bonus: '',
    others: '',
    lop: '',
    paidDays: '',
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    alert(`Payslip generated for ${selectedEmployee.name}`);
    console.log({ employee: selectedEmployee, salary: form });
  };

  return (
    <div className="min-h-screen bg-indigo-100 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">Generate Employee Payslip</h1>

        <Select onValueChange={(value) => setSelectedEmployee(employeeList.find(e => e.name === value))}>
          <SelectTrigger className="mb-4">
            <SelectValue placeholder="Select Employee" />
          </SelectTrigger>
          <SelectContent>
            {employeeList.map((emp) => (
              <SelectItem key={emp.name} value={emp.name}>{emp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedEmployee && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <Input value={selectedEmployee.department} disabled placeholder="Department" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Designation</label>
              <Input value={selectedEmployee.designation} disabled placeholder="Designation" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input value={selectedEmployee.email} disabled placeholder="Email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <Input value={selectedEmployee.dob} disabled placeholder="Date of Birth" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Joining</label>
              <Input value={selectedEmployee.doj} disabled placeholder="Date of Joining" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PAN Card</label>
              <Input value={selectedEmployee.pan} disabled placeholder="PAN Card" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Details</label>
              <Input value={selectedEmployee.bankDetails} disabled placeholder="Bank Details" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Basic Salary (Monthly)</label>
            <Input name="basic" value={form.basic} onChange={handleInput} placeholder="Basic Salary (Monthly)" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">HRA</label>
            <Input name="hra" value={form.hra} onChange={handleInput} placeholder="HRA" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transport Allowance</label>
            <Input name="transport" value={form.transport} onChange={handleInput} placeholder="Transport Allowance" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Medical Allowance</label>
            <Input name="medical" value={form.medical} onChange={handleInput} placeholder="Medical Allowance" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Overtime</label>
            <Input name="overtime" value={form.overtime} onChange={handleInput} placeholder="Overtime" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bonus</label>
            <Input name="bonus" value={form.bonus} onChange={handleInput} placeholder="Bonus" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Other Allowances</label>
            <Input name="others" value={form.others} onChange={handleInput} placeholder="Other Allowances" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Loss of Pay (LOP)</label>
            <Input name="lop" value={form.lop} onChange={handleInput} placeholder="Loss of Pay (LOP)" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Paid Days</label>
            <Input name="paidDays" value={form.paidDays} onChange={handleInput} placeholder="Paid Days" />
          </div>
        </div>

        <Button onClick={handleSubmit} className="mt-6 w-full">Generate Payslip</Button>
      </div>
    </div>
  );
};

export default GeneratePayslip;
