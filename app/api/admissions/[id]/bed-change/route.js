import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admission from '@/models/Admission';
import Bed from '@/models/Bed';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.MANAGE_ADMISSIONS)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const { id } = params;
    const { newBedId } = await request.json();

    const admission = await Admission.findById(id);
    if (!admission) {
      return NextResponse.json({ message: 'Admission not found' }, { status: 404 });
    }

    if (admission.status !== 'Admitted') {
      return NextResponse.json({ message: 'Patient is not admitted' }, { status: 400 });
    }

    // Check if new bed is available
    const newBed = await Bed.findById(newBedId);
    if (!newBed) {
      return NextResponse.json({ message: 'New bed not found' }, { status: 404 });
    }
    if (newBed.isOccupied) {
      return NextResponse.json({ message: 'New bed is already occupied' }, { status: 400 });
    }

    // Free old bed
    const oldBedId = admission.bed;
    await Bed.findByIdAndUpdate(oldBedId, {
      isOccupied: false,
      currentPatient: null
    });

    // Close current bed history entry
    const currentBedHistory = admission.bedHistory[admission.bedHistory.length - 1];
    currentBedHistory.toDate = new Date();

    // Add new bed history entry
    admission.bedHistory.push({
      bed: newBed._id,
      bedNumber: newBed.bedNumber,
      chargePerDay: newBed.chargePerDay,
      fromDate: new Date(),
      toDate: null
    });

    // Update admission
    admission.bed = newBed._id;
    admission.chargePerDay = newBed.chargePerDay;
    await admission.save();

    // Occupy new bed
    await Bed.findByIdAndUpdate(newBedId, {
      isOccupied: true,
      currentPatient: admission._id
    });

    const updatedAdmission = await Admission.findById(id)
      .populate('patient')
      .populate('consultant')
      .populate('bed');

    return NextResponse.json({
      message: 'Bed changed successfully',
      admission: updatedAdmission
    });

  } catch (error) {
    console.error('Bed change error:', error);
    return NextResponse.json({ message: 'Error changing bed' }, { status: 500 });
  }
}