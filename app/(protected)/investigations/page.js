// app/(protected)/investigations/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InvestigationForm from '@/components/InvestigationForm';
import InvestigationDetailsModal from '@/components/InvestigationDetailsModal';

export default function InvestigationsPage() {
  const router = useRouter();
  const [investigations, setInvestigations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvestigationId, setSelectedInvestigationId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showForm) {
      fetchInvestigations();
    }
  }, [showForm]);

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/investigations');
      const data = await res.json();
      setInvestigations(data.investigations || []);
    } catch (error) {
      console.error('Error fetching investigations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {!showForm ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Investigation Billing</h1>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              + New Investigation Bill
            </button>
          </div>

          {/* Investigation List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Bill ID</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Patient</th>
                    <th className="px-4 py-3 text-left">Consultant</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Due</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Report</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="text-center py-8 text-gray-500">
                        Loading investigations...
                      </td>
                    </tr>
                  ) : investigations.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-12 text-gray-500">
                        No investigation bills found. Create one to get started!
                      </td>
                    </tr>
                  ) : (
                    investigations.map((inv) => (
                      <tr 
                        key={inv._id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedInvestigationId(inv._id)}
                      >
                        <td className="px-4 py-3 font-semibold text-blue-600">#{inv.billId}</td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(inv.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="font-medium">{inv.patient?.name}</div>
                            <div className="text-gray-500">{inv.patient?.phone}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{inv.consultant?.name}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          ৳{(inv.totalAmount - inv.discount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600">
                          ৳{inv.paid.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={inv.due > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                            ৳{inv.due.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            inv.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                            inv.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            inv.reportStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                            inv.reportStatus === 'Ready' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {inv.reportStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/api/investigations/${inv._id}/pdf`, '_blank');
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Cards */}
          {investigations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Total Bills</p>
                <p className="text-2xl font-bold">{investigations.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ৳{investigations.reduce((sum, inv) => sum + inv.paid, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Total Due</p>
                <p className="text-2xl font-bold text-red-600">
                  ৳{investigations.reduce((sum, inv) => sum + inv.due, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Pending Reports</p>
                <p className="text-2xl font-bold text-orange-600">
                  {investigations.filter(inv => inv.reportStatus === 'Pending').length}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setShowForm(false)}
            className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to List
          </button>
          <InvestigationForm />
        </div>
      )}

      {/* Investigation Details Modal */}
      {selectedInvestigationId && (
        <InvestigationDetailsModal
          investigationId={selectedInvestigationId}
          onClose={() => {
            setSelectedInvestigationId(null);
            fetchInvestigations(); // Refresh list after modal closes
          }}
        />
      )}
    </div>
  );
}