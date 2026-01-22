import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

interface Transaction {
  _id: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  targetType: string;
  targetId: string;
  amount: number;
  phone: string;
  status: string;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  resultCode?: number;
  resultDesc?: string;
  mpesaReceiptNumber?: string;
  createdAt: string;
  updatedAt: string;
}

const PaymentTestPanel: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/payments-dev/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateCallback = async (transactionId: string, scenario: string) => {
    setLoading(true);
    setSimulationResult(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/payments-dev/simulate-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ transactionId, scenario }),
      });
      const data = await response.json();
      setSimulationResult(data);
      
      // Reload transactions to see updated status
      setTimeout(() => loadTransactions(), 1000);
    } catch (error) {
      console.error('Failed to simulate callback:', error);
      setSimulationResult({ success: false, message: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const clearMockTransactions = async () => {
    if (!window.confirm('Clear all mock transactions?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/payments-dev/transactions/clear-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      loadTransactions();
    } catch (error) {
      console.error('Failed to clear transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🧪 M-Pesa Payment Testing Panel
        </h1>
        <p className="text-sm text-gray-600">
          Development-only tool to test payment flows without real M-Pesa credentials.
          This panel is automatically disabled in production.
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={loadTransactions}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Transactions'}
        </button>
        <button
          onClick={clearMockTransactions}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          Clear Mock Transactions
        </button>
      </div>

      {/* Test Scenarios Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-3">Test Scenarios</h2>
        <div className="grid md:grid-cols-5 gap-3 text-sm">
          <div className="border rounded p-3">
            <div className="font-semibold text-green-600">✓ Success</div>
            <div className="text-gray-600">Payment completed</div>
          </div>
          <div className="border rounded p-3">
            <div className="font-semibold text-red-600">✗ Insufficient Funds</div>
            <div className="text-gray-600">User has no money</div>
          </div>
          <div className="border rounded p-3">
            <div className="font-semibold text-orange-600">✗ Cancelled</div>
            <div className="text-gray-600">User declined STK</div>
          </div>
          <div className="border rounded p-3">
            <div className="font-semibold text-gray-600">✗ Timeout</div>
            <div className="text-gray-600">No response</div>
          </div>
          <div className="border rounded p-3">
            <div className="font-semibold text-purple-600">✗ Invalid</div>
            <div className="text-gray-600">Bad request</div>
          </div>
        </div>
      </div>

      {/* Simulation Result */}
      {simulationResult && (
        <div className={`rounded-lg p-4 mb-6 ${
          simulationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className="font-bold mb-2">
            {simulationResult.success ? '✓ Callback Simulated' : '✗ Simulation Failed'}
          </h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(simulationResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold">Recent Transactions ({transactions.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No transactions yet. Create a listing and initiate a payment to test.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{tx.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{tx.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      KSh {tx.amount}
                    </td>
                    <td className="px-4 py-3 text-sm">{tx.phone}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                      {tx.resultDesc && (
                        <div className="text-xs text-gray-500 mt-1">{tx.resultDesc}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-xs text-gray-600">{tx.targetType}</div>
                      <div className="text-xs text-gray-400 font-mono">{tx.targetId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {tx.status === 'pending' && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => simulateCallback(tx._id, 'success')}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                            disabled={loading}
                          >
                            ✓ Success
                          </button>
                          <button
                            onClick={() => simulateCallback(tx._id, 'insufficient_funds')}
                            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                            disabled={loading}
                          >
                            ✗ Fail
                          </button>
                          <button
                            onClick={() => simulateCallback(tx._id, 'cancelled')}
                            className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                            disabled={loading}
                          >
                            ✗ Cancel
                          </button>
                        </div>
                      )}
                      {tx.mpesaReceiptNumber && (
                        <div className="text-xs text-green-600 font-mono">
                          {tx.mpesaReceiptNumber}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* How to Use */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2">How to Test Payments</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Go to any listing creation page (land, service, agrovet, product)</li>
          <li>Fill in the form and select a paid plan</li>
          <li>Enter any test phone number (e.g., 254712345678)</li>
          <li>The payment will be created in "pending" status</li>
          <li>Come back here and click a button to simulate the payment outcome</li>
          <li>The listing status will update based on the simulated result</li>
        </ol>
      </div>
    </div>
  );
};

export default PaymentTestPanel;
