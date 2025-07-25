"use client";

import React, {
  FC,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { postBlob, post } from "@/app/utils/apiClient";

interface Item {
  description: string;
  quantity: number;
  price: number;
}

/**
 * GenerateInvoicePage – create / edit invoices for MHD Tech
 *
 * 🚀 2025‑07‑25 — Error‑handling refresh
 * ------------------------------------------------------------
 * • Preserves previous improvements (handles success:false, parses
 *   JSON error blobs, etc.)
 * • Adds Axios‑error path parsing so we surface server‑side
 *   `message` even when the request is rejected (HTTP 4xx).
 * • Brings back `validateStatus` flag so error payloads arrive as
 *   blobs we can inspect before Axios throws.
 */
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
  const [paymentMethod, setPaymentMethod] = useState<
    "" | "PayPal" | "Bank Transfer"
  >("");
  const [items, setItems] = useState<Item[]>([
    { description: "", quantity: 1, price: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [bankNote, setBankNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* ------------------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------------- */
  const convertToInputDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  const showApiError = async (message: string) => {
    await Swal.fire({ icon: "error", title: "Error", text: message });
  };

  /* ------------------------------------------------------------------
   *  Fetch existing invoice (edit‑mode)
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!invoiceId) return;

    (async () => {
      try {
        const res = await post("/invoiceMHD/getinvoice", { id: invoiceId });

        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to fetch invoice");
        }

        const data = res.data.data;
        setBillDate(convertToInputDate(data.invoice_date));
        setDueDate(convertToInputDate(data.due_date));
        setClientName(data.bill_to?.name || "");
        setClientAddress(data.bill_to?.address || "");
        setClientCity("");
        setClientEmail(data.bill_to?.email || "");
        setClientPhone(data.bill_to?.phone || "");
        setPaymentMethod(data.payment_method === 0 ? "PayPal" : "Bank Transfer");
        setItems(data.items || []);
        setNotes(data.notes || "");
      } catch (error: any) {
        console.error("Error fetching invoice data:", error);
        showApiError(error.message || "Unable to fetch invoice data.");
      }
    })();
  }, [invoiceId]);

  /* ------------------------------------------------------------------
   *  Dynamic form utilities
   * ---------------------------------------------------------------- */
  const handleAddItem = useCallback(() => {
    setItems((prev) => [...prev, { description: "", quantity: 1, price: 0 }]);
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }, []);

  const handleItemChange = useCallback(
    (index: number, field: keyof Item, value: string | number) => {
      setItems((prev) =>
        prev.map((it, i) =>
          i === index ? { ...it, [field]: field === "description" ? value : Number(value) } : it
        )
      );
    },
    []
  );

  /* ------------------------------------------------------------------
   *  Computed state
   * ---------------------------------------------------------------- */
  const formattedBillDate = useMemo(() => {
    if (!billDate) return "";
    const d = new Date(billDate);
    return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getFullYear()}`;
  }, [billDate]);

  const formattedDueDate = useMemo(() => {
    if (!dueDate) return "";
    const d = new Date(dueDate);
    return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getFullYear()}`;
  }, [dueDate]);

  const isValid = useMemo(
    () => billDate && dueDate && clientName && clientAddress && items.length > 0,
    [billDate, dueDate, clientName, clientAddress, items]
  );

  /* ------------------------------------------------------------------
   *  Submit → Generate PDF
   * ---------------------------------------------------------------- */
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
      invoice_date: formattedBillDate,
      due_date: formattedDueDate,
      payment_method: paymentMethod === "PayPal" ? 0 : paymentMethod === "Bank Transfer" ? 1 : 2,
      bank_Note: paymentMethod === "Bank Transfer" ? bankNote : "",
      items,
      notes,
    };

    setIsLoading(true);
    try {
      /**
       * Always allow non‑2xx so we can inspect the blob ourselves.
       */
      const blob = await postBlob("/invoiceMHD/generate-invoice", payload, {
        validateStatus: () => true,
        responseType: "blob",
      });

      if (blob.type === "application/pdf") {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice_${payload.bill_to_name}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        await Swal.fire({ icon: "success", title: "Invoice Generated", text: "Your PDF has been downloaded.", timer: 1500, showConfirmButton: false });
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

      // AxiosError path: response.data may be Blob
      if (err?.response?.data instanceof Blob) {
        try {
          const t = await err.response.data.text();
          const j = JSON.parse(t);
          msg = j.message || msg;
        } catch {/* ignore parse errors */}
      }

      showApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") e.preventDefault();
  };

  /* ------------------------------------------------------------------
   *  JSX
   * ---------------------------------------------------------------- */
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
                className="mt-1 rounded
-lg border px-3 py-2"
              />
            </label>
          </div>

          {/* Client Info */}
          <div className="space-y-2">
            <h2 className="font-bold">Client Information</h2>
            {[
              {
                label: "Name",
                value: clientName,
                setter: setClientName,
                type: "text",
              },
              {
                label: "Address",
                value: clientAddress,
                setter: setClientAddress,
                type: "text",
              },
              {
                label: "City",
                value: clientCity,
                setter: setClientCity,
                type: "text",
              },
              {
                label: "Email",
                value: clientEmail,
                setter: setClientEmail,
                type: "email",
              },
              {
                label: "Phone",
                value: clientPhone,
                setter: setClientPhone,
                type: "tel",
              },
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
              <option value="" disabled>
                Select Payment Method
              </option>
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
              <div
                key={idx}
                className="grid grid-cols-1 items-end gap-2 sm:grid-cols-3"
              >
                <label className="flex flex-col sm:col-span-2">
                  <span>Description</span>
                  <input
                    type="text"
                    value={it.description}
                    onChange={(e) =>
                      handleItemChange(idx, "description", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleItemChange(idx, "quantity", Number(e.target.value))
                    }
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
                      onChange={(e) =>
                        handleItemChange(idx, "price", Number(e.target.value))
                      }
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
                isValid && !isLoading
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "cursor-not-allowed bg-gray-400"
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
