// components/PaymentHistoryModal.js
'use client';

import { useState, useEffect } from 'react';

export default function PaymentHistoryModal({ investigationId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (investigationId) {
      fetchPaymentHistory();
    }
  }, [investigationId]);

  const fetchPaymentHistory = async () => {
    try {
      const res = await fetch(`/api/investigations/${investigationId}/payment`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!investigationId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Payment History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : data ? (
          <div>
            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Bill ID</p>
                  <p className="text-lg font-bold">#{data.billId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <p className={`text-lg font-bold ${
                    data.paymentStatus === 'Paid' ? 'text-green-600' :
                    data.paymentStatus === 'Partial' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {data.paymentStatus}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-lg font-bold text-green-600">৳{data.paid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining Due</p>
                  <p className="text-lg font-bold text-red-600">৳{data.due.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Payment List */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Payment Transactions</h3>
              {data.payments && data.payments.length > 0 ? (
                <div className="space-y-3">
                  {data.payments.map((payment, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                              ৳{payment.amount.toLocaleString()}
                            </span>
                            <span className="text-gray-600 text-sm">
                              {payment.paymentMethod}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <strong>Received by:</strong> {payment.receivedBy?.name || payment.receivedBy || 'N/A'}
                          </p>
                          {payment.remarks && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Remarks:</strong> {payment.remarks}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {new Date(payment.date).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No payments recorded</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-red-500">Error loading payment history</div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}