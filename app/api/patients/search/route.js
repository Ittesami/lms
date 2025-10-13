import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Patient from '@/models/Patient';
import { getUserFromRequest } from '@/lib/auth';
import { createPatientKey } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const { name, phone } = await request.json();

    let query = {};

    if (name && phone) {
      // Search by exact match using patient key
      const patientKey = createPatientKey(phone, name);
      query = { patientKey };
    } else if (phone) {
      // Search by phone number
      query = { phone: { $regex: phone, $options: 'i' } };
    } else if (name) {
      // Search by name
      query = { name: { $regex: name, $options: 'i' } };
    }

    const patients = await Patient.find(query).limit(20).sort({ createdAt: -1 });

    return NextResponse.json({ patients });

  } catch (error) {
    console.error('Search patients error:', error);
    return NextResponse.json({ message: 'Error searching patients' }, { status: 500 });
  }
}
