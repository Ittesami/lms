// app/(protected)/admissions/[id]/discharge/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DischargePage({ params }) {
  const router = useRouter();
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dischargeDate: new Date().toISOString().split('T')[0],
    discount: 0,
    paid: 0,
    remarks: ''
  });

  useEffect(() => {
    fetchAdmission();
  }, [params.id]);

  const fetchAdmission = async () => {
    try {
      const res = await fetch(`/api/admissions/${params.id}`);
      const data = await res.json();
      
      if (data.admission.status === 'Discharged') {
        alert('Patient is already discharged!');
        router.push(`/admissions/${params.id}`);
        return;
      }
      
      setAdmission(data.admission);
    } catch (error) {
      console.error('Error fetching admission:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateBedCharges = () => {
    if (!admission) return 0;
    
    let total = 0;
    admission.bedHistory.forEach(bedHist => {
      const endDate = new Date(formData.dischargeDate);
      const startDate = new Date(bedHist.fromDate);
      const days = calculateDays(startDate, endDate);
      total += days * bedHist.chargePerDay;
    });
    
    return total;
  };

  const calculateMedicineCharges = () => {
    if (!admission) return 0;
    return admission.medicineInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  const calculateServiceCharges = () => {
    if (!admission) return 0;
    return admission.serviceInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  const calculateSubtotal = () => {
    return calculateBedCharges() + calculateMedicineCharges() + calculateServiceCharges() + (admission?.admissionFee || 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() - (formData.discount || 0);
  };

  const calculateTotalPaid = () => {
    return (admission?.advanceAmount || 0) + (formData.paid || 0);
  };

  const calculateDue = () => {
    return calculateGrandTotal() - calculateTotalPaid();
  };

  const handleDischarge = async (e) => {
    e.preventDefault();

    if (calculateDue() > 0) {
      const confirm = window.confirm(
        `There is a due amount of ৳${calculateDue()}. Do you want to proceed with discharge?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/admissions/${params.id}/discharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        alert('Patient discharged successfully!');
        
        // Generate and open discharge PDF
        window.open(`/api/discharges/${data.discharge._id}/pdf`, '_blank');
        
        router.push('/admissions');
      } else {
        alert(data.message || 'Error discharging patient');
      }
    } catch (error) {
      console.error('Error discharging patient:', error);
      alert('Error discharging patient');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Admission not found</div>
      </div>
    );
  }

  const totalDays = calculateDays(admission.admissionDate, formData.dischargeDate);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push(`/admissions/${params.id}`)}
          className="text-blue-600 hover:text-blue-800 mb-2"
        >
          ← Back to Admission Details
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Discharge Patient</h1>
        <p className="text-gray-600 mt-1">Admission ID: #{admission.admissionId}</p>
      </div>

      <form onSubmit={handleDischarge}>
        {/* Patient Info */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Patient Information</h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <p><strong>Name:</strong> {admission.patient?.name}</p>
            <p><strong>ID:</strong> {admission.patient?.patientId}</p>
            <p><strong>Phone:</strong> {admission.patient?.phone}</p>
            <p><strong>Consultant:</strong> {admission.consultant?.name}</p>
            <p><strong>Bed:</strong> {admission.bed?.bedNumber}</p>
            <p><strong>Admission Date:</strong> {new Date(admission.admissionDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Discharge Details */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-bold mb-4">Discharge Details</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Discharge Date *</label>
              <input
                type="date"
                value={formData.dischargeDate}
                onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                min={new Date(admission.admissionDate).toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Days</label>
              <input
                type="text"
                value={totalDays}
                className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Discharge Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
              placeholder="Any discharge notes, follow-up instructions, etc."
            />
          </div>
        </div>

        {/* Bill Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-bold mb-4">Bill Breakdown</h3>

          {/* Detailed Charges */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between py-2 border-b">
              <div>
                <p className="font-medium">Admission Fee</p>
              </div>
              <p className="font-semibold">৳{admission.admissionFee}</p>
            </div>

            <div className="flex justify-between py-2 border-b">
              <div>
                <p className="font-medium">Bed Charges</p>
                <p className="text-sm text-gray-600">{totalDays} days</p>
              </div>
              <p className="font-semibold">৳{calculateBedCharges()}</p>
            </div>

            {admission.medicineInvoices.length > 0 && (
              <div className="flex justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Medicine Charges</p>
                  <p className="text-sm text-gray-600">{admission.medicineInvoices.length} invoice(s)</p>
                </div>
                <p className="font-semibold">৳{calculateMedicineCharges()}</p>
              </div>
            )}

            {admission.serviceInvoices.length > 0 && (
              <div className="flex justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Service Charges</p>
                  <p className="text-sm text-gray-600">{admission.serviceInvoices.length} invoice(s)</p>
                </div>
                <p className="font-semibold">৳{calculateServiceCharges()}</p>
              </div>
            )}

            <div className="flex justify-between py-2 bg-gray-50 px-3">
              <p className="font-bold text-lg">Subtotal</p>
              <p className="font-bold text-lg">৳{calculateSubtotal()}</p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Discount:</span>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                className="w-40 px-3 py-2 border rounded-lg text-right"
                min="0"
                max={calculateSubtotal()}
              />
            </div>

            <div className="flex justify-between text-xl font-bold border-t-2 pt-3">
              <span>Grand Total:</span>
              <span className="text-blue-600">৳{calculateGrandTotal()}</span>
            </div>

            <div className="flex justify-between text-green-600">
              <span>Advance Paid:</span>
              <span>৳{admission.advanceAmount}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium">Additional Payment:</span>
              <input
                type="number"
                value={formData.paid}
                onChange={(e) => setFormData({ ...formData, paid: parseFloat(e.target.value) || 0 })}
                className="w-40 px-3 py-2 border rounded-lg text-right"
                min="0"
              />
            </div>

            <div className="flex justify-between text-lg font-bold">
              <span>Total Paid:</span>
              <span className="text-green-600">৳{calculateTotalPaid()}</span>
            </div>

            <div className="flex justify-between text-xl font-bold border-t-2 pt-3">
              <span>Due Amount:</span>
              <span className={calculateDue() > 0 ? 'text-red-600' : 'text-green-600'}>
                ৳{calculateDue()}
              </span>
            </div>
          </div>
        </div>

        {/* Warning if due */}
        {calculateDue() > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Warning:</strong> There is a due amount of ৳{calculateDue()}. Make sure to collect payment before discharge or confirm with management.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/admissions/${params.id}`)}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 font-semibold"
          >
            {submitting ? 'Processing...' : 'Discharge Patient & Print'}
          </button>
        </div>
      </form>
    </div>
  );
}