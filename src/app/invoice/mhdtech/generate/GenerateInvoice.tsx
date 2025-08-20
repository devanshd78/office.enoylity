"use client";

import React, { FC, useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { postBlob, post } from "@/app/utils/apiClient";

interface Item {
  description: string;
  quantity: number;
  price: number;
}

type ApiEnvelope<T> = {
  data: T;
  success: boolean;
  message: string;
  status?: number;
};

type ApiItem = { description: string; price: number; quantity: number };
type ApiInvoice = {
  _id: string;
  bill_to?: { address?: string; email?: string; name?: string; phone?: string };
  createdAt?: string | null;
  due_date?: string | null;
  invoice_date?: string | null;
  invoice_number?: string;
  items?: ApiItem[];
  notes?: string;
  payment_method?: number;           // 0 PayPal, 1 Bank Transfer
  bank_note?: string;
  bank_Note?: string;
  total_amount?: number | null;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

// Parse "DD-MM-YYYY" | "YYYY-MM-DD" | ISO → "YYYY-MM-DD" or ""
const toInputDate = (raw?: string | null): string => {
  if (!raw) return "";
  const dmy = /^(\d{2})-(\d{2})-(\d{4})$/;
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/;
  if (dmy.test(raw)) {
    const [, dd, mm, yyyy] = raw.match(dmy)!;
    return `${yyyy}-${mm}-${dd}`;
  }
  if (ymd.test(raw)) {
    const [, yyyy, mm, dd] = raw.match(ymd)!;
    return `${yyyy}-${mm}-${dd}`;
  }
  const dt = new Date(raw);
  if (isNaN(dt.getTime())) return "";
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
};

// Format "YYYY-MM-DD" → "DD-MM-YYYY"
const toDdMmYyyy = (yyyyMmDd: string): string => {
  if (!yyyyMmDd) return "";
  const [y, m, d] = yyyyMmDd.split("-");
  if (!y || !m || !d) return "";
  return `${d}-${m}-${y}`;
};

const mapPaymentCodeToLabel = (code?: number) =>
  ({ 0: "PayPal", 1: "Bank Transfer" } as const)[Number(code) as 0 | 1] ?? "";

const mapPaymentLabelToCode = (label: "" | "PayPal" | "Bank Transfer") =>
  label === "PayPal" ? 0 : label === "Bank Transfer" ? 1 : 0;

const guessCityFromAddress = (address?: string): string => {
  if (!address) return "";
  const parts = address.split(",").map(s => s.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (/\d/.test(p)) continue;
    if (/^[A-Z]{2,3}$/.test(p)) continue;
    return p;
  }
  return "";
};

const GenerateInvoicePage: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id");

  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"" | "PayPal" | "Bank Transfer">("");
  const [bankNote, setBankNote] = useState("");
  const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, price: 0 }]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const showApiError = async (message: string) => {
    await Swal.fire({ icon: "error", title: "Error", text: message });
  };

  // Fetch existing invoice (edit-mode)
  useEffect(() => {
    if (!invoiceId) return;
    let alive = true;

    (async () => {
      try {
        // post<T> returns response.data, i.e. the envelope directly
        const envelope = await post<ApiEnvelope<ApiInvoice>>("/invoiceMHD/getinvoice", { id: invoiceId });
        const { success, message, data } = envelope;

        if (!success || !data) {
          throw new Error(message || "Failed to fetch invoice");
        }
        if (!alive) return;

        // Dates
        setBillDate(toInputDate(data.invoice_date));
        setDueDate(toInputDate(data.due_date));

        // Bill to
        const bill = data.bill_to ?? {};
        setClientName(bill.name ?? "");
        setClientAddress(bill.address ?? "");
        setClientCity(guessCityFromAddress(bill.address) || "");
        setClientEmail(bill.email ?? "");
        setClientPhone(bill.phone ?? "");

        // Payment + bank note
        setPaymentMethod(mapPaymentCodeToLabel(data.payment_method));
        setBankNote((data.bank_note ?? data.bank_Note ?? "").toString());

        // Items
        const its = Array.isArray(data.items) ? data.items : [];
        setItems(
          its.map((it: ApiItem) => ({
            description: it.description ?? "",
            quantity: Number(it.quantity ?? 0),
            price: Number(it.price ?? 0),
          }))
        );

        setNotes(data.notes ?? "");
      } catch (error: any) {
        console.error("Error fetching invoice data:", error);
        await showApiError(error?.message || "Unable to fetch invoice data.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [invoiceId]);

  // Dynamic form utilities
  const handleAddItem = useCallback(() => {
    setItems(prev => [...prev, { description: "", quantity: 1, price: 0 }]);
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setItems(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof Item, value: string | number) => {
    setItems(prev =>
      prev.map((it, i) =>
        i === index ? { ...it, [field]: field === "description" ? (value as string) : Number(value) } : it
      )
    );
  }, []);

  // Computed state (format to server’s expected DD-MM-YYYY)
  const formattedBillDate = useMemo(() => toDdMmYyyy(billDate), [billDate]);
  const formattedDueDate = useMemo(() => toDdMmYyyy(dueDate), [dueDate]);

  const isValid = useMemo(
    () => Boolean(billDate && dueDate && clientName && clientAddress && items.length > 0),
    [billDate, dueDate, clientName, clientAddress, items]
  );

  // Submit → Generate PDF
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      await Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill all required fields." });
      return;
    }

    const payload = {
      bill_to_name: clientName,
      bill_to_address: clientAddress,
      bill_to_city: clientCity,
      bill_to_email: clientEmail,
      bill_to_phone: clientPhone,
      invoice_date: formattedBillDate, // DD-MM-YYYY
      due_date: formattedDueDate,     // DD-MM-YYYY
      payment_method: mapPaymentLabelToCode(paymentMethod),
      bank_Note: paymentMethod === "Bank Transfer" ? bankNote : "",
      items,
      notes,
    };

    setIsLoading(true);
    try {
      const blob = await postBlob("/invoiceMHD/generate-invoice", payload, {
        validateStatus: () => true,
        responseType: "blob",
      });

      if (blob && typeof blob.type === "string" && blob.type.toLowerCase().includes("pdf")) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice_${payload.bill_to_name}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        await Swal.fire({
          icon: "success",
          title: "Invoice Generated",
          text: "Your PDF has been downloaded.",
          timer: 1500,
          showConfirmButton: false,
        });
        router.push("/invoice/mhdtech");
        return;
      }

      // Attempt to parse error blob
      const text = await blob.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Unexpected server response");
      }
      throw new Error(json.message || "Generation failed");
    } catch (err: any) {
      console.error(err);
      let msg = err?.message || "Error generating invoice.";

      if (err?.response?.data instanceof Blob) {
        try {
          const t = await err.response.data.text();
          const j = JSON.parse(t);
          msg = j.message || msg;
        } catch {/* ignore */}
      }

      await showApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="mx-auto mb-12 max-w-3xl rounded-lg bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-semibold">
          {invoiceId ? "Edit Invoice" : "Generate Invoice for MHD Tech"}
        </h1>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
          {/* Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col">
              <span>Bill Date</span>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="mt-1 rounded-lg border px-3 py-2"
              />
            </label>
            <label className="flex flex-col">
              <span>Due Date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 rounded-lg border px-3 py-2"
              />
            </label>
          </div>

          {/* Client Info */}
          <div className="space-y-2">
            <h2 className="font-bold">Client Information</h2>
            {[
              { label: "Name", value: clientName, setter: setClientName, type: "text" },
              { label: "Address", value: clientAddress, setter: setClientAddress, type: "text" },
              { label: "City", value: clientCity, setter: setClientCity, type: "text" },
              { label: "Email", value: clientEmail, setter: setClientEmail, type: "email" },
              { label: "Phone", value: clientPhone, setter: setClientPhone, type: "tel" },
            ].map(({ label, value, setter, type }) => (
              <label key={label} className="flex flex-col">
                <span>{label}</span>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="mt-1 rounded-lg border px-3 py-2"
                />
              </label>
            ))}
          </div>

          {/* Payment Method */}
          <label className="flex flex-col">
            <span>Payment Method</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="mt-1 rounded-lg border px-3 py-2"
            >
              <option value="" disabled>Select Payment Method</option>
              <option value="PayPal">PayPal</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </label>

          {/* Bank Note */}
          {paymentMethod === "Bank Transfer" && (
            <label className="flex flex-col">
              <span>Bank Note</span>
              <input
                type="text"
                value={bankNote}
                onChange={(e) => setBankNote(e.target.value)}
                className="mt-1 rounded-lg border px-3 py-2"
              />
            </label>
          )}

          {/* Items */}
          <div className="space-y-2">
            <h2 className="font-medium">Items</h2>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-3">
                <label className="flex flex-col sm:col-span-2">
                  <span>Description</span>
                  <input
                    type="text"
                    value={it.description}
                    onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                    className="mt-1 rounded-lg border px-3 py-2"
                  />
                </label>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="w-full rounded-lg bg-red-500 px-3 py-2 text-white"
                  >
                    Remove
                  </button>
                )}

                <label className="flex flex-col">
                  <span>Qty</span>
                  <input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                    className="mt-1 rounded-lg border px-3 py-2"
                  />
                </label>

                <label className="flex flex-col">
                  <span>Price</span>
                  <div className="mt-1 flex overflow-hidden rounded-lg border">
                    <span className="px-3 py-2">$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={it.price === 0 ? "" : it.price}
                      onChange={(e) => handleItemChange(idx, "price", Number(e.target.value))}
                      className="flex-1 px-3 py-2 outline-none"
                    />
                  </div>
                </label>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-white"
            >
              Add Item
            </button>
          </div>

          {/* Notes */}
          <label className="flex flex-col">
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 rounded-lg border px-3 py-2"
              rows={3}
            />
          </label>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/invoice/mhdtech" className="rounded-lg border px-4 py-2">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`rounded-lg px-4 py-2 text-white ${
                isValid && !isLoading ? "bg-indigo-600 hover:bg-indigo-700" : "cursor-not-allowed bg-gray-400"
              }`}
            >
              {isLoading ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateInvoicePage;
