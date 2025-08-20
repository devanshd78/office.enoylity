"use client";

import React, { FC, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
} from "react-icons/fa";
import { post } from "@/app/utils/apiClient";

/* ------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------- */
interface Item {
  description: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string; // "30-05-2025" or "2025-05-30" or ISO
  due_date: string;
  bill_to: {
    name: string;
    email?: string;
    address?: string;
    city?: string;
  };
  items: Item[];
  payment_method: number; // 0 = PayPal, 1 = bank transfer
  total_amount: number;
}

interface APIResponse {
  success: boolean;
  message?: string;
  data: {
    invoices: any[];
    page: number;
    per_page: number;
    total: number;
  };
}

/* ------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------- */
const isDateField = (f: keyof Invoice) => f === "invoice_date" || f === "due_date";

// Normalize "DD-MM-YYYY" | "YYYY-MM-DD" | ISO -> number key YYYYMMDD
const dateKey = (s?: string): number => {
  if (!s) return -Infinity;
  const dmy = /^(\d{2})-(\d{2})-(\d{4})$/;      // 30-05-2025
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/;      // 2025-05-30
  let y: number, m: number, d: number;

  if (dmy.test(s)) {
    const [, dd, mm, yyyy] = s.match(dmy)!;
    y = +yyyy; m = +mm; d = +dd;
  } else if (ymd.test(s)) {
    const [, yyyy, mm, dd] = s.match(ymd)!;
    y = +yyyy; m = +mm; d = +dd;
  } else {
    const dt = new Date(s);
    if (isNaN(dt.getTime())) return -Infinity;
    y = dt.getUTCFullYear(); m = dt.getUTCMonth() + 1; d = dt.getUTCDate();
  }
  return y * 10000 + m * 100 + d;
};

// Map raw API invoice to our Invoice type
const mapInvoice = (inv: any): Invoice => ({
  id: inv._id,
  invoice_number: inv.invoice_number,
  invoice_date: inv.invoice_date,
  due_date: inv.due_date,
  bill_to: inv.bill_to,
  items: inv.items,
  payment_method: inv.payment_method,
  total_amount: inv.total_amount,
});

