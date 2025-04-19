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
import { Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

const dummyData = [
  { name: 'John Doe', permissions: ['View payslip details', 'Generate payslip'], username: '1' },
  { name: 'Jane Smith', permissions: ['View Invoice details', 'Add Employee details'], username: '2' },
  { name: 'Alice Johnson', permissions: ['View employee details', 'Generate invoice details'], username: '3' },
];

const UserAccess: FC = () => {
  const [data, setData] = useState(dummyData);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 5;
  const router = useRouter();

  const handleNavigate = () => {
    router.push('/useraccess/manage');
  };

  const handleDelete = (index: number) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        setData((prev) => prev.filter((_, i) => i !== index));
        Swal.fire('Deleted!', 'The user access has been deleted.', 'success');
      }
    });
  };

  const filteredData = data.filter((entry) =>
    entry.name.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  );

  return (
    <div className="min-h-screen bg-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow">
          <h1 className="text-xl font-semibold mb-4">User Access</h1>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <Input
              placeholder="Search user..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full sm:w-64"
            />
            <Button className="w-full sm:w-auto" onClick={handleNavigate}>Add User Access</Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="hidden md:table-cell">Username</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow key={index} className="align-top">
                    <TableCell className="font-medium whitespace-nowrap">{row.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.permissions.map((perm, i) => (
                          <Badge key={i} variant="secondary">{perm}</Badge>
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-gray-500 md:hidden">
                        Username: {row.username}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap hidden md:table-cell">{row.username}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="icon" onClick={() => alert('Edit functionality coming soon')}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
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

export default UserAccess;