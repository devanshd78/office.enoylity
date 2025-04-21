"use client";

import React, { FC, useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaTrash,
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Swal from "sweetalert2";

// Employee type definition
export interface Employee {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  adharnumber: string;
  pan_number: string;
  date_of_joining: string;
  annual_salary: number;
  monthly_salary: number;
  ctc: number;
  bank_details: { account_number: string; ifsc: string; bank_name: string };
  address: { line1: string; city: string; state: string; pin: string };
  department?: string;
  designation?: string;
}

// Columns to display in desktop view
const COLUMNS: Array<keyof Employee> = ['employeeId', 'name', 'email', 'phone', 'department', 'designation'];

const styles = {
  container: 'min-h-screen bg-indigo-100 p-4',
  card: 'max-w-7xl mx-auto bg-white rounded-lg shadow p-6 flex flex-col',
  header: 'flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0',
  input: 'flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mx-2',
  select: 'px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto',
  button: 'flex items-center px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition w-full sm:w-auto justify-center',
  tableWrapper: 'overflow-x-auto w-full',
  table: 'min-w-full bg-white border',
  th: 'px-3 py-2 text-left cursor-pointer whitespace-nowrap',
  td: 'px-3 py-2 whitespace-nowrap text-sm',
  pagination: 'mt-4 flex justify-center',
  pageBtn: 'px-3 py-1 border rounded-lg mx-1 disabled:opacity-50',
};

// Table header cell with sort
const HeaderCell: FC<{ field: keyof Employee; label: string; sortField: keyof Employee; sortAsc: boolean; onSort: (f: keyof Employee) => void }> = ({ field, label, sortField, sortAsc, onSort }) => (
  <th
    onClick={() => onSort(field)}
    className="px-3 py-2 text-left cursor-pointer whitespace-nowrap"
  >
    <div className="flex items-center select-none">
      <span>{label}</span>
      {sortField === field ? (
        sortAsc ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
      ) : (
        <FaSort className="ml-1 text-gray-400" />
      )}
    </div>
  </th>
);

// Desktop table row
const DesktopRow: FC<{ emp: Employee; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ emp, onEdit, onDelete }) => (
  <tr className="border-t hover:bg-gray-50">
    {COLUMNS.map(col => (
      <td key={col} className="px-3 py-2 whitespace-nowrap text-sm">
        {String(emp[col] ?? '')}
      </td>
    ))}
    <td className="px-3 py-2 whitespace-nowrap text-sm flex items-center space-x-2">
      <button onClick={() => onEdit(emp.employeeId)} className="text-indigo-600 hover:text-indigo-800">
        <FaEdit />
      </button>
      <button onClick={() => onDelete(emp.employeeId)} className="text-red-600 hover:text-red-800">
        <FaTrash />
      </button>
    </td>
  </tr>
);

// Mobile expandable row
const MobileRow: FC<{ emp: Employee; expanded: boolean; onToggle: () => void; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ emp, expanded, onToggle, onEdit, onDelete }) => (
  <>
    <div className="flex justify-between items-center border-t py-2">
      <div>
        <div className="font-semibold">{emp.name}</div>
        <div className="text-sm text-gray-600">{emp.email}</div>
      </div>
      <div className="flex space-x-2 mt-2">
        <button onClick={() => onEdit(emp.employeeId)} className="text-indigo-600 hover:text-indigo-800">
          <FaEdit />
        </button>
        <button onClick={() => onDelete(emp.employeeId)} className="text-red-600 hover:text-red-800">
          <FaTrash />
        </button>
      </div>
      <button onClick={onToggle} className="p-2">
        {expanded ? <FaChevronUp /> : <FaChevronDown />}
      </button>
    </div>
    {expanded && (
      <div className="bg-gray-50 p-3 space-y-1 text-sm">
        <div><strong>ID:</strong> {emp.employeeId}</div>
        <div><strong>Phone:</strong> {emp.phone}</div>
        <div><strong>DOB:</strong> {emp.dob}</div>
        <div><strong>CTC:</strong> {emp.annual_salary}</div>
        <div><strong>Bank:</strong> {emp.bank_details.bank_name} ({emp.bank_details.ifsc})</div>
        <div><strong>Address:</strong> {emp.address.line1}, {emp.address.city}</div>
        {emp.department && <div><strong>Dept:</strong> {emp.department}</div>}
        {emp.designation && <div><strong>Role:</strong> {emp.designation}</div>}
      </div>
    )}
  </>
);

