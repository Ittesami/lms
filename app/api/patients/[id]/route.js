// app/api/patients/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Patient from '@/models/Patient';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { createPatientKey } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

// GET single patient
export async function GET(request, { params }) {
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

    const patient = await Patient.findById(params.id);

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error('Get patient error:', error);
    return NextResponse.json({ 
      message: 'Error fetching patient',
      error: error.message 
    }, { status: 500 });
  }
}

// PUT update patient
export async function PUT(request, { params }) {
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

    // Check if patient exists
    const existingPatient = await Patient.findById(params.id);
    if (!existingPatient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    // Create new patient key
    const patientKey = createPatientKey(phone, name);

    // Check if another patient with same phone/name exists (excluding current patient)
    const duplicatePatient = await Patient.findOne({
      patientKey,
      _id: { $ne: params.id }
    });

    if (duplicatePatient) {
      return NextResponse.json(
        { message: 'Another patient with this phone and name already exists' },
        { status: 400 }
      );
    }

    // Update patient
    const updatedPatient = await Patient.findByIdAndUpdate(
      params.id,
      {
        name,
        age,
        sex,
        phone,
        bloodGroup: bloodGroup || '',
        address: address || '',
        patientKey
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Patient updated successfully',
      patient: updatedPatient
    });

  } catch (error) {
    console.error('Update patient error:', error);
    return NextResponse.json({ 
      message: 'Error updating patient',
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE patient
export async function DELETE(request, { params }) {
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

    const patient = await Patient.findById(params.id);
    
    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    // Optional: Check if patient has any associated records
    // Uncomment if you want to prevent deletion of patients with records
    
    const hasInvestigations = await InvestigationBilling.findOne({ patient: params.id });
    if (hasInvestigations) {
      return NextResponse.json(
        { message: 'Cannot delete patient with existing investigation records' },
        { status: 400 }
      );
    }
    

    await Patient.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Patient deleted successfully' });

  } catch (error) {
    console.error('Delete patient error:', error);
    return NextResponse.json({ 
      message: 'Error deleting patient',
      error: error.message 
    }, { status: 500 });
  }
}