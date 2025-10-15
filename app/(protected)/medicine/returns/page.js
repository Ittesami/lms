// app/(protected)/medicine/returns/page.js
'use client';

import { useState, useEffect, useRef } from 'react';

export default function MedicineReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [returnType, setReturnType] = useState('Outdoor');
  const [billId, setBillId] = useState('');
  const [admissionId, setAdmissionId] = useState('');
  const [sourceData, setSourceData] = useState(null);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [refundMethod, setRefundMethod] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  
  // States for searchable dropdowns
  const [allSales, setAllSales] = useState([]);
  const [allAdmissions, setAllAdmissions] = useState([]);
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [admissionsSearchTerm, setAdmissionsSearchTerm] = useState('');
  const [showSalesDropdown, setShowSalesDropdown] = useState(false);
  const [showAdmissionsDropdown, setShowAdmissionsDropdown] = useState(false);

  // Refs for dropdown management
  const salesDropdownRef = useRef(null);
  const admissionsDropdownRef = useRef(null);

  useEffect(() => {
    if (!showForm) {
      fetchReturns();
    } else {
      // Fetch sales and admissions when form is shown
      if (returnType === 'Outdoor') {
        fetchAllSales();
      } else {
        fetchAllAdmissions();
      }
    }
  }, [showForm, returnType]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (salesDropdownRef.current && !salesDropdownRef.current.contains(event.target)) {
        setShowSalesDropdown(false);
      }
      if (admissionsDropdownRef.current && !admissionsDropdownRef.current.contains(event.target)) {
        setShowAdmissionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllSales = async () => {
    try {
      const res = await fetch('/api/outdoor-sales');
      const data = await res.json();
      setAllSales(data.sales || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchAllAdmissions = async () => {
    try {
      const res = await fetch('/api/admissions');
      const data = await res.json();
      setAllAdmissions(data.admissions || []);
    } catch (error) {
      console.error('Error fetching admissions:', error);
    }
  };

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/medicine/returns');
      const data = await res.json();
      setReturns(data.returns || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter sales based on search term
  const filteredSales = allSales.filter(sale => {
    const searchLower = salesSearchTerm.toLowerCase();
    return (
      sale.billId?.toString().includes(searchLower) ||
      sale.customerName?.toLowerCase().includes(searchLower) ||
      sale.customerPhone?.includes(searchLower)
    );
  });

  // Filter admissions based on search term
  const filteredAdmissions = allAdmissions.filter(admission => {
    const searchLower = admissionsSearchTerm.toLowerCase();
    return (
      admission.admissionId?.toString().includes(searchLower) ||
      admission.patient?.name?.toLowerCase().includes(searchLower) ||
      admission.patient?.phone?.includes(searchLower)
    );
  });

  const selectSale = async (sale) => {
    setBillId(sale.billId.toString());
    setSalesSearchTerm(`#${sale.billId} - ${sale.customerName || 'Walk-in'}`);
    setShowSalesDropdown(false);
    
    // Auto-fetch the sale data
    setLoading(true);
    try {
      setSourceData({
        type: 'Outdoor',
        id: sale._id,
        billId: sale.billId,
        date: sale.date,
        customer: sale.customerName || 'Walk-in',
        medicines: sale.medicines.map(m => ({
          medicineId: m.medicine?._id || m.medicine,
          medicineName: m.medicineName,
          batchNumber: m.batchNumber,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
          maxReturn: m.quantity
        }))
      });
    } catch (error) {
      console.error('Error loading sale:', error);
      alert('Error loading sale data');
    } finally {
      setLoading(false);
    }
  };

  const selectAdmission = async (admission) => {
    setAdmissionId(admission.admissionId.toString());
    setAdmissionsSearchTerm(`#${admission.admissionId} - ${admission.patient?.name || 'Unknown'}`);
    setShowAdmissionsDropdown(false);
    
    // Auto-fetch the admission data
    setLoading(true);
    try {
      const allMedicines = admission.medicineInvoices?.flatMap(inv => 
        inv.medicines.map(m => ({
          medicineId: m.medicineId,
          medicineName: m.name,
          batchNumber: m.batchNumber,
          quantity: m.quantity,
          unitPrice: m.price,
          maxReturn: m.quantity
        }))
      ) || [];

      setSourceData({
        type: 'Indoor',
        id: admission._id,
        admissionId: admission.admissionId,
        patient: admission.patient?.name,
        medicines: allMedicines
      });
    } catch (error) {
      console.error('Error loading admission:', error);
      alert('Error loading admission data');
    } finally {
      setLoading(false);
    }
  };

  const toggleMedicine = (medicine) => {
    const existing = selectedMedicines.find(m => 
      m.medicineId === medicine.medicineId && m.batchNumber === medicine.batchNumber
    );

    if (existing) {
      setSelectedMedicines(selectedMedicines.filter(m => 
        !(m.medicineId === medicine.medicineId && m.batchNumber === medicine.batchNumber)
      ));
    } else {
      setSelectedMedicines([
        ...selectedMedicines,
        {
          ...medicine,
          returnQuantity: 1,
          reason: ''
        }
      ]);
    }
  };

  const updateReturnQuantity = (medicineId, batchNumber, quantity) => {
    setSelectedMedicines(selectedMedicines.map(m => {
      if (m.medicineId === medicineId && m.batchNumber === batchNumber) {
        return { ...m, returnQuantity: Math.min(Math.max(1, quantity), m.maxReturn) };
      }
      return m;
    }));
  };

  const updateReason = (medicineId, batchNumber, reason) => {
    setSelectedMedicines(selectedMedicines.map(m => {
      if (m.medicineId === medicineId && m.batchNumber === batchNumber) {
        return { ...m, reason };
      }
      return m;
    }));
  };

  const calculateTotalReturn = () => {
    return selectedMedicines.reduce((sum, m) => sum + (m.unitPrice * m.returnQuantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedMedicines.length === 0) {
      alert('Please select at least one medicine to return');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/medicine/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnType,
          billId: returnType === 'Outdoor' ? parseInt(billId) : undefined,
          admissionId: returnType === 'Indoor' ? parseInt(admissionId) : undefined,
          medicines: selectedMedicines.map(m => ({
            medicineId: m.medicineId,
            medicineName: m.medicineName,
            batchNumber: m.batchNumber,
            quantity: m.returnQuantity,
            unitPrice: m.unitPrice,
            reason: m.reason
          })),
          refundMethod,
          remarks
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Medicine return processed successfully!');
        resetForm();
        setShowForm(false);
      } else {
        alert(data.message || 'Error processing return');
      }
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Error processing return');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBillId('');
    setAdmissionId('');
    setSalesSearchTerm('');
    setAdmissionsSearchTerm('');
    setSourceData(null);
    setSelectedMedicines([]);
    setRefundMethod('Cash');
    setRemarks('');
  };

  return (
    <div className="p-8">
      {!showForm ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Medicine Returns</h1>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              + Process Return
            </button>
          </div>

          {/* Returns List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Return ID</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Refund Method</th>
                    <th className="px-4 py-3 text-left">Processed By</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-gray-500">
                        Loading returns...
                      </td>
                    </tr>
                  ) : returns.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-gray-500">
                        No returns found
                      </td>
                    </tr>
                  ) : (
                    returns.map((ret) => (
                      <tr key={ret._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-red-600">
                          #R{ret.returnId}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(ret.returnDate).toLocaleString('en-GB')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            ret.returnType === 'Outdoor' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {ret.returnType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {ret.returnType === 'Outdoor' 
                            ? `Bill #${ret.outdoorSale?.billId}` 
                            : `Admission #${ret.admission?.admissionId}`
                          }
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">
                          ৳{ret.totalReturnAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">{ret.refundMethod}</td>
                        <td className="px-4 py-3 text-sm">{ret.processedBy?.fullName}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            ret.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            ret.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ret.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          {returns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Total Returns</p>
                <p className="text-2xl font-bold">{returns.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Total Refunded</p>
                <p className="text-2xl font-bold text-red-600">
                  ৳{returns.reduce((sum, r) => sum + r.totalReturnAmount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Outdoor Returns</p>
                <p className="text-2xl font-bold text-blue-600">
                  {returns.filter(r => r.returnType === 'Outdoor').length}
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
            ← Back to Returns
          </button>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Process Medicine Return</h2>

            <form onSubmit={handleSubmit}>
              {/* Return Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Return Type *</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Outdoor"
                      checked={returnType === 'Outdoor'}
                      onChange={(e) => {
                        setReturnType(e.target.value);
                        resetForm();
                      }}
                      className="mr-2"
                    />
                    <span>Outdoor Sale</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Indoor"
                      checked={returnType === 'Indoor'}
                      onChange={(e) => {
                        setReturnType(e.target.value);
                        resetForm();
                      }}
                      className="mr-2"
                    />
                    <span>Indoor Patient</span>
                  </label>
                </div>
              </div>

              {/* Searchable Dropdowns */}
              <div className="mb-6">
                {returnType === 'Outdoor' ? (
                  <div ref={salesDropdownRef} className="relative">
                    <label className="block text-sm font-medium mb-1">
                      Search Bill ID / Customer Name / Phone *
                    </label>
                    <input
                      type="text"
                      value={salesSearchTerm}
                      onChange={(e) => {
                        setSalesSearchTerm(e.target.value);
                        setShowSalesDropdown(true);
                      }}
                      onFocus={() => setShowSalesDropdown(true)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Type to search sales..."
                      autoComplete="off"
                    />
                    
                    {showSalesDropdown && filteredSales.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {filteredSales.slice(0, 20).map((sale) => (
                          <div
                            key={sale._id}
                            onClick={() => selectSale(sale)}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  Bill #{sale.billId}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {sale.customerName || 'Walk-in Customer'}
                                </p>
                                {sale.customerPhone && (
                                  <p className="text-xs text-gray-500">{sale.customerPhone}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-green-600">
                                  ৳{sale.grandTotal?.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(sale.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div ref={admissionsDropdownRef} className="relative">
                    <label className="block text-sm font-medium mb-1">
                      Search Admission ID / Patient Name / Phone *
                    </label>
                    <input
                      type="text"
                      value={admissionsSearchTerm}
                      onChange={(e) => {
                        setAdmissionsSearchTerm(e.target.value);
                        setShowAdmissionsDropdown(true);
                      }}
                      onFocus={() => setShowAdmissionsDropdown(true)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Type to search admissions..."
                      autoComplete="off"
                    />
                    
                    {showAdmissionsDropdown && filteredAdmissions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {filteredAdmissions.slice(0, 20).map((admission) => (
                          <div
                            key={admission._id}
                            onClick={() => selectAdmission(admission)}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  Admission #{admission.admissionId}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {admission.patient?.name || 'Unknown Patient'}
                                </p>
                                {admission.patient?.phone && (
                                  <p className="text-xs text-gray-500">{admission.patient.phone}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  {admission.bed?.bedNumber || 'No Bed'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(admission.admissionDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Source Data Display */}
              {sourceData && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-bold mb-2">
                    {sourceData.type === 'Outdoor' ? 'Sale' : 'Admission'} Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {sourceData.type === 'Outdoor' ? (
                      <>
                        <p><strong>Bill ID:</strong> #{sourceData.billId}</p>
                        <p><strong>Customer:</strong> {sourceData.customer}</p>
                        <p><strong>Date:</strong> {new Date(sourceData.date).toLocaleDateString()}</p>
                      </>
                    ) : (
                      <>
                        <p><strong>Admission ID:</strong> #{sourceData.admissionId}</p>
                        <p><strong>Patient:</strong> {sourceData.patient}</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Medicine Selection */}
              {sourceData && sourceData.medicines.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3">Select Medicines to Return</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Select</th>
                          <th className="px-4 py-2 text-left">Medicine</th>
                          <th className="px-4 py-2 text-left">Batch</th>
                          <th className="px-4 py-2 text-center">Sold Qty</th>
                          <th className="px-4 py-2 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sourceData.medicines.map((med, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={selectedMedicines.some(m => 
                                  m.medicineId === med.medicineId && m.batchNumber === med.batchNumber
                                )}
                                onChange={() => toggleMedicine(med)}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="px-4 py-2">{med.medicineName}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{med.batchNumber}</td>
                            <td className="px-4 py-2 text-center">{med.quantity}</td>
                            <td className="px-4 py-2 text-right">৳{med.unitPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Selected Medicines for Return */}
              {selectedMedicines.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3">Return Details</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Medicine</th>
                          <th className="px-4 py-2 text-left">Batch</th>
                          <th className="px-4 py-2 text-center">Return Qty</th>
                          <th className="px-4 py-2 text-right">Refund</th>
                          <th className="px-4 py-2 text-left">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedMedicines.map((med, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">{med.medicineName}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{med.batchNumber}</td>
                            <td className="px-4 py-2 text-center">
                              <input
                                type="number"
                                value={med.returnQuantity}
                                onChange={(e) => updateReturnQuantity(
                                  med.medicineId, 
                                  med.batchNumber, 
                                  parseInt(e.target.value)
                                )}
                                className="w-20 px-2 py-1 border rounded text-center"
                                min="1"
                                max={med.maxReturn}
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                Max: {med.maxReturn}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-red-600">
                              ৳{(med.unitPrice * med.returnQuantity).toLocaleString()}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={med.reason}
                                onChange={(e) => updateReason(
                                  med.medicineId, 
                                  med.batchNumber, 
                                  e.target.value
                                )}
                                className="w-full px-2 py-1 border rounded text-sm"
                                placeholder="Optional reason"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Return Summary */}
                  <div className="mt-4 bg-red-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center text-lg font-bold text-red-600">
                      <span>Total Refund Amount:</span>
                      <span>৳{calculateTotalReturn().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Refund Method */}
              {selectedMedicines.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">Refund Method *</label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Credit Note">Credit Note</option>
                      <option value="Account Adjustment">Account Adjustment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Remarks</label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="1"
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
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
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : 'Process Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}