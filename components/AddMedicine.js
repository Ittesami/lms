'use client';

import { useState } from 'react';

export default function AddMedicine({ onMedicineAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    generic: '',
    brand: '',
    batchNumber: '',
    expiryDate: '',
    price: '',
    quantity: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/medicine/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage(data.message);
        setFormData({
          name: '',
          generic: '',
          brand: '',
          batchNumber: '',
          expiryDate: '',
          price: '',
          quantity: ''
        });
        if (onMedicineAdded) onMedicineAdded();
      } else {
        setMessage('Error: ' + data.message);
      }
    } catch (error) {
      setMessage('Error adding medicine');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Add Medicine</h2>
      
      {message && (
        <div className={`p-3 rounded mb-4 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Medicine Name"
          required
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="text"
          name="generic"
          value={formData.generic}
          onChange={handleChange}
          placeholder="Generic Name"
          required
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="text"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          placeholder="Brand"
          required
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="text"
          name="batchNumber"
          value={formData.batchNumber}
          onChange={handleChange}
          placeholder="Batch Number"
          required
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="date"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
          required
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          placeholder="Price"
          required
          step="0.01"
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="Quantity"
          required
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="col-span-2 bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Adding...' : 'Add Medicine'}
        </button>
      </form>
    </div>
  );
}