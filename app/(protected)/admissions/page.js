// app/(protected)/admissions/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdmissionsPage() {
  const router = useRouter();
  const [admissions, setAdmissions] = useState([]);
  const [status, setStatus] = useState('Admitted');

  useEffect(() => {
    fetchAdmissions();
  }, [status]);

  const fetchAdmissions = async () => {
    try {
      const res = await fetch(`/api/admissions?status=${status}`);
      const data = await res.json();
      setAdmissions(data.admissions || []);
    } catch (error) {
      console.error('Error fetching admissions:', error);
    }
  };

  const calculateDays = (startDate) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Patient Admissions</h1>
        <button
          onClick={() => router.push('/admissions/new')}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          + Admit New Patient
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setStatus('Admitted')}
          className={`px-4 py-2 rounded-lg ${
            status === 'Admitted'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Currently Admitted
        </button>
        <button
          onClick={() => setStatus('Discharged')}
          className={`px-4 py-2 rounded-lg ${
            status === 'Discharged'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Discharged
        </button>
      </div>

      {/* Admissions List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Admission ID</th>
              <th className="px-4 py-3 text-left">Patient</th>
              <th className="px-4 py-3 text-left">Consultant</th>
              <th className="px-4 py-3 text-left">Bed</th>
              <th className="px-4 py-3 text-left">Admission Date</th>
              <th className="px-4 py-3 text-center">Days</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {admissions.map((admission) => (
              <tr key={admission._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{admission.admissionId}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{admission.patient?.name}</p>
                    <p className="text-sm text-gray-600">{admission.patient?.phone}</p>
                  </div>
                </td>
                <td className="px-4 py-3">{admission.consultant?.name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {admission.bed?.bedNumber}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {new Date(admission.admissionDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-center">
                  {status === 'Admitted' ? calculateDays(admission.admissionDate) : 
                   calculateDays(admission.admissionDate)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => router.push(`/admissions/${admission._id}`)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {admissions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No {status.toLowerCase()} patients found.
          </div>
        )}
      </div>
    </div>
  );
}