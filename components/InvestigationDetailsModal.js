// components/InvestigationDetailsModal.js
'use client';

import { useState, useEffect } from 'react';

export default function InvestigationDetailsModal({ investigationId, onClose }) {
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    remarks: ''
  });

  useEffect(() => {
    if (investigationId) {
      fetchInvestigationDetails();
    }
  }, [investigationId]);

  const fetchInvestigationDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/investigations/${investigationId}`);
      const data = await res.json();
      if (res.ok) {
        setInvestigation(data.investigation);
      } else {
        alert(data.message || 'Error loading investigation');
      }
    } catch (error) {
      console.error('Error fetching investigation:', error);
      alert('Error loading investigation details');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (parseFloat(paymentData.amount) > investigation.due) {
      alert(`Payment amount cannot exceed due amount of ৳${investigation.due}`);
      return;
    }

    try {
      const res = await fetch(`/api/investigations/${investigationId}/payment`, {
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
        setPaymentData({ amount: '', paymentMethod: 'Cash', remarks: '' });
        fetchInvestigationDetails(); // Refresh
      } else {
        alert(data.message || 'Error collecting payment');
      }
    } catch (error) {
      console.error('Error collecting payment:', error);
      alert('Error collecting payment');
    }
  };

  const updateReportStatus = async (newStatus) => {
    try {
      const res = await fetch(`/api/investigations/${investigationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportStatus: newStatus })
      });

      if (res.ok) {
        alert('Report status updated successfully');
        fetchInvestigationDetails();
      } else {
        const data = await res.json();
        alert(data.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  if (!investigationId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Investigation Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : investigation ? (
          <div className="p-6 space-y-6">
            {/* Bill Info */}
            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Bill ID</p>
                <p className="text-xl font-bold text-blue-600">#{investigation.billId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">
                  {new Date(investigation.date).toLocaleDateString('en-GB')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivery Date</p>
                <p className="font-semibold">
                  {new Date(investigation.deliveryDate).toLocaleDateString('en-GB')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  investigation.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                  investigation.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {investigation.paymentStatus}
                </span>
              </div>
            </div>

            {/* Patient Info */}
            <div className="border rounded-lg p-4">
              <h3 className="font-bold mb-3">Patient Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">ID:</span>
                  <span className="ml-2 font-semibold">{investigation.patient?.patientId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-semibold">{investigation.patient?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Age/Sex:</span>
                  <span className="ml-2">{investigation.patient?.age}Y / {investigation.patient?.sex}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-2">{investigation.patient?.phone}</span>
                </div>
              </div>
            </div>

            {/* Consultant */}
            <div className="border rounded-lg p-4">
              <h3 className="font-bold mb-2">Consultant</h3>
              <p className="text-sm">
                {investigation.consultant?.name} - {investigation.consultant?.specialization}
              </p>
            </div>

            {/* Services */}
            <div className="border rounded-lg p-4">
              <h3 className="font-bold mb-3">Services</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Service</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {investigation.services?.map((service, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">{service.serviceName}</td>
                      <td className="px-3 py-2 text-center">{service.quantity}</td>
                      <td className="px-3 py-2 text-right">৳{service.unitPrice}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        ৳{service.unitPrice * service.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment Summary */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-bold mb-3">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">৳{investigation.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="font-semibold text-red-600">-৳{investigation.discount}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Grand Total:</span>
                  <span>৳{investigation.totalAmount - investigation.discount}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Paid:</span>
                  <span className="font-semibold">৳{investigation.paid}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-red-600">
                  <span>Due:</span>
                  <span>৳{investigation.due}</span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {investigation.payments && investigation.payments.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-3">Payment History</h3>
                <div className="space-y-2">
                  {investigation.payments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded">
                      <div>
                        <span className="font-semibold text-green-600">৳{payment.amount}</span>
                        <span className="ml-2 text-gray-600">via {payment.paymentMethod}</span>
                        {payment.remarks && (
                          <p className="text-xs text-gray-500 mt-1">{payment.remarks}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(payment.date).toLocaleString('en-GB')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Status */}
            <div className="border rounded-lg p-4">
              <h3 className="font-bold mb-3">Report Status</h3>
              <select
                value={investigation.reportStatus}
                onChange={(e) => updateReportStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Pending">Pending</option>
                <option value="Ready">Ready</option>
                <option value="Delivered">Delivered</option>
              </select>
              {investigation.reportStatus === 'Delivered' && investigation.reportDeliveredAt && (
                <p className="text-sm text-gray-600 mt-2">
                  Delivered on {new Date(investigation.reportDeliveredAt).toLocaleString('en-GB')}
                </p>
              )}
            </div>

            {/* Remarks */}
            {investigation.remarks && (
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">Remarks</h3>
                <p className="text-sm text-gray-700">{investigation.remarks}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              {investigation.due > 0 && (
                <button
                  onClick={() => {
                    setPaymentData({ ...paymentData, amount: investigation.due.toString() });
                    setShowPaymentModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Collect Payment (৳{investigation.due})
                </button>
              )}
              <button
                onClick={() => window.open(`/api/investigations/${investigationId}/pdf`, '_blank')}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Print PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-red-500">Investigation not found</div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Collect Payment</h3>
              <form onSubmit={handleCollectPayment}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount *</label>
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                      min="0"
                      max={investigation?.due}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Method *</label>
                    <select
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
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
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Collect
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}