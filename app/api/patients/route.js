import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Patient from '@/models/Patient';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { generatePatientId, createPatientKey } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

// GET all patients
export async function GET(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.VIEW_PATIENTS)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const patients = await Patient.find().sort({ createdAt: -1 });

    return NextResponse.json({ patients });
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json({ message: 'Error fetching patients' }, { status: 500 });
  }
}

// POST create patient
export async function POST(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.MANAGE_PATIENTS)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const { name, age, sex, phone, bloodGroup, address } = await request.json();

    // Check if patient already exists
    const patientKey = createPatientKey(phone, name);
    const existingPatient = await Patient.findOne({ patientKey });

    if (existingPatient) {
      return NextResponse.json(
        { message: 'Patient already exists', patient: existingPatient },
        { status: 200 }
      );
    }

    // Generate patient ID
    const patientId = await generatePatientId();

    // Create new patient
    const newPatient = await Patient.create({
      patientId,
      name,
      age,
      sex,
      phone,
      bloodGroup: bloodGroup || '',
      address: address || '',
      patientKey
    });

    return NextResponse.json({
      message: 'Patient created successfully',
      patient: newPatient
    }, { status: 201 });

  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json({ message: 'Error creating patient' }, { status: 500 });
  }
}