/* ------------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------- */
const InvoiceHistoryPage: FC = () => {
  const router = useRouter();

  // table state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // controls
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Invoice>("invoice_date");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const per_page = 5;

  // when client-sorting dates, we keep a cached, fully-sorted list
  const [allInvoices, setAllInvoices] = useState<Invoice[] | null>(null);

  // permissions (read after mount)
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, any>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    setRole(localStorage.getItem("role"));
    const permsRaw = localStorage.getItem("permissions");
    setPermissions(permsRaw ? JSON.parse(permsRaw) : {});
  }, []);

  const canViewInvoices =
    role === "admin" || permissions["View Invoice details"] === 1;
  const canGenerateInvoice =
    role === "admin" || permissions["Generate invoice details"] === 1;

  /* ------------------------------------------------------------------
   * Fetch: server-side pagination (non-date sorts)
   * ---------------------------------------------------------------- */
  const fetchServerPaged = useCallback(
    async () => {
      setLoading(true);
      setError("");
      setAllInvoices(null); // not using client cache here

      try {
        const payload = { search, sortField, sortAsc, page, per_page };
        const result = await post<APIResponse>("/invoiceMHD/getlist", payload);
        if (!result.success) throw new Error(result.message || "Fetch failed");

        const mapped: Invoice[] = (result.data.invoices || []).map(mapInvoice);
        setInvoices(mapped);
        setTotal(result.data.total);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err?.message || "Failed to fetch invoices");
      } finally {
        setLoading(false);
      }
    },
    [search, sortField, sortAsc, page] // server sorts/paginates by these
  );

  /* ------------------------------------------------------------------
   * Fetch: get ALL pages (for date sorts) → sort client-side once
   * ---------------------------------------------------------------- */
  const fetchAllForDateSort = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const pageSize = 100; // batch size to reduce roundtrips
        let current = 1;
        let combined: Invoice[] = [];
        let totalCount = 0;

        // get first page to know total
        // (don’t rely on server sort here; we sort client-side)
        // still pass search so server filters
        // NOTE: omit sortField/sortAsc to avoid any server-side date sort issues
        // You can keep them; it won’t affect correctness.
        // But omitting avoids surprises if server sorts oddly.
        while (true) {
          const res = await post<APIResponse>("/invoiceMHD/getlist", {
            search,
            page: current,
            per_page: pageSize,
          });

          if (!res.success) throw new Error(res.message || "Fetch failed");

          const batch = (res.data.invoices || []).map(mapInvoice);
          combined = combined.concat(batch);
          totalCount = res.data.total ?? combined.length;

          if (batch.length === 0 || combined.length >= totalCount) break;
          current++;
        }

        // sort once, across the entire dataset
        const keyField = sortField === "due_date" ? "due_date" : "invoice_date";
        combined.sort((a, b) => {
          const ak = dateKey(a[keyField]);
          const bk = dateKey(b[keyField]);
          return sortAsc ? ak - bk : bk - ak;
        });

        setAllInvoices(combined);
        setTotal(totalCount);

        // slice for current page
        const start = (page - 1) * per_page;
        setInvoices(combined.slice(start, start + per_page));
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err?.message || "Failed to fetch invoices");
      } finally {
        setLoading(false);
      }
    },
    [search, sortField, sortAsc, page] // page is used for slicing initial view
  );

  /* ------------------------------------------------------------------
   * Fetch chooser
   *  - For date fields: fetch all then client-sort
   *  - Else: server sort/pagination
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (isDateField(sortField)) {
      // avoid refetching all on page-only changes
      fetchAllForDateSort();
    } else {
      fetchServerPaged();
    }
  }, [search, sortField, sortAsc, fetchAllForDateSort, fetchServerPaged]);

  // When using client-sorted dataset, change page by slicing only (no refetch)
  useEffect(() => {
    if (!allInvoices) return;
    const start = (page - 1) * per_page;
    setInvoices(allInvoices.slice(start, start + per_page));
  }, [page, per_page, allInvoices]);

  /* ------------------------------------------------------------------
   * UX helpers
   * ---------------------------------------------------------------- */
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const toggleRow = (id: string) =>
    setExpandedRow((prev) => (prev === id ? null : id));

  const handleSort = (field: keyof Invoice) => {
    if (field === sortField) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
    setPage(1); // reset to first page after sort change
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePage = (n: number) => {
    if (n < 1) return;
    setPage(n);
  };

  const totalPages = Math.max(1, Math.ceil(total / per_page));

  /* ------------------------------------------------------------------
   * Actions
   * ---------------------------------------------------------------- */
  const handleCopyToGenerate = (invoice: Invoice) => {
    router.push(
      `/invoice/mhdtech/generate?id=${encodeURIComponent(invoice.id)}`
    );
  };

  /* ------------------------------------------------------------------
   * Render
   * ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="mx-auto flex max-w-6xl flex-col rounded-lg bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-semibold">MHD Tech Invoice History</h1>

        {/* Header */}
        <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <input
            type="text"
            placeholder="Search by invoice # or client name"
            value={search}
            onChange={handleSearch}
            className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500 sm:w-64"
          />

          {canGenerateInvoice && (
            <Link
              href="/invoice/mhdtech/generate"
              className="flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2 text-white transition hover:bg-indigo-700"
            >
              <FaPlus className="mr-2" /> Generate Invoice
            </Link>
          )}
        </div>

        {/* Error / Loading / Empty */}
        {error && <p className="mb-4 text-center text-red-500">{error}</p>}
        {loading ? (
          <p className="py-4 text-center">Loading…</p>
        ) : !canViewInvoices ? (
          <p className="py-4 text-center text-gray-600">
            You do not have permission to view invoices.
          </p>
        ) : invoices.length === 0 ? (
          <p className="py-4 text-center text-gray-600">No invoices found.</p>
        ) : (
          <>
            {/* Mobile list */}
            <div className="sm:hidden">
              {invoices.map((inv) => (
                <div key={inv.id} className="mb-4 rounded-lg bg-white p-4 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{inv.invoice_number}</h2>
                      <p className="text-sm text-gray-500">{inv.invoice_date}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button onClick={() => toggleRow(inv.id)}>
                        {expandedRow === inv.id ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                      <button
                        onClick={() => handleCopyToGenerate(inv)}
                        className="rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                        title="Copy & Generate"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  </div>

                  {expandedRow === inv.id && (
                    <div className="mt-3 space-y-2">
                      <p>
                        <span className="font-medium">Client:</span>{" "}
                        {inv.bill_to.name}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {inv.bill_to.email}
                      </p>
                      <p>
                        <span className="font-medium">Total:</span>{" "}
                        ${inv.total_amount.toFixed(2)}
                      </p>
                      <p>
                        <span className="font-medium">Due Date:</span>{" "}
                        {inv.due_date}
                      </p>
                      <p>
                        <span className="font-medium">Payment Method:</span>{" "}
                        {inv.payment_method === 0 ? "PayPal" : "Bank Transfer"}
                      </p>
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
                              <td className="px-2 py-1 text-center">
                                {item.quantity}
                              </td>
                              <td className="px-2 py-1 text-right">
                                ${item.price.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden w-full overflow-x-auto sm:block">
              <table className="min-w-full border bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th
                      className="cursor-pointer px-3 py-2 text-left"
                      onClick={() => handleSort("invoice_number")}
                    >
                      <span className="flex items-center">
                        Invoice #
                        {sortField === "invoice_number" ? (
                          sortAsc ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        ) : (
                          <FaSort className="ml-1 text-gray-400" />
                        )}
                      </span>
                    </th>
                    <th
                      className="cursor-pointer px-3 py-2 text-left"
                      onClick={() => handleSort("invoice_date")}
                    >
                      <span className="flex items-center">
                        Date
                        {sortField === "invoice_date" ? (
                          sortAsc ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        ) : (
                          <FaSort className="ml-1 text-gray-400" />
                        )}
                      </span>
                    </th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Payment</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <React.Fragment key={inv.id}>
                      <tr className="border-t hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-2">
                          {inv.invoice_number}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {inv.invoice_date}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {inv.bill_to.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          ${inv.total_amount.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {inv.payment_method === 0 ? "PayPal" : "Bank Transfer"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 space-x-2">
                          <button
                            onClick={() => toggleRow(inv.id)}
                            title="Details"
                            className="text-indigo-600 hover:underline"
                          >
                            {expandedRow === inv.id ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                          <button
                            onClick={() => handleCopyToGenerate(inv)}
                            title="Copy & Generate"
                            className="text-green-600 hover:underline"
                          >
                            <FaEdit />
                          </button>
                        </td>
                      </tr>
                      {expandedRow === inv.id && (
                        <tr className="border-b bg-gray-50">
                          <td colSpan={6} className="px-3 py-2">
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-200">
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
                                      <td className="px-2 py-1 text-right">
                                        ${item.price.toFixed(2)}
                                      </td>
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
                  {!invoices.length && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center">
                        No invoices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-wrap justify-center">
            <button
              onClick={() => handlePage(page - 1)}
              disabled={page === 1}
              className="mx-1 rounded-lg border px-3 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => handlePage(i + 1)}
                className={`mx-1 rounded-lg border px-3 py-1 ${
                  page === i + 1 ? "bg-indigo-600 text-white" : ""
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePage(page + 1)}
              disabled={page === totalPages}
              className="mx-1 rounded-lg border px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceHistoryPage;
