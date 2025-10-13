// app/(protected)/beds/page.js
'use client';

import BedManagement from '@/components/BedManagement';

export default function BedsPage() {
  return (
    <div className="p-8">
      <BedManagement />
    </div>
  );
}