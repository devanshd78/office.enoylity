"use client";

import React, { FC, useState, useEffect } from 'react';
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

interface PayslipEntry {
  payslipId: string;
  employeeId: string;
  filename: string;
  month: number;
  year: number;
  generated_on: string;
  lop_days: number;
  download_link: string;
}

const PayslipHistory: FC = () => {
  const [data, setData] = useState<PayslipEntry[]>([]);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const rowsPerPage = 5;
  const router = useRouter();

  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const permissions =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("permissions") || "{}")
      : {};

  const canViewPayslips =
    role === "admin" || permissions["View payslip details"] === 1;
  const canGeneratePayslips =
    role === "admin" || permissions["Generate Payslip details"] === 1;

  useEffect(() => {
    const fetchPayslips = async () => {
      const response = await fetch('http://127.0.0.1/employee/getpayslips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search,
          month: monthFilter,
          year: yearFilter,
          page: currentPage,
          pageSize: rowsPerPage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setData(data.payslips);
        setTotalRecords(data.pagination.totalRecords);
      } else {
        console.error('Failed to fetch payslips');
      }
    };

    fetchPayslips();
  }, [search, monthFilter, yearFilter, currentPage]);

  const handleGeneratePayslip = () => {
    router.push('/payslip/enoylity/generate');
  };

  const handleViewPdf = (entry: PayslipEntry) => {
    window.open(entry.download_link, '_blank');
  };

  const filteredData = data.filter((entry) => {
    const matchName = entry.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchMonth = monthFilter ? entry.month.toString() === monthFilter : true;
    const matchYear = yearFilter ? entry.year.toString() === yearFilter : true;
    return matchName && matchMonth && matchYear;
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="min-h-screen bg-indigo-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h1 className="text-xl font-semibold">Payslip History</h1>
            {
              canGeneratePayslips && (
                <Button onClick={handleGeneratePayslip}>Generate New Payslip</Button>
              )
            }
          </div>

          {
            canViewPayslips ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <Input
                    placeholder="Search by employee ID..."
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
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="whitespace-nowrap font-medium">{row.employeeId}</TableCell>
                          <TableCell>{row.month}</TableCell>
                          <TableCell>{row.year}</TableCell>
                          <TableCell>
                            <Button variant="outline" onClick={() => handleViewPdf(row)}>
                              View PDF
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {Math.ceil(totalRecords / rowsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        prev + 1 <= Math.ceil(totalRecords / rowsPerPage) ? prev + 1 : prev
                      )
                    }
                    disabled={currentPage >= Math.ceil(totalRecords / rowsPerPage)}
                    className="w-full sm:w-auto"
                  >
                    Next
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-lg text-gray-600">
                  You do not have permission to view payslip details.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PayslipHistory;
