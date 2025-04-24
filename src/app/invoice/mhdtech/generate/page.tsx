"use client";

import React, { FC, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Item {
  description: string;
  quantity: number;
  price: number;
}

const GenerateInvoicePage: FC = () => {
  const router = useRouter();

  const [billDate, setBillDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'' | 'PayPal' | 'Bank Transfer'>('');
  const [items, setItems] = useState<Item[]>([{ description: '', quantity: 0, price: 0 }]);
  const [notes, setNotes] = useState('');

  const handleAddItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    setItems(prev =>
      prev.map((it, i) => i === index ? { ...it, [field]: field === 'description' ? value : Number(value) } : it)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bill_date = new Date(billDate).toLocaleDateString('en-GB').split('/').join('-');
    const due_date = new Date(dueDate).toLocaleDateString('en-GB').split('/').join('-');

    const payload = {
      bill_to_name: clientName,
      bill_to_address: clientAddress,
      bill_to_city: clientCity,
      bill_to_email: clientEmail,
      invoice_date: bill_date,
      due_date: due_date,
      payment_method: paymentMethod === 'PayPal' ? 0 : 1,
      items,
      notes,
      phone: clientPhone
    };

    try {
      const response = await fetch('http://localhost:5000/invoiceMHD/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to generate invoice');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error generating invoice');
      console.error(error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };
  
  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6 mb-12">
        <h1 className="text-2xl font-semibold mb-4">Generate Invoice for MHD</h1>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col">
              <span>Bill Date</span>
              <input
                type="date"
                value={billDate}
                onChange={e => setBillDate(e.target.value)}
                required
                className="mt-1 px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="flex flex-col">
              <span>Due Date</span>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
                className="mt-1 px-3 py-2 border rounded-lg"
              />
            </label>
          </div>

          <div className="space-y-2">
            <h2 className="font-bold">Client Information</h2>
            <label className="flex flex-col">
              <span>Name</span>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                required
                className="mt-1 px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="flex flex-col">
              <span>Address</span>
              <input
                type="text"
                value={clientAddress}
                onChange={e => setClientAddress(e.target.value)}
                required
                className="mt-1 px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="flex flex-col">
              <span>City</span>
              <input
                type="text"
                value={clientCity}
                onChange={e => setClientCity(e.target.value)}
                required
                className="mt-1 px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="flex flex-col">
              <span>Email</span>
              <input
                type="email"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                required
                className="mt-1 px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="flex flex-col">
              <span>Phone</span>
              <input
                type="tel"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                className="mt-1 px-3 py-2 border rounded-lg"
              />
            </label>
          </div>

          <label className="flex flex-col">
            <span>Payment Method</span>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as 'PayPal' | 'Bank Transfer')}
              required
              className="mt-1 px-3 py-2 border rounded-lg"
            >
              <option value="" disabled>Select Payment Method</option>
              <option value="PayPal">PayPal</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </label>

          <div className="space-y-2">
            <h2 className="font-medium">Items</h2>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <label className="flex flex-col sm:col-span-2">
                  <span>Description</span>
                  <input
                    type="text"
                    value={it.description}
                    onChange={e => handleItemChange(idx, 'description', e.target.value)}
                    required
                    className="mt-1 px-3 py-2 border rounded-lg"
                  />
                </label>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg w-full"
                  >Remove</button>
                )}
                <label className="flex flex-col">
                  <span>Qty</span>
                  <input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                    className="mt-1 px-3 py-2 border rounded-lg"
                  />
                </label>
                <label className="flex flex-col">
                  <span>Price</span>
                  <div className="mt-1 flex rounded-lg border overflow-hidden">
                    <span className="px-3 py-2">$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={it.price}
                      onChange={e => handleItemChange(idx, 'price', Number(e.target.value))}
                      className="px-3 py-2 flex-1 outline-none"
                    />
                  </div>
                </label>

              </div>
            ))}
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >Add Item</button>
          </div>

          <label className="flex flex-col">
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="mt-1 px-3 py-2 border rounded-lg"
              rows={3}
            />
          </label>

          <div className="flex justify-end space-x-4">
            <Link
              href="/invoice/mhd"
              className="px-4 py-2 border rounded-lg"
            >Cancel</Link>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >Generate</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateInvoicePage;
