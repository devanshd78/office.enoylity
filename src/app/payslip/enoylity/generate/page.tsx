"use client";

import React, { FC, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";

interface BankDetails {
  account_number: string;
  [key: string]: any;
}

interface Employee {
  employeeId: string;
  name: string;
  email: string;
  dob: string;
  pan_number: string;
  date_of_joining: string;
  designation: string;
  department: string;
  bank_details?: BankDetails;
}

interface SalaryComponent {
  name: string;
  amount: number;
}

const GeneratePayslip: FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  const [form, setForm] = useState<Record<string, string>>({
    basic: "",
    hra: "",
    transport: "",
    medical: "",
    overtime: "",
    bonus: "",
    others: "",
    lop: "",
    paidDays: "",
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.post("http://127.0.0.1:5000/employee/getlist", {
          page: 1,
          pageSize: 100,
        });
        if (res.data.success) {
          setEmployees(res.data.data.employees);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear) {
      alert("Please select employee, month, and year.");
      return;
    }

    const monthPayload = `${selectedMonth}-${selectedYear}`;
    const todayStr = new Date().toLocaleDateString("en-GB"); // DD-MM-YYYY

    const salary_structure: SalaryComponent[] = [
      { name: "House Rent Allowance", amount: parseFloat(form.hra || "0") },
      { name: "Conveyance Allowance", amount: parseFloat(form.transport || "0") },
      { name: "MED ALL", amount: parseFloat(form.medical || "0") },
      { name: "Overtime Bonas", amount: parseFloat(form.overtime || "0") },
      { name: "Performance Bonas", amount: parseFloat(form.bonus || "0") },
      { name: "OTH ALL", amount: parseFloat(form.others || "0") },
    ];

    const payload = {
      employee_id: selectedEmployee.employeeId,
      lop: form.lop,
      date: todayStr,
      month: monthPayload,
      salary_structure,
    };

    try {
      const res = await axios.post("http://127.0.0.1:5000/employee/salaryslip", payload, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `salary_slip_${selectedEmployee.employeeId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating payslip:", error);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-100 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">Generate Employee Payslip</h1>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Select onValueChange={(value) => setSelectedEmployee(employees.find(e => e.employeeId === value) || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.employeeId} value={emp.employeeId}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setSelectedMonth(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const month = String(i + 1).padStart(2, "0");
                const monthName = new Date(0, i).toLocaleString("default", { month: "long" });
                return (
                  <SelectItem key={month} value={month}>
                    {monthName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setSelectedYear(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Employee Details */}
        {selectedEmployee && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[
              { label: "Department", value: selectedEmployee.department },
              { label: "Designation", value: selectedEmployee.designation },
              { label: "Email", value: selectedEmployee.email },
              { label: "Date of Birth", value: selectedEmployee.dob },
              { label: "Date of Joining", value: selectedEmployee.date_of_joining },
              { label: "PAN Number", value: selectedEmployee.pan_number },
              {
                label: "Bank Account Number",
                value: selectedEmployee.bank_details?.account_number || "",
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <Input disabled value={value} placeholder={label} />
              </div>
            ))}
          </div>
        )}

        {/* Salary Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {[
            { name: "basic", label: "Basic Salary (Monthly)" },
            { name: "hra", label: "HRA" },
            { name: "transport", label: "Transport Allowance" },
            { name: "medical", label: "Medical Allowance" },
            { name: "overtime", label: "Overtime" },
            { name: "bonus", label: "Bonus" },
            { name: "others", label: "Other Allowances" },
            { name: "lop", label: "Loss of Pay (LOP)" },
            { name: "paidDays", label: "Paid Days" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <Input
                name={name}
                value={form[name]}
                onChange={handleInput}
                placeholder={label}
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSubmit} className="mt-6 w-full">
          Generate Payslip
        </Button>
      </div>
    </div>
  );
};

export default GeneratePayslip;
