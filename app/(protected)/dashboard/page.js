'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddMedicine from '@/components/AddMedicine';
import MedicineList from '@/components/MedicineList';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const canAddMedicines = user.permissions?.includes('add_medicines') || user.role === 'admin';
  const canViewInventory = user.permissions?.includes('view_inventory') || user.role === 'admin';

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user.fullName}</p>
      </div>

      {canAddMedicines ? (
        <AddMedicine onMedicineAdded={handleMedicineAdded} />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <p className="text-yellow-800">⚠️ You don't have permission to add medicines.</p>
        </div>
      )}

      {canViewInventory ? (
        <MedicineList refresh={refreshKey} />
      ) : (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-800">🚫 You don't have permission to view inventory.</p>
        </div>
      )}
    </div>
  );
}