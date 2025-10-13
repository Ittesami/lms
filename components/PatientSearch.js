// components/PatientSearch.js
'use client';

import { useState } from 'react';

export default function PatientSearch({ onSelectPatient, onCreateNew }) {
  const [searchType, setSearchType] = useState('phone');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    phone: '',
    bloodGroup: '',
    address: ''
  });

  const handleSearch = async () => {
    if (!searchValue.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/patients/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [searchType]: searchValue
        })
      });

      const data = await res.json();
      setResults(data.patients || []);

      if (data.patients.length === 0) {
        setShowCreateForm(true);
        if (searchType === 'phone') {
          setNewPatient({ ...newPatient, phone: searchValue });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async () => {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });

      const data = await res.json();
      
      if (res.ok) {
        onSelectPatient(data.patient);
        setShowCreateForm(false);
        setResults([]);
        setSearchValue('');
      }
    } catch (error) {
      console.error('Create patient error:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Patient Information</h3>

      {/* Search Section */}
      <div className="mb-4">
        <div className="flex gap-3 mb-3">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="phone">Phone</option>
            <option value="name">Name</option>
          </select>

          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search by ${searchType}`}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>

          <button
            onClick={() => {
              setShowCreateForm(true);
              setResults([]);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            + New Patient
          </button>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-sm font-semibold mb-2">Found {results.length} patient(s):</p>
            <div className="space-y-2">
              {results.map((patient) => (
                <div
                  key={patient._id}
                  onClick={() => {
                    onSelectPatient(patient);
                    setResults([]);
                    setSearchValue('');
                  }}
                  className="p-3 bg-white border rounded cursor-pointer hover:bg-blue-50 hover:border-blue-500"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{patient.name}</p>
                      <p className="text-sm text-gray-600">
                        {patient.age}Y | {patient.sex} | {patient.phone}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded h-fit">
                      {patient.patientId}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create New Patient Form */}
      {showCreateForm && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 text-gray-700">Create New Patient</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <input
                type="text"
                value={newPatient.phone}
                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Age *</label>
              <input
                type="number"
                value={newPatient.age}
                onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sex *</label>
              <select
                value={newPatient.sex}
                onChange={(e) => setNewPatient({ ...newPatient, sex: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Blood Group</label>
              <select
                value={newPatient.bloodGroup}
                onChange={(e) => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={newPatient.address}
                onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreatePatient}
              disabled={!newPatient.name || !newPatient.phone || !newPatient.age}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
            >
              Create & Use Patient
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}