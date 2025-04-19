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

// Invoice item type
type Item = {
  description: string;
  quantity: number;
  price: number;
};

// Invoice type extended with full details
type Invoice = {
  id: string;
  date: string;
  client_name: string;
  client_address: string;
  client_email: string;
  client_phone: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  items: Item[];
  bank_name: string;
  bank_account: string;
  notes: string;
  paypal_fee: number;
};

// Example invoice data
const initialInvoices: Invoice[] = [
  {
    id: 'INV-1001',
    date: '2025-01-15',
    client_name: 'John Doe',
    client_address: '123 Elm Street, Springfield, USA',
    client_email: 'john.doe@example.com',
    client_phone: '9876543210',
    amount: 670.0,
    status: 'Paid',
    items: [
      { description: 'Website Design', quantity: 1, price: 500.0 },
      { description: 'Hosting (1 Year)', quantity: 1, price: 120.0 },
      { description: 'Maintenance (3 Months)', quantity: 3, price: 50.0 },
    ],
    bank_name: 'ABC Bank',
    bank_account: '12345678901234',
    notes: 'Thank you for your business. Payment is due within 15 days.',
    paypal_fee: 100,
  },
  // ... other invoices
];

const InvoiceHistoryPage: FC = () => {
  const [invoices] = useState<Invoice[]>(initialInvoices);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<keyof Invoice>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const perPage = 5;

  const toggleRow = useCallback((id: string) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  // Filter, search, sort
  const filtered = useMemo(() => {
    let arr = invoices;
    if (search) {
      const term = search.toLowerCase();
      arr = arr.filter(i =>
        i.id.toLowerCase().includes(term) ||
        i.client_name.toLowerCase().includes(term)
      );
    }
    if (filterStatus) arr = arr.filter(i => i.status === filterStatus);
    return [...arr].sort((a, b) => {
      const aVal = a[sortField] as any;
      const bVal = b[sortField] as any;
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [invoices, search, filterStatus, sortField, sortAsc]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSort = useCallback(
    (field: keyof Invoice) => {
      if (field === sortField) setSortAsc(prev => !prev);
      else { setSortField(field); setSortAsc(true); }
      setPage(1);
    }, [sortField]
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
    setPage(1);
  }, []);

  const handlePage = useCallback((n: number) => setPage(n), []);

  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6 flex flex-col">
        <h1 className="text-2xl font-semibold mb-4">Enoylity Tech Invoice History</h1>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:space-x-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by ID or client"
              value={search}
              onChange={handleSearch}
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={filterStatus}
              onChange={handleFilter}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <Link
            href="/invoice/enoylitytech/generate"
            className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition w-full sm:w-auto justify-center"
          >
            <FaPlus className="mr-2" /> Generate Invoice
          </Link>
        </div>

        {/* Mobile List */}
        <div className="sm:hidden">
          {pageData.map(inv => (
            <div key={inv.id} className="bg-white p-4 mb-4 rounded-lg shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">{inv.id}</h2>
                  <p className="text-sm text-gray-500">{inv.date}</p>
                </div>
                <button onClick={() => toggleRow(inv.id)}>
                  {expandedRows.includes(inv.id) ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              {expandedRows.includes(inv.id) && (
                <div className="mt-3 space-y-2">
                  <p><span className="font-medium">Client:</span> {inv.client_name}</p>
                  <p><span className="font-medium">Email:</span> {inv.client_email}</p>
                  <p><span className="font-medium">Phone:</span> {inv.client_phone}</p>
                  <p><span className="font-medium">Status:</span> {inv.status}</p>
                  <p><span className="font-medium">Total:</span> ${inv.amount.toFixed(2)}</p>
                  <p className="font-medium">Items:</p>
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 text-left">Description</th>
                        <th className="px-2 py-1">Qty</th>
                        <th className="px-2 py-1">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.items.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1">{item.description}</td>
                          <td className="px-2 py-1 text-center">{item.quantity}</td>
                          <td className="px-2 py-1 text-right">${item.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p><span className="font-medium">Bank:</span> {inv.bank_name} ({inv.bank_account})</p>
                  <p><span className="font-medium">Notes:</span> {inv.notes}</p>
                  <p><span className="font-medium">PayPal Fee:</span> ${inv.paypal_fee.toFixed(2)}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left cursor-pointer" onClick={() => handleSort('id')}>
                  <div className="flex items-center">
                    ID {sortField === 'id' ? (sortAsc ? <FaSortUp /> : <FaSortDown />) : <FaSort className="text-gray-400" />}
                  </div>
                </th>
                <th className="px-3 py-2 text-left cursor-pointer" onClick={() => handleSort('date')}>
                  <div className="flex items-center">
                    Date {sortField === 'date' ? (sortAsc ? <FaSortUp /> : <FaSortDown />) : <FaSort className="text-gray-400" />}
                  </div>
                </th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(inv => (
                <React.Fragment key={inv.id}>
                  <tr className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">{inv.id}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{inv.date}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{inv.client_name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">${inv.amount.toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{inv.status}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button onClick={() => toggleRow(inv.id)}>
                        {expandedRows.includes(inv.id) ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </td>
                  </tr>
                  {expandedRows.includes(inv.id) && (
                    <tr className="border-b bg-gray-50">
                      <td colSpan={6} className="px-3 py-2">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-200">
                              <tr>
                                <th className="px-2 py-1 text-left">Description</th>
                                <th className="px-2 py-1">Qty</th>
                                <th className="px-2 py-1">Price</th>
                                <th className="px-2 py-1">Bank</th>
                                <th className="px-2 py-1">Notes</th>
                                <th className="px-2 py-1">PayPal Fee</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inv.items.map((item, idx) => (
                                <tr key={idx} className="border-t">
                                  <td className="px-2 py-1">{item.description}</td>
                                  <td className="px-2 py-1 text-center">{item.quantity}</td>
                                  <td className="px-2 py-1 text-right">${item.price.toFixed(2)}</td>
                                  {idx === 0 && (
                                    <>
                                      <td className="px-2 py-1" rowSpan={inv.items.length}>{inv.bank_name} ({inv.bank_account})</td>
                                      <td className="px-2 py-1" rowSpan={inv.items.length}>{inv.notes}</td>
                                      <td className="px-2 py-1 text-right" rowSpan={inv.items.length}>${inv.paypal_fee.toFixed(2)}</td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {!pageData.length && (
                <tr><td colSpan={6} className="text-center py-4">No invoices found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-center">
          <button onClick={() => handlePage(page-1)} disabled={page===1} className="px-3 py-1 border rounded-lg mx-1 disabled:opacity-50">Prev</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => handlePage(i+1)} className={`px-3 py-1 border rounded-lg mx-1 ${page===i+1 ? 'bg-indigo-100' : ''}`}>{i+1}</button>
          ))}
          <button onClick={() => handlePage(page+1)} disabled={page===totalPages} className="px-3 py-1 border rounded-lg mx-1 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceHistoryPage;