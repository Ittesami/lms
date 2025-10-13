// components/InvestigationForm.js
'use client';

import { useState, useEffect } from 'react';
import PatientSearch from './PatientSearch';

export default function InvestigationForm() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    consultant: '',
    deliveryDate: '',
    discount: 0,
    paid: 0,
    paymentMethod: 'Cash',
    remarks: ''
  });
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchServices();
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

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const addService = (serviceId) => {
    const service = services.find((s) => s._id === serviceId);
    if (!service) return;

    const existing = selectedServices.find((s) => s.service === serviceId);
    if (existing) {
      setSelectedServices(
        selectedServices.map((s) =>
          s.service === serviceId ? { ...s, quantity: s.quantity + 1 } : s
        )
      );
    } else {
      setSelectedServices([
        ...selectedServices,
        {
          service: service._id,
          serviceName: service.name,
          unitPrice: service.unitPrice,
          quantity: 1
        }
      ]);
    }
  };

  const updateServiceQuantity = (serviceId, quantity) => {
    if (quantity <= 0) {
      setSelectedServices(selectedServices.filter((s) => s.service !== serviceId));
    } else {
      setSelectedServices(
        selectedServices.map((s) =>
          s.service === serviceId ? { ...s, quantity } : s
        )
      );
    }
  };

  const removeService = (serviceId) => {
    setSelectedServices(selectedServices.filter((s) => s.service !== serviceId));
  };

  const calculateTotal = () => {
    return selectedServices.reduce(
      (sum, service) => sum + service.unitPrice * service.quantity,
      0
    );
  };

  const calculateGrandTotal = () => {
    return calculateTotal() - (formData.discount || 0);
  };

  const calculateDue = () => {
    return calculateGrandTotal() - (formData.paid || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      alert('Please select or create a patient');
      return;
    }

    if (selectedServices.length === 0) {
      alert('Please add at least one service');
      return;
    }

    if (formData.discount > calculateTotal()) {
      alert('Discount cannot be greater than total amount');
      return;
    }

    if (formData.paid > calculateGrandTotal()) {
      alert('Paid amount cannot be greater than grand total');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: selectedPatient._id,
          consultant: formData.consultant,
          deliveryDate: formData.deliveryDate,
          services: selectedServices,
          discount: formData.discount || 0,
          paid: formData.paid || 0,
          paymentMethod: formData.paymentMethod,
          remarks: formData.remarks
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Investigation bill created successfully!');
        
        // Reset form
        setSelectedPatient(null);
        setSelectedServices([]);
        setFormData({
          consultant: '',
          deliveryDate: '',
          discount: 0,
          paid: 0,
          paymentMethod: 'Cash',
          remarks: ''
        });

        // Open PDF in new tab
        window.open(`/api/investigations/${data.investigation._id}/pdf`, '_blank');
      } else {
        alert(data.message || 'Error creating investigation');
      }
    } catch (error) {
      console.error('Error creating investigation:', error);
      alert('Error creating investigation');
    } finally {
      setLoading(false);
    }
  };

  const dueAmount = calculateDue();

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Investigation Billing</h1>

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
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><strong>ID:</strong> {selectedPatient.patientId}</p>
              <p><strong>Name:</strong> {selectedPatient.name}</p>
              <p><strong>Age/Sex:</strong> {selectedPatient.age}Y / {selectedPatient.sex}</p>
              <p><strong>Phone:</strong> {selectedPatient.phone}</p>
            </div>
          </div>
        )}

        {/* Investigation Details */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Investigation Details</h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Consultant *</label>
              <select
                value={formData.consultant}
                onChange={(e) => setFormData({ ...formData, consultant: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
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

            <div>
              <label className="block text-sm font-medium mb-1">Delivery Date *</label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          {/* Service Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Add Services</label>
            <select
              onChange={(e) => {
                addService(e.target.value);
                e.target.value = '';
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select a service to add</option>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name} - ৳{service.unitPrice}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Services Table */}
          {selectedServices.length > 0 && (
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Service</th>
                    <th className="px-4 py-2 text-center">Qty</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedServices.map((service, index) => (
                    <tr key={service.service}>
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{service.serviceName}</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="number"
                          value={service.quantity}
                          onChange={(e) =>
                            updateServiceQuantity(service.service, parseInt(e.target.value))
                          }
                          className="w-16 px-2 py-1 border rounded text-center"
                          min="1"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">৳{service.unitPrice}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        ৳{service.unitPrice * service.quantity}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeService(service.service)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Billing Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-3 max-w-md ml-auto">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">৳{calculateTotal()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Discount:</span>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-32 px-2 py-1 border rounded text-right"
                  min="0"
                  max={calculateTotal()}
                />
              </div>

              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span>৳{calculateGrandTotal()}</span>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span>Paid:</span>
                  <input
                    type="number"
                    value={formData.paid}
                    onChange={(e) =>
                      setFormData({ ...formData, paid: parseFloat(e.target.value) || 0 })
                    }
                    className="w-32 px-2 py-1 border rounded text-right"
                    min="0"
                    max={calculateGrandTotal()}
                  />
                </div>

                {formData.paid > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Payment Method:</span>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-32 px-2 py-1 border rounded text-sm"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Mobile Banking">Mobile Banking</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                )}
              </div>

              <div className={`flex justify-between text-lg font-bold ${dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span>Due:</span>
                <span>৳{dueAmount}</span>
              </div>

              {dueAmount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-sm text-yellow-800">
                  ⚠️ Due amount can be collected later from Due Collections page
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows="2"
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading || !selectedPatient || selectedServices.length === 0}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Bill & Print'}
          </button>
        </div>
      </form>
    </div>
  );
}