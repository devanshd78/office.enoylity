"use client";

import React, { FC, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';

type Employee = {
  id: number;
  name: string;
  dob: string; // Date of Birth
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

// Sample data
const initialData: Employee[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    dob: '1990-05-12',
    dateOfJoining: '2020-03-01',
    department: 'Engineering',
    baseSalary: 60000,
    annualCtc: 800000,
    bankName: 'Bank A',
    ifsc: 'IFSC0001',
    accountNumber: '1234567890',
    address: '123 Main St, City, Country',
    panCard: 'ABCDE1234F',
    email: 'alice@example.com',
    phone: '+1-202-555-0143',
  },
];

const COLUMNS: Array<keyof Employee> = [
  'id',
  'name',
  'dob',
  'dateOfJoining',
  'department',
  'baseSalary',
  'annualCtc',
  'bankName',
  'ifsc',
  'accountNumber',
  'address',
  'panCard',
  'email',
  'phone',
];

// Shared class names
const styles = {
  container: 'min-h-screen bg-indigo-100 p-4',
  card: 'max-w-6xl mx-auto bg-white rounded-lg shadow p-6 flex flex-col',
  header: 'flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0',
  input: 'flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500',
  select: 'px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto',
  button: 'flex items-center px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition w-full sm:w-auto justify-center',
  tableWrapper: 'overflow-x-auto w-full',
  table: 'min-w-full bg-white border',
  th: 'px-3 py-2 text-left cursor-pointer whitespace-nowrap',
  td: 'px-3 py-2 whitespace-nowrap text-sm',
  pagination: 'mt-4 flex justify-center',
  pageBtn: 'px-3 py-1 border rounded-lg mx-1 disabled:opacity-50',
};

const EmployeesPage: FC = () => {
  const [data, setData] = useState<Employee[]>(initialData);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [sortField, setSortField] = useState<keyof Employee>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const perPage = 5;

  const toggleRow = useCallback((id: number) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  // Memoized filtered & sorted data
  const filtered = useMemo(() => {
    let arr = data;
    if (search) {
      const term = search.toLowerCase();
      arr = arr.filter(
        e =>
          e.name.toLowerCase().includes(term) ||
          e.email.toLowerCase().includes(term) ||
          e.phone.includes(term)
      );
    }
    if (filterDept) {
      arr = arr.filter(e => e.department === filterDept);
    }
    return [...arr].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [data, search, filterDept, sortField, sortAsc]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page]
  );

  const departments = useMemo(
    () => Array.from(new Set(data.map(e => e.department))),
    [data]
  );

  // Handlers
  const handleSort = useCallback(
    (field: keyof Employee) => {
      if (field === sortField) {
        setSortAsc(prev => !prev);
      } else {
        setSortField(field);
        setSortAsc(true);
      }
      setPage(1);
    },
    [sortField]
  );

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1);
    },
    []
  );

  const handleFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterDept(e.target.value);
      setPage(1);
    },
    []
  );

  const handlePage = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    []
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className="text-2xl font-semibold mb-4">Employees Data</h1>

        {/* Header */}
        <div className={styles.header}>
          <div className="flex flex-col sm:flex-row sm:space-x-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by name, email or phone"
              value={search}
              onChange={handleSearch}
              className={styles.input}
            />
            <select
              value={filterDept}
              onChange={handleFilter}
              className={styles.select}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <Link href="/employee/add" className={styles.button}>
            <FaPlus className="mr-2" /> Add Employee
          </Link>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
        <table className={styles.table}>
            <thead className="bg-gray-100">
              <tr>
                {COLUMNS.map(col => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className={`${styles.th} ${!['id','name','phone'].includes(col) ? 'hidden sm:table-cell' : ''}`}
                  >
                    <div className="flex items-center">
                      <span className="capitalize">{col}</span>
                      {sortField === col ? (
                        sortAsc ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                      ) : (
                        <FaSort className="ml-1 text-gray-400" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map(emp => (
                <React.Fragment key={emp.id}>
                  <tr className="border-t hover:bg-gray-50">
                    <td className={`${styles.td} flex items-center`}>
                      <button className="sm:hidden mr-2" onClick={() => toggleRow(emp.id)}>
                        {expandedRows.includes(emp.id) ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                      {emp.id}
                    </td>
                    <td className={styles.td}>{emp.name}</td>
                    <td className={styles.td}>{emp.phone}</td>
                    {COLUMNS.filter(col => !['id','name','phone'].includes(col)).map(col => (
                      <td key={col} className={`${styles.td} hidden sm:table-cell`}>{emp[col]}</td>
                    ))}
                  </tr>
                  {expandedRows.includes(emp.id) && (
                    <tr className="sm:hidden border-b">
                      <td colSpan={COLUMNS.length} className="px-3 py-2 bg-gray-50">
                        <div className="grid grid-cols-1 gap-2">
                          {COLUMNS.filter(col => !['id','name','phone'].includes(col)).map(col => (
                            <div key={col} className="flex justify-between">
                              <span className="font-medium capitalize">{col}</span>
                              <span>{emp[col]}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {!pageData.length && (
                <tr>
                  <td colSpan={COLUMNS.length} className="text-center py-4">No results found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page === 1}
            className={styles.pageBtn}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePage(i + 1)}
              className={`${styles.pageBtn} ${page === i + 1 ? 'bg-indigo-100' : ''}`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handlePage(page + 1)}
            disabled={page === totalPages}
            className={styles.pageBtn}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
