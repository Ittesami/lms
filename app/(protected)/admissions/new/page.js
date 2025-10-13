// app/(protected)/admissions/new/page.js
'use client';

import AdmissionForm from '@/components/AdmissionForm';

export default function NewAdmissionPage() {
  return (
    <div className="p-8">
      <AdmissionForm />
    </div>
  );
}