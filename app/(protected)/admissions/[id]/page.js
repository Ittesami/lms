// app/(protected)/admissions/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdmissionDetailsPage({ params }) {
  const router = useRouter();
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBedChangeModal, setShowBedChangeModal] = useState(false);
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedBed, setSelectedBed] = useState('');
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  useEffect(() => {
    fetchAdmission();
    fetchAvailableBeds();
    fetchMedicines();
    fetchServices();
  }, [params.id]);

  const fetchAdmission = async () => {
    try {
      const res = await fetch(`/api/admissions/${params.id}`);
      const data = await res.json();
      setAdmission(data.admission);
    } catch (error) {
      console.error('Error fetching admission:', error);
    } finally {
      setLoading(false);
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

  const fetchMedicines = async () => {
    try {
      const res = await fetch('/api/medicine/inventory');
      const data = await res.json();
      setMedicines(data.medicines || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
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

  const handleBedChange = async () => {
    if (!selectedBed) return;

    try {
      const res = await fetch(`/api/admissions/${params.id}/bed-change`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newBedId: selectedBed })
      });

      if (res.ok) {
        alert('Bed changed successfully!');
        setShowBedChangeModal(false);
        fetchAdmission();
        fetchAvailableBeds();
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error changing bed:', error);
    }
  };

  const addMedicineItem = (medicineId) => {
    const medicine = medicines.find(m => m._id === medicineId);
    if (!medicine || !medicine.batches.length) return;

    const batch = medicine.batches[0];
    setSelectedMedicines([
      ...selectedMedicines,
      {
        medicineId: medicine._id,
        name: medicine.name,
        batchNumber: batch.batchNumber,
        quantity: 1,
        availableQty: batch.quantity,
        price: batch.price
      }
    ]);
  };

  const updateMedicineQuantity = (index, quantity) => {
    const updated = [...selectedMedicines];
    updated[index].quantity = Math.min(quantity, updated[index].availableQty);
    setSelectedMedicines(updated);
  };

  const removeMedicineItem = (index) => {
    setSelectedMedicines(selectedMedicines.filter((_, i) => i !== index));
  };

  const handleAddMedicine = async () => {
    if (selectedMedicines.length === 0) return;

    try {
      const res = await fetch(`/api/admissions/${params.id}/add-medicine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines: selectedMedicines })
      });

      if (res.ok) {
        alert('Medicine added successfully!');
        setShowAddMedicineModal(false);
        setSelectedMedicines([]);
        fetchAdmission();
        fetchMedicines();
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
    }
  };

  const addServiceItem = (serviceId) => {
    const service = services.find(s => s._id === serviceId);
    if (!service) return;

    setSelectedServices([
      ...selectedServices,
      {
        serviceId: service._id,
        name: service.name,
        unitPrice: service.unitPrice,
        quantity: 1
      }
    ]);
  };

  const updateServiceQuantity = (index, quantity) => {
    const updated = [...selectedServices];
    updated[index].quantity = quantity;
    setSelectedServices(updated);
  };

  const removeServiceItem = (index) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const handleAddService = async () => {
    if (selectedServices.length === 0) return;

    try {
      const res = await fetch(`/api/admissions/${params.id}/add-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: selectedServices })
      });

      if (res.ok) {
        alert('Service added successfully!');
        setShowAddServiceModal(false);
        setSelectedServices([]);
        fetchAdmission();
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const calculateDays = (startDate) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateEstimatedBill = () => {
    if (!admission) return 0;

    const days = calculateDays(admission.admissionDate);
    let bedCharges = 0;

    admission.bedHistory.forEach(bedHist => {
      const endDate = bedHist.toDate || new Date();
      const bedDays = calculateDays(bedHist.fromDate);
      bedCharges += bedDays * bedHist.chargePerDay;
    });

    const medicineCharges = admission.medicineInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const serviceCharges = admission.serviceInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    return bedCharges + medicineCharges + serviceCharges + admission.admissionFee;
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => router.push('/admissions')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Admissions
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            Admission Details - #{admission.admissionId}
          </h1>
        </div>

        {admission.status === 'Admitted' && (
          <button
            onClick={() => router.push(`/admissions/${params.id}/discharge`)}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Discharge Patient
          </button>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
          admission.status === 'Admitted' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {admission.status}
        </span>
      </div>

      {/* Patient & Admission Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Patient Information</h3>
          <div className="space-y-2">
            <p><strong>Name:</strong> {admission.patient?.name}</p>
            <p><strong>Patient ID:</strong> {admission.patient?.patientId}</p>
            <p><strong>Age/Sex:</strong> {admission.patient?.age}Y / {admission.patient?.sex}</p>
            <p><strong>Phone:</strong> {admission.patient?.phone}</p>
            <p><strong>Blood Group:</strong> {admission.patient?.bloodGroup || 'N/A'}</p>
            <p><strong>Address:</strong> {admission.patient?.address || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">Admission Information</h3>
          <div className="space-y-2">
            <p><strong>Admission Date:</strong> {new Date(admission.admissionDate).toLocaleDateString()}</p>
            <p><strong>Days Admitted:</strong> {calculateDays(admission.admissionDate)}</p>
            <p><strong>Consultant:</strong> {admission.consultant?.name}</p>
            <p><strong>Current Bed:</strong> {admission.bed?.bedNumber} - {admission.bed?.bedName}</p>
            <p><strong>Bed Charge:</strong> ৳{admission.chargePerDay}/day</p>
            <p><strong>Contact Person:</strong> {admission.contactPersonName}</p>
            <p><strong>Contact Phone:</strong> {admission.contactPersonPhone}</p>
            {admission.referredBy && <p><strong>Referred By:</strong> {admission.referredBy}</p>}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {admission.status === 'Admitted' && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowBedChangeModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Change Bed
          </button>
          <button
            onClick={() => setShowAddMedicineModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Add Medicine
          </button>
          <button
            onClick={() => setShowAddServiceModal(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Add Service
          </button>
        </div>
      )}

      {/* Bed History */}
      {admission.bedHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-bold mb-4">Bed History</h3>
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Bed</th>
                <th className="px-4 py-2 text-left">From Date</th>
                <th className="px-4 py-2 text-left">To Date</th>
                <th className="px-4 py-2 text-right">Charge/Day</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {admission.bedHistory.map((bed, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">{bed.bedNumber}</td>
                  <td className="px-4 py-2">{new Date(bed.fromDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    {bed.toDate ? new Date(bed.toDate).toLocaleDateString() : 'Current'}
                  </td>
                  <td className="px-4 py-2 text-right">৳{bed.chargePerDay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Medicine Invoices */}
      {admission.medicineInvoices.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-bold mb-4">Medicine Invoices</h3>
          {admission.medicineInvoices.map((invoice, invIndex) => (
            <div key={invIndex} className="mb-4 border-b pb-4">
              <p className="text-sm text-gray-600 mb-2">
                Date: {new Date(invoice.date).toLocaleDateString()}
              </p>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Medicine</th>
                    <th className="px-4 py-2 text-left">Batch</th>
                    <th className="px-4 py-2 text-center">Qty</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.medicines.map((med, medIndex) => (
                    <tr key={medIndex}>
                      <td className="px-4 py-2">{med.name}</td>
                      <td className="px-4 py-2">{med.batchNumber}</td>
                      <td className="px-4 py-2 text-center">{med.quantity}</td>
                      <td className="px-4 py-2 text-right">৳{med.price}</td>
                      <td className="px-4 py-2 text-right">৳{med.price * med.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right mt-2">
                <strong>Invoice Total: ৳{invoice.totalAmount}</strong>
              </div>
            </div>
          ))}
          <div className="text-right text-lg font-bold">
            Total Medicine Charges: ৳{admission.medicineInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)}
          </div>
        </div>
      )}

      {/* Service Invoices */}
      {admission.serviceInvoices.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-bold mb-4">Service Invoices</h3>
          {admission.serviceInvoices.map((invoice, invIndex) => (
            <div key={invIndex} className="mb-4 border-b pb-4">
              <p className="text-sm text-gray-600 mb-2">
                Date: {new Date(invoice.date).toLocaleDateString()}
              </p>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Service</th>
                    <th className="px-4 py-2 text-center">Qty</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.services.map((serv, servIndex) => (
                    <tr key={servIndex}>
                      <td className="px-4 py-2">{serv.serviceName}</td>
                      <td className="px-4 py-2 text-center">{serv.quantity}</td>
                      <td className="px-4 py-2 text-right">৳{serv.unitPrice}</td>
                      <td className="px-4 py-2 text-right">৳{serv.unitPrice * serv.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right mt-2">
                <strong>Invoice Total: ৳{invoice.totalAmount}</strong>
              </div>
            </div>
          ))}
          <div className="text-right text-lg font-bold">
            Total Service Charges: ৳{admission.serviceInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)}
          </div>
        </div>
      )}

      {/* Estimated Bill Summary */}
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Estimated Bill Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Admission Fee:</span>
            <span>৳{admission.admissionFee}</span>
          </div>
          <div className="flex justify-between">
            <span>Bed Charges ({calculateDays(admission.admissionDate)} days):</span>
            <span>৳{calculateDays(admission.admissionDate) * admission.chargePerDay}</span>
          </div>
          <div className="flex justify-between">
            <span>Medicine Charges:</span>
            <span>৳{admission.medicineInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Charges:</span>
            <span>৳{admission.serviceInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)}</span>
          </div>
          <div className="flex justify-between border-t-2 pt-2 text-lg font-bold">
            <span>Estimated Total:</span>
            <span>৳{calculateEstimatedBill()}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Advance Paid:</span>
            <span>৳{admission.advanceAmount}</span>
          </div>
          <div className="flex justify-between text-red-600 font-bold">
            <span>Estimated Due:</span>
            <span>৳{calculateEstimatedBill() - admission.advanceAmount}</span>
          </div>
        </div>
      </div>

      {/* Bed Change Modal */}
      {showBedChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Change Bed</h3>
            <p className="text-sm text-gray-600 mb-4">
              Current Bed: <strong>{admission.bed?.bedNumber}</strong>
            </p>
            <select
              value={selectedBed}
              onChange={(e) => setSelectedBed(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
            >
              <option value="">Select New Bed</option>
              {availableBeds.map((bed) => (
                <option key={bed._id} value={bed._id}>
                  {bed.bedNumber} - {bed.bedName} (৳{bed.chargePerDay}/day)
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBedChangeModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBedChange}
                disabled={!selectedBed}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              >
                Change Bed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddMedicineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h3 className="text-xl font-bold mb-4">Add Medicine</h3>

            <select
              onChange={(e) => {
                addMedicineItem(e.target.value);
                e.target.value = '';
              }}
              className="w-full px-3 py-2 border rounded-lg mb-4"
            >
              <option value="">Select medicine to add</option>
              {medicines.map((med) => (
                <option key={med._id} value={med._id}>
                  {med.name} - Stock: {med.currentStock}
                </option>
              ))}
            </select>

            {selectedMedicines.length > 0 && (
              <div className="border rounded-lg overflow-hidden mb-4">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Medicine</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMedicines.map((med, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">
                          {med.name}
                          <br />
                          <span className="text-xs text-gray-600">Batch: {med.batchNumber}</span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            value={med.quantity}
                            onChange={(e) => updateMedicineQuantity(index, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 border rounded text-center"
                            min="1"
                            max={med.availableQty}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">৳{med.price}</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          ৳{med.price * med.quantity}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => removeMedicineItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-gray-50 px-4 py-2 text-right font-bold">
                  Total: ৳{selectedMedicines.reduce((sum, m) => sum + m.price * m.quantity, 0)}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddMedicineModal(false);
                  setSelectedMedicines([]);
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMedicine}
                disabled={selectedMedicines.length === 0}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
              >
                Add Medicine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h3 className="text-xl font-bold mb-4">Add Service</h3>

            <select
              onChange={(e) => {
                addServiceItem(e.target.value);
                e.target.value = '';
              }}
              className="w-full px-3 py-2 border rounded-lg mb-4"
            >
              <option value="">Select service to add</option>
              {services.map((serv) => (
                <option key={serv._id} value={serv._id}>
                  {serv.name} - ৳{serv.unitPrice}
                </option>
              ))}
            </select>

            {selectedServices.length > 0 && (
              <div className="border rounded-lg overflow-hidden mb-4">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Service</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedServices.map((serv, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">{serv.name}</td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            value={serv.quantity}
                            onChange={(e) => updateServiceQuantity(index, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 border rounded text-center"
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">৳{serv.unitPrice}</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          ৳{serv.unitPrice * serv.quantity}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => removeServiceItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-gray-50 px-4 py-2 text-right font-bold">
                  Total: ৳{selectedServices.reduce((sum, s) => sum + s.unitPrice * s.quantity, 0)}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddServiceModal(false);
                  setSelectedServices([]);
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                disabled={selectedServices.length === 0}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400"
              >
                Add Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}