// components/AdmissionForm.js
'use client';

import { useState, useEffect } from 'react';
import PatientSearch from './PatientSearch';

export default function AdmissionForm() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [formData, setFormData] = useState({
    contactPersonName: '',
    contactPersonPhone: '',
    consultant: '',
    referredBy: '',
    bed: '',
    admissionDate: new Date().toISOString().split('T')[0],
    admissionFee: 0,
    advanceAmount: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchAvailableBeds();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAvailableBeds = async () => {
    try {
      const res = await fetch('/api/beds/available');
      const data = await res.json();
      setAvailableBeds(data.beds || []);
    } catch (error) {
      console.error('Error fetching beds:', error);
    }
  };

  const selectedBed = availableBeds.find((b) => b._id === formData.bed);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      alert('Please select or create a patient');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: selectedPatient._id,
          ...formData
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Patient admitted successfully!');
        window.location.href = `/admissions/${data.admission._id}`;
      } else {
        alert(data.message || 'Error admitting patient');
      }
    } catch (error) {
      console.error('Error admitting patient:', error);
      alert('Error admitting patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Patient Admission</h1>

      <form onSubmit={handleSubmit}>
        {/* Patient Search */}
        <PatientSearch
          onSelectPatient={setSelectedPatient}
          onCreateNew={setSelectedPatient}
        />

        {/* Selected Patient Display */}
        {selectedPatient && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-2">Selected Patient:</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <p><strong>ID:</strong> {selectedPatient.patientId}</p>
              <p><strong>Name:</strong> {selectedPatient.name}</p>
              <p><strong>Age/Sex:</strong> {selectedPatient.age}Y / {selectedPatient.sex}</p>
              <p><strong>Phone:</strong> {selectedPatient.phone}</p>
              <p><strong>Blood Group:</strong> {selectedPatient.bloodGroup || 'N/A'}</p>
              <p><strong>Address:</strong> {selectedPatient.address || 'N/A'}</p>
            </div>
          </div>
        )}

        {/* Admission Details */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Admission Details</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium mb-1">Contact Person Name *</label>
              <input
                type="text"
                value={formData.contactPersonName}
                onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Person Phone *</label>
              <input
                type="text"
                value={formData.contactPersonPhone}
                onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Consultant */}
            <div>
              <label className="block text-sm font-medium mb-1">Consultant *</label>
              <select
                value={formData.consultant}
                onChange={(e) => setFormData({ ...formData, consultant: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>

            {/* Referred By */}
            <div>
              <label className="block text-sm font-medium mb-1">Referred By</label>
              <input
                type="text"
                value={formData.referredBy}
                onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>

            {/* Bed Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Bed/Cabin *</label>
              <select
                value={formData.bed}
                onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Bed</option>
                {availableBeds.map((bed) => (
                  <option key={bed._id} value={bed._id}>
                    {bed.bedNumber} - {bed.bedName} (৳{bed.chargePerDay}/day)
                  </option>
                ))}
              </select>
            </div>

            {/* Admission Date */}
            <div>
              <label className="block text-sm font-medium mb-1">Admission Date *</label>
              <input
                type="date"
                value={formData.admissionDate}
                onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Admission Fee */}
            <div>
              <label className="block text-sm font-medium mb-1">Admission Fee (৳)</label>
              <input
                type="number"
                value={formData.admissionFee}
                onChange={(e) => setFormData({ ...formData, admissionFee: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            {/* Advance Amount */}
            <div>
              <label className="block text-sm font-medium mb-1">Advance Amount (৳) *</label>
              <input
                type="number"
                value={formData.advanceAmount}
                onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>
          </div>

          {/* Bed Info Display */}
          {selectedBed && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold mb-2">Selected Bed Details:</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <p><strong>Bed:</strong> {selectedBed.bedNumber}</p>
                <p><strong>Type:</strong> {selectedBed.bedName}</p>
                <p><strong>Charge:</strong> ৳{selectedBed.chargePerDay}/day</p>
                {selectedBed.facilities && (
                  <p className="col-span-3"><strong>Facilities:</strong> {selectedBed.facilities}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => window.location.href = '/admissions'}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedPatient || !formData.bed}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? 'Admitting...' : 'Admit Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}