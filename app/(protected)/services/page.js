// app/(protected)/services/page.js
'use client';

import ServiceManagement from '@/components/ServiceManagement';

export default function ServicesPage() {
  return (
    <div className="p-8">
      <ServiceManagement />
    </div>
  );
}