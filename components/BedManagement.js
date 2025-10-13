// components/BedManagement.js
'use client';

import { useState, useEffect } from 'react';

export default function BedManagement() {
  const [beds, setBeds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [formData, setFormData] = useState({
    bedNumber: '',
    bedName: '',
    chargePerDay: '',
    facilities: ''
  });

  useEffect(() => {
    fetchBeds();
  }, []);

  const fetchBeds = async () => {
    try {
      const res = await fetch('/api/beds');
      const data = await res.json();
      setBeds(data.beds || []);
    } catch (error) {
      console.error('Error fetching beds:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingBed ? `/api/beds/${editingBed._id}` : '/api/beds';
      const method = editingBed ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchBeds();
        closeModal();
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error saving bed:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this bed?')) return;

    try {
      const res = await fetch(`/api/beds/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        fetchBeds();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error deleting bed:', error);
    }
  };

  const openModal = (bed = null) => {
    if (bed) {
      setEditingBed(bed);
      setFormData({
        bedNumber: bed.bedNumber,
        bedName: bed.bedName,
        chargePerDay: bed.chargePerDay,
        facilities: bed.facilities || ''
      });
    } else {
      setEditingBed(null);
      setFormData({
        bedNumber: '',
        bedName: '',
        chargePerDay: '',
        facilities: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBed(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Bed Management</h2>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          + Add Bed
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {beds.map((bed) => (
          <div
            key={bed._id}
            className={`border-2 rounded-lg p-4 ${
              bed.isOccupied
                ? 'border-red-300 bg-red-50'
                : 'border-green-300 bg-green-50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold">{bed.bedNumber}</h3>
                <p className="text-sm text-gray-600">{bed.bedName}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  bed.isOccupied
                    ? 'bg-red-200 text-red-800'
                    : 'bg-green-200 text-green-800'
                }`}
              >
                {bed.isOccupied ? 'Occupied' : 'Available'}
              </span>
            </div>

            <div className="mb-3">
              <p className="text-sm">
                <span className="font-semibold">Charge:</span> ৳{bed.chargePerDay}/day
              </p>
              {bed.facilities && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">Facilities:</span> {bed.facilities}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openModal(bed)}
                className="flex-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(bed._id)}
                disabled={bed.isOccupied}
                className="flex-1 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {beds.length === 0 && (
        <p className="text-center text-gray-500 py-8">No beds found. Add one to get started!</p>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingBed ? 'Edit Bed' : 'Add Bed'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bed Number *</label>
                  <input
                    type="text"
                    value={formData.bedNumber}
                    onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 201, 301"
                    required
                    disabled={editingBed !== null}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bed Name *</label>
                  <input
                    type="text"
                    value={formData.bedName}
                    onChange={(e) => setFormData({ ...formData, bedName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., General Bed, ICU Bed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Charge Per Day (৳) *</label>
                  <input
                    type="number"
                    value={formData.chargePerDay}
                    onChange={(e) => setFormData({ ...formData, chargePerDay: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Facilities</label>
                  <textarea
                    value={formData.facilities}
                    onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    placeholder="AC, TV, Attached Bathroom, etc."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {editingBed ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}