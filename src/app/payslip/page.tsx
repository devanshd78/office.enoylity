"use client";

import React, { FC, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

const payslipData = [
  { name: 'John Doe', month: 'March', year: 2024, amount: '$3000' },
  { name: 'Jane Smith', month: 'March', year: 2024, amount: '$3500' },
  { name: 'Alice Johnson', month: 'February', year: 2024, amount: '$3200' },
];

const PayslipHistory: FC = () => {
  const [data, setData] = useState(payslipData);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 5;
  const router = useRouter();

  const handleGeneratePayslip = () => {
    router.push('/payslip/enoylity/generate');
  };

  const filteredData = data.filter((entry) => {
    const matchName = entry.name.toLowerCase().includes(search.toLowerCase());
    const matchMonth = monthFilter ? entry.month === monthFilter : true;
    const matchYear = yearFilter ? entry.year.toString() === yearFilter : true;
    return matchName && matchMonth && matchYear;
  });

  const paginatedData = filteredData.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );

  return (
    <div className="min-h-screen bg-indigo-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h1 className="text-xl font-semibold">Payslip History</h1>
            <Button onClick={handleGeneratePayslip}>Generate Payslip</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
            <Input
              placeholder="Filter by month..."
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full"
            />
            <Input
              placeholder="Filter by year..."
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="whitespace-nowrap font-medium">{row.name}</TableCell>
                    <TableCell>{row.month}</TableCell>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>{row.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
              className="w-full sm:w-auto"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage + 1} of {Math.ceil(filteredData.length / rowsPerPage)}
            </span>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((prev) =>
                  prev + 1 < Math.ceil(filteredData.length / rowsPerPage) ? prev + 1 : prev
                )
              }
              disabled={currentPage + 1 >= Math.ceil(filteredData.length / rowsPerPage)}
              className="w-full sm:w-auto"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipHistory;
