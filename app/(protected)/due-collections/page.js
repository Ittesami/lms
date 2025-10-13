// app/due-collections/page.js
'use client';

import { useState, useEffect } from 'react';

export default function DueCollectionPage() {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, partial, pending
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    remarks: ''
  });

  useEffect(() => {
    fetchInvestigations();
  }, [filter]);

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      let url = '/api/investigations?hasDue=true';
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setInvestigations(data.investigations || []);
    } catch (error) {
      console.error('Error fetching investigations:', error);
      alert('Error loading investigations');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (parseFloat(paymentData.amount) > selectedInvestigation.due) {
      alert(`Payment amount cannot exceed due amount of ৳${selectedInvestigation.due}`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/investigations/${selectedInvestigation._id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          remarks: paymentData.remarks
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Payment collected successfully!');
        setShowPaymentModal(false);
        setSelectedInvestigation(null);
        setPaymentData({ amount: '', paymentMethod: 'Cash', remarks: '' });
        fetchInvestigations();
      } else {
        alert(data.message || 'Error collecting payment');
      }
    } catch (error) {
      console.error('Error collecting payment:', error);
      alert('Error collecting payment');
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (investigation) => {
    setSelectedInvestigation(investigation);
    setPaymentData({
      amount: investigation.due.toString(),
      paymentMethod: 'Cash',
      remarks: ''
    });
    setShowPaymentModal(true);
  };

  const updateReportStatus = async (investigationId, newStatus) => {
    try {
      const res = await fetch(`/api/investigations/${investigationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportStatus: newStatus })
      });

      if (res.ok) {
        alert('Report status updated successfully');
        fetchInvestigations();
      } else {
        const data = await res.json();
        alert(data.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const filteredInvestigations = investigations.filter(inv => {
    const searchLower = searchTerm.toLowerCase();
    return (
      inv.billId.toString().includes(searchLower) ||
      inv.patient?.name.toLowerCase().includes(searchLower) ||
      inv.patient?.phone.includes(searchTerm)
    );
  });

  const totalDue = filteredInvestigations.reduce((sum, inv) => sum + inv.due, 0);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Due Collections</h1>
          <p className="text-gray-600 mt-1">
            Total Outstanding: <span className="font-bold text-red-600">৳{totalDue.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by Bill ID, Patient Name, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="all">All Due Payments</option>
              <option value="pending">Pending (No Payment)</option>
              <option value="partial">Partial Payment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvestigation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Collect Payment</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvestigation(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p><strong>Bill ID:</strong> #{selectedInvestigation.billId}</p>
              <p><strong>Patient:</strong> {selectedInvestigation.patient?.name}</p>
              <p><strong>Total Due:</strong> <span className="text-red-600 font-bold">৳{selectedInvestigation.due}</span></p>
            </div>

            <form onSubmit={handlePayment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Amount *</label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    min="0"
                    max={selectedInvestigation.due}
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method *</label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Mobile Banking">Mobile Banking</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <textarea
                    value={paymentData.remarks}
                    onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="2"
                    placeholder="Optional payment notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedInvestigation(null);
                  }}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : 'Collect Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Investigations Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading && investigations.length === 0 ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredInvestigations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No due payments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Bill ID</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Due</th>
                  <th className="px-4 py-3 text-center">Payment Status</th>
                  <th className="px-4 py-3 text-center">Report Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInvestigations.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-blue-600">
                      #{inv.billId}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(inv.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3">{inv.patient?.name}</td>
                    <td className="px-4 py-3">{inv.patient?.phone}</td>
                    <td className="px-4 py-3 text-right">
                      ৳{(inv.totalAmount - inv.discount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      ৳{inv.paid.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 font-bold">
                      ৳{inv.due.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        inv.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                        inv.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={inv.reportStatus}
                        onChange={(e) => updateReportStatus(inv._id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-semibold border ${
                          inv.reportStatus === 'Delivered' ? 'bg-green-50 text-green-800' :
                          inv.reportStatus === 'Ready' ? 'bg-blue-50 text-blue-800' :
                          'bg-gray-50 text-gray-800'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Ready">Ready</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openPaymentModal(inv)}
                        disabled={inv.due <= 0}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 text-sm"
                      >
                        Collect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Bills with Due</p>
          <p className="text-2xl font-bold">{filteredInvestigations.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Amount Due</p>
          <p className="text-2xl font-bold text-red-600">৳{totalDue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Pending Reports</p>
          <p className="text-2xl font-bold text-orange-600">
            {filteredInvestigations.filter(inv => inv.reportStatus === 'Pending').length}
          </p>
        </div>
      </div>
    </div>
  );
}