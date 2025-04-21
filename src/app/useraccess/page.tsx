"use client";

import React, { FC, useEffect, useState } from 'react';
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

interface Subadmin {
  name: string;
  permissions: Record<string, number>;
  username: string;
  employeeId: string;
  subadminId: string;
}

const UserAccess: FC = () => {
  const [data, setData] = useState<Subadmin[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);
  const rowsPerPage = 5;
  const router = useRouter();

  const fetchSubadmins = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/subadmin/getlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search,
          page: currentPage + 1,
          pageSize: rowsPerPage
        })
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data.subadmins || []);
        setTotal(result.data.total || 0);
      } else {
        console.error('Error fetching subadmins:', result.message);
      }
    } catch (error) {
      console.error('API error:', error);
    }
  };
  

  useEffect(() => {
    fetchSubadmins();
  }, [currentPage, search]);

  const handleNavigate = () => {
    router.push('/useraccess/manage');
  };

  const handleDelete = (subadminId: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will remove the subadmin access.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch('http://127.0.0.1:5000/subadmin/deleterecord', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subadminId })
          });
          const resData = await res.json();
          if (res.ok) {
            Swal.fire('Deleted!', 'Subadmin removed successfully.', 'success');
            fetchSubadmins(); // Refresh list
          } else {
            Swal.fire('Error', resData.error || 'Failed to delete', 'error');
          }
        } catch (error) {
          console.error(error);
          Swal.fire('Error', 'API error occurred', 'error');
        }
      }
    });
  };

  const paginatedData = data;

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
            <Button className="w-full sm:w-auto" onClick={handleNavigate}>
              Add User Access
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="hidden md:table-cell">Username</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow key={index} className="align-top">
                    <TableCell className="font-medium whitespace-nowrap">{row.employeeId}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(row.permissions)
                          .filter(([, val]) => val)
                          .map(([perm], i) => (
                            <Badge key={i} variant="secondary">{perm}</Badge>
                          ))}
                      </div>
                      <div className="mt-2 text-sm text-gray-500 md:hidden">
                        Username: {row.username}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap hidden md:table-cell">
                      {row.username}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="icon" onClick={() => alert('Edit functionality coming soon')}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(row.subadminId)}
                        >
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
              Page {currentPage + 1}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="w-full sm:w-auto"
              disabled={(currentPage + 1) * rowsPerPage >= total}
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
