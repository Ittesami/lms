// app/(protected)/outdoor-sales/page.js
'use client';

import { useState, useEffect } from 'react';

export default function OutdoorSalesPage() {
  const [sales, setSales] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    discount: 0,
    paid: 0,
    paymentMethod: 'Cash',
    remarks: ''
  });
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    if (!showForm) {
      fetchSales();
    }
    fetchMedicines();
  }, [showForm]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/outdoor-sales');
      const data = await res.json();
      setSales(data.sales || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await fetch('/api/medicine/inventory');
      const data = await res.json();
      setMedicines(data.medicines || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const addMedicine = (medicineId) => {
    const medicine = medicines.find(m => m._id === medicineId);
    if (!medicine || !medicine.batches || medicine.batches.length === 0) {
      alert('No stock available for this medicine');
      return;
    }

    const batch = medicine.batches[0];
    
    const existing = selectedMedicines.find(
      m => m.medicineId === medicineId && m.batchNumber === batch.batchNumber
    );

    if (existing) {
      setSelectedMedicines(
        selectedMedicines.map(m =>
          m.medicineId === medicineId && m.batchNumber === batch.batchNumber
            ? { ...m, quantity: Math.min(m.quantity + 1, batch.quantity) }
            : m
        )
      );
    } else {
      setSelectedMedicines([
        ...selectedMedicines,
        {
          medicineId: medicine._id,
          medicineName: medicine.name,
          batchNumber: batch.batchNumber,
          quantity: 1,
          unitPrice: batch.price,
          availableQty: batch.quantity
        }
      ]);
    }
  };

  const updateMedicineQuantity = (index, quantity) => {
    const updated = [...selectedMedicines];
    updated[index].quantity = Math.min(
      Math.max(1, quantity),
      updated[index].availableQty
    );
    setSelectedMedicines(updated);
  };

  const removeMedicine = (index) => {
    setSelectedMedicines(selectedMedicines.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return selectedMedicines.reduce(
      (sum, med) => sum + med.unitPrice * med.quantity,
      0
    );
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() - (formData.discount || 0);
  };

  const calculateDue = () => {
    return calculateGrandTotal() - (formData.paid || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedMedicines.length === 0) {
      alert('Please add at least one medicine');
      return;
    }

    if (formData.discount > calculateSubtotal()) {
      alert('Discount cannot be greater than subtotal');
      return;
    }

    if (formData.paid > calculateGrandTotal()) {
      alert('Paid amount cannot be greater than grand total');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/outdoor-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          medicines: selectedMedicines,
          discount: formData.discount || 0,
          paid: formData.paid || 0,
          paymentMethod: formData.paymentMethod,
          remarks: formData.remarks
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Sale completed successfully!');
        resetForm();
        setShowForm(false);
        
        // Open invoice in new tab
        window.open(`/api/outdoor-sales/${data.sale._id}/invoice`, '_blank');
      } else {
        alert(data.message || 'Error creating sale');
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error creating sale');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMedicines([]);
    setFormData({
      customerName: '',
      customerPhone: '',
      discount: 0,
      paid: 0,
      paymentMethod: 'Cash',
      remarks: ''
    });
  };

  return (
    <div className="p-8">
      {!showForm ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Outdoor Sales</h1>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              + New Sale
            </button>
          </div>

          {/* Sales List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Bill ID</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Sold By</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Due</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-gray-500">
                        Loading sales...
                      </td>
                    </tr>
                  ) : sales.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-gray-500">
                        No sales found. Create one to get started!
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr 
                        key={sale._id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <td className="px-4 py-3 font-semibold text-blue-600">
                          #{sale.billId}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(sale.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div>{sale.customerName || 'Walk-in Customer'}</div>
                            {sale.customerPhone && (
                              <div className="text-gray-500">{sale.customerPhone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{sale.soldBy?.fullName}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          ৳{sale.grandTotal.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600">
                          ৳{sale.paid.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={sale.due > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                            ৳{sale.due.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/api/outdoor-sales/${sale._id}/invoice`, '_blank');
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            Invoice
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
          {sales.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Total Sales</p>
                <p className="text-2xl font-bold">{sales.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ৳{sales.reduce((sum, s) => sum + s.grandTotal, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Total Collected</p>
                <p className="text-2xl font-bold text-blue-600">
                  ৳{sales.reduce((sum, s) => sum + s.paid, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Total Due</p>
                <p className="text-2xl font-bold text-red-600">
                  ৳{sales.reduce((sum, s) => sum + s.due, 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
            className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Sales
          </button>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">New Outdoor Sale</h2>

            <form onSubmit={handleSubmit}>
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Phone</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Medicine Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Add Medicines</label>
                <select
                  onChange={(e) => {
                    addMedicine(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select medicine to add</option>
                  {medicines
                    .filter(m => m.currentStock > 0)
                    .map((medicine) => (
                      <option key={medicine._id} value={medicine._id}>
                        {medicine.name} - Stock: {medicine.currentStock} - ৳{medicine.batches[0]?.price}
                      </option>
                    ))}
                </select>
              </div>

              {/* Selected Medicines Table */}
              {selectedMedicines.length > 0 && (
                <div className="border rounded-lg overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">#</th>
                        <th className="px-4 py-2 text-left">Medicine</th>
                        <th className="px-4 py-2 text-left">Batch</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedMedicines.map((med, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">{index + 1}</td>
                          <td className="px-4 py-2">{med.medicineName}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {med.batchNumber}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="number"
                              value={med.quantity}
                              onChange={(e) =>
                                updateMedicineQuantity(index, parseInt(e.target.value))
                              }
                              className="w-16 px-2 py-1 border rounded text-center"
                              min="1"
                              max={med.availableQty}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              Max: {med.availableQty}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">৳{med.unitPrice}</td>
                          <td className="px-4 py-2 text-right font-semibold">
                            ৳{(med.unitPrice * med.quantity).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => removeMedicine(index)}
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
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="space-y-3 max-w-md ml-auto">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">৳{calculateSubtotal().toLocaleString()}</span>
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
                      max={calculateSubtotal()}
                    />
                  </div>

                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Grand Total:</span>
                    <span>৳{calculateGrandTotal().toLocaleString()}</span>
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

                  <div className={`flex justify-between text-lg font-bold ${
                    calculateDue() > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    <span>Due:</span>
                    <span>৳{calculateDue().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                  placeholder="Any additional notes..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedMedicines.length === 0}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : 'Complete Sale & Print'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Sale Details - #{selectedSale.billId}</h2>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">
                    {new Date(selectedSale.date).toLocaleString('en-GB')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sold By</p>
                  <p className="font-semibold">{selectedSale.soldBy?.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold">
                    {selectedSale.customerName || 'Walk-in Customer'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">
                    {selectedSale.customerPhone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Medicines */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-3">Medicines</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Medicine</th>
                      <th className="px-3 py-2 text-left">Batch</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedSale.medicines.map((med, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">{med.medicineName}</td>
                        <td className="px-3 py-2 text-gray-600">{med.batchNumber}</td>
                        <td className="px-3 py-2 text-center">{med.quantity}</td>
                        <td className="px-3 py-2 text-right">৳{med.unitPrice}</td>
                        <td className="px-3 py-2 text-right font-semibold">
                          ৳{med.totalPrice.toLocaleString()}
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
                    <span className="font-semibold">৳{selectedSale.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="font-semibold text-red-600">
                      -৳{selectedSale.discount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Grand Total:</span>
                    <span>৳{selectedSale.grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Paid ({selectedSale.paymentMethod}):</span>
                    <span className="font-semibold">৳{selectedSale.paid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-red-600">
                    <span>Due:</span>
                    <span>৳{selectedSale.due.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {selectedSale.remarks && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold mb-2">Remarks</h3>
                  <p className="text-sm text-gray-700">{selectedSale.remarks}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => window.open(`/api/outdoor-sales/${selectedSale._id}/invoice`, '_blank')}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}