// Main EmployeesPage component
const EmployeesPage: FC = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof Employee>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const perPage = 10;

  const { data, totalPages } = useEmployees(search, page, perPage);

  function useEmployees(search: string, page: number, pageSize: number) {
    const [data, setData] = useState<Employee[]>([]);
    const [totalPages, setTotalPages] = useState(1);
  
    async function fetchData() {
      try {
        const res = await fetch('http://127.0.0.1:5000/employee/getlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ search, page, pageSize }),
        });
        const result = await res.json();
        if (result.success) {
          setData(result.data.employees);
          setLoading(false);
          setTotalPages(result.data.totalPages);
          if (result.data.employees.length === 0) {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'info',
              title: 'No employees found.',
              showConfirmButton: false,
              timer: 1500
            });
          }
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to fetch employee data.', 'error');
      }
    }
    useEffect(() => {
      fetchData();
    }, [search, page, pageSize]);
    
    return { data, totalPages };
  }
  
  // Pagination component
  const Pagination: FC<{ page: number; total: number; onPage: (n: number) => void }> = ({ page, total, onPage }) => (
    <div className="flex justify-center space-x-2 mt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Prev
      </button>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onPage(i + 1)}
          className={`px-3 py-1 border rounded ${page === i + 1 ? 'bg-indigo-100' : ''}`}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === total}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );

  
  const sorted = useMemo(
    () => [...data].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    }),
    [data, sortField, sortAsc]
  );

  const pageData = useMemo(
    () => sorted.slice((page - 1) * perPage, page * perPage),
    [sorted, page]
  );

  const onSort = (field: keyof Employee) => {
    if (field === sortField) setSortAsc(prev => !prev);
    else { setSortField(field); setSortAsc(true); }
    setPage(1);
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEdit = (id: string) => {
    router.push(`employee/addedit?employeeid=${id}`);
  };  

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this employee?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });
  
    if (!result.isConfirmed) return;
  
    try {
      const res = await fetch('http://127.0.0.1:5000/employee/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: id }),
      });
      const result = await res.json();
      if (result.success) {
        Swal.fire('Deleted!', 'Employee has been deleted.', 'success');
        router.refresh();
        setSearch('');
        setPage(1);
      } else {
        Swal.fire('Error', `Delete failed: ${result.message}`, 'error');
      }
    } catch (err) {
      console.error('Delete error', err);
      Swal.fire('Error', 'Failed to delete employee.', 'error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className={styles.input}
          />
          <Link href="/employee/addedit" className={styles.button}>
            <FaPlus className="mr-2" /> Add Employee
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-4">
            <div className="spinner-border text-indigo-500" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No employees found.
          </div>
        ) : (
          <>
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className={styles.table}>
            <thead className="bg-gray-100">
              <tr>
                {COLUMNS.map(col => (
                  <HeaderCell
                    key={col}
                    field={col}
                    label={col}
                    sortField={sortField}
                    sortAsc={sortAsc}
                    onSort={onSort}
                  />
                ))}
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(emp => (
                <DesktopRow
                  key={emp.employeeId}
                  emp={emp}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden">
          {pageData.map(emp => (
            <MobileRow
              key={emp.employeeId}
              emp={emp}
              expanded={expanded[emp.employeeId] || false}
              onToggle={() => toggleExpand(emp.employeeId)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Pagination */}
        <Pagination page={page} total={totalPages} onPage={setPage} />
        </>
        )}
      </div>
    </div>
  );
};

export default EmployeesPage;
