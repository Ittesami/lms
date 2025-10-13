'use client';

import { useState, useEffect } from 'react';

export default function MedicineList({ refresh }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicines();
  }, [refresh]);

  const fetchMedicines = async () => {
    try {
      const res = await fetch('/api/medicine/inventory');
      const data = await res.json();
      console.log(data)
      setMedicines(data.medicines || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBatch = async (name, batchNumber) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;

    try {
      const res = await fetch('/api/medicine/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, batchNumber })
      });

      if (res.ok) {
        fetchMedicines();
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center py-8 text-gray-600">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Inventory ({medicines.length} items)
      </h2>

      <div className="space-y-4">
        {medicines.map((medicine) => (
          <div key={medicine._id} className="border rounded-lg p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{medicine.name}</h3>
                <p className="text-gray-600">Generic: {medicine.generic}</p>
                <p className="text-gray-600">Brand: {medicine.brand}</p>
                <p className="text-lg font-bold text-green-600 mt-2">
                  Total Stock: {medicine.currentStock} units
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-gray-700">Batches:</h4>
              {medicine.batches.map((batch, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded mb-2 flex justify-between items-center">
                  <div className="grid grid-cols-4 gap-4 flex-1">
                    <span className="text-sm">
                      <span className="font-semibold">Batch:</span> {batch.batchNumber}
                    </span>
                    <span className="text-sm">
                      <span className="font-semibold">Qty:</span> {batch.quantity}
                    </span>
                    <span className="text-sm">
                      <span className="font-semibold">Price:</span> ${batch.price}
                    </span>
                    <span className="text-sm">
                      <span className="font-semibold">Exp:</span> {new Date(batch.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteBatch(medicine.name, batch.batchNumber)}
                    className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {medicines.length === 0 && (
        <p className="text-center text-gray-500 py-8">No medicines in inventory. Add some to get started!</p>
      )}
    </div>
  );
}