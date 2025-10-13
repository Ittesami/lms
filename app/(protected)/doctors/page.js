// app/(protected)/doctors/page.js
'use client';

import DoctorManagement from '@/components/DoctorManagement';

export default function DoctorsPage() {
  return (
    <div className="p-8">
      <DoctorManagement />
    </div>
  );
}