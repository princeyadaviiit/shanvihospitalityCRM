'use client';

import { useState } from 'react';

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
  recordedBy: {
    name: string;
    role: string;
  };
}

interface LedgerManagementProps {
  bookingId: string;
  bookingNumber: string;
  totalAmount: number;
  currency: string;
  entries: LedgerEntry[];
  userRole: string;
  onRefresh: () => void;
}

export default function LedgerManagement({
  bookingId,
  bookingNumber,
  totalAmount,
  currency,
  entries,
  userRole,
  onRefresh,
}: LedgerManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'PAYMENT',
    amount: '',
    currency: currency,
    description: '',
  });

  const canAddEntry = userRole === 'admin' || userRole === 'accounts';

  const totalPaid = entries
    .filter((e) => e.type === 'PAYMENT' || e.type === 'DEPOSIT')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCosts = entries
    .filter((e) => e.type === 'SUPPLIER_COST')
    .reduce((sum, e) => sum + e.amount, 0);

  const balance = totalAmount - totalPaid;

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add ledger entry');
      }

      setFormData({ type: 'PAYMENT', amount: '', currency, description: '' });
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function getEntryColor(type: string) {
    switch (type) {
      case 'PAYMENT':
      case 'DEPOSIT':
        return 'text-green-600';
      case 'SUPPLIER_COST':
        return 'text-red-600';
      case 'REFUND':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  }

  function getEntryPrefix(type: string) {
    return type === 'PAYMENT' || type === 'DEPOSIT' ? '+' : '-';
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Ledger: {bookingNumber}</h3>
            <p className="text-sm text-gray-500">Booking Amount: {currency} {totalAmount.toFixed(2)}</p>
          </div>
          {canAddEntry && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Entry
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded">
            <p className="text-sm text-gray-600">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">{currency} {totalPaid.toFixed(2)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded">
            <p className="text-sm text-gray-600">Supplier Costs</p>
            <p className="text-2xl font-bold text-red-600">{currency} {totalCosts.toFixed(2)}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm text-gray-600">Balance Due</p>
            <p className="text-2xl font-bold text-blue-600">{currency} {balance.toFixed(2)}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Transaction History</h4>
          {entries.length === 0 ? (
            <p className="text-gray-500 text-sm">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="flex justify-between items-start py-3 border-b">
                  <div className="flex-1">
                    <p className="font-medium">{entry.description}</p>
                    <p className="text-sm text-gray-500">
                      {entry.type.replace('_', ' ')} • {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Recorded by: {entry.recordedBy.name} ({entry.recordedBy.role})
                    </p>
                  </div>
                  <p className={`text-lg font-semibold ${getEntryColor(entry.type)}`}>
                    {getEntryPrefix(entry.type)}{entry.currency} {entry.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Ledger Entry</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="PAYMENT">Payment</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="SUPPLIER_COST">Supplier Cost</option>
                  <option value="REFUND">Refund</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                  min="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setError(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
