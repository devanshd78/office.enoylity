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
  const [date, setDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [status, setStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Pending');
  const [items, setItems] = useState<Item[]>([{ description: '', quantity: 1, price: 0 }]);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [paypalFee, setPaypalFee] = useState(0);

  const handleAddItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    setItems(prev =>
      prev.map((it, i) => i === index ? { ...it, [field]: field === 'description' ? value : Number(value) } : it)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoice = {
      date,
      client_name: clientName,
      client_address: clientAddress,
      client_email: clientEmail,
      client_phone: clientPhone,
      status,
      items,
      bank_name: bankName,
      bank_account: bankAccount,
      notes,
      paypal_fee: paypalFee,
    };
    // TODO: send `invoice` to backend API
    console.log('Submitting invoice:', invoice);
    router.push('/invoice/mhd');
  };

  return (
    <div className="min-h-screen bg-indigo-100 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6 mb-12">
        <h1 className="text-2xl font-semibold mb-4">Generate Invoice for MHD</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span>Date</span>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="mt-1 px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="flex flex-col">
              <span>Status</span>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <h2 className="font-medium">Client Information</h2>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2">
            <h2 className="font-medium">Items</h2>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2 items-end">
                <label className="flex flex-col col-span-2">
                  <span>Description</span>
                  <input
                    type="text"
                    value={it.description}
                    onChange={e => handleItemChange(idx, 'description', e.target.value)}
                    required
                    className="mt-1 px-3 py-2 border rounded-lg"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg"
                >Remove</button>
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
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={it.price}
                    onChange={e => handleItemChange(idx, 'price', Number(e.target.value))}
                    className="mt-1 px-3 py-2 border rounded-lg"
                  />
                </label>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >Add Item</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span>Bank Name</span>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="mt-1 px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="flex flex-col">
              <span>Bank Account</span>
              <input
                type="text"
                value={bankAccount}
                onChange={e => setBankAccount(e.target.value)}
                className="mt-1 px-3 py-2 border rounded-lg"
              />
            </label>
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

          <label className="flex flex-col">
            <span>PayPal Fee</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={paypalFee}
              onChange={e => setPaypalFee(Number(e.target.value))}
              className="mt-1 px-3 py-2 border rounded-lg"
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
            >Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateInvoicePage;