import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admission from '@/models/Admission';
import Bed from '@/models/Bed';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getNextId } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

// GET all admissions
export async function GET(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.VIEW_ADMISSIONS)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'Admitted';

    const admissions = await Admission.find({ status })
      .populate('patient')
      .populate('consultant')
      .populate('bed')
      .sort({ admissionDate: -1 });

    return NextResponse.json({ admissions });
  } catch (error) {
    console.error('Get admissions error:', error);
    return NextResponse.json({ message: 'Error fetching admissions' }, { status: 500 });
  }
}
// POST create admission
export async function POST(request) {
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

    const data = await request.json();

    // Check if bed is available
    const bed = await Bed.findById(data.bed);
    if (!bed) {
      return NextResponse.json({ message: 'Bed not found' }, { status: 404 });
    }
    if (bed.isOccupied) {
      return NextResponse.json({ message: 'Bed is already occupied' }, { status: 400 });
    }

    // Get next admission ID
    const admissionId = await getNextId('admission');

    // Create admission
    const admission = await Admission.create({
      admissionId,
      patient: data.patient,
      contactPersonName: data.contactPersonName,
      contactPersonPhone: data.contactPersonPhone,
      consultant: data.consultant,
      referredBy: data.referredBy || '',
      bed: data.bed,
      chargePerDay: bed.chargePerDay,
      admissionDate: data.admissionDate || new Date(),
      admissionFee: data.admissionFee || 0,
      advanceAmount: data.advanceAmount || 0,
      bedHistory: [{
        bed: bed._id,
        bedNumber: bed.bedNumber,
        chargePerDay: bed.chargePerDay,
        fromDate: data.admissionDate || new Date(),
        toDate: null
      }]
    });

    // Mark bed as occupied
    await Bed.findByIdAndUpdate(data.bed, {
      isOccupied: true,
      currentPatient: admission._id
    });

    const populatedAdmission = await Admission.findById(admission._id)
      .populate('patient')
      .populate('consultant')
      .populate('bed');

    return NextResponse.json({
      message: 'Patient admitted successfully',
      admission: populatedAdmission
    }, { status: 201 });

  } catch (error) {
    console.error('Create admission error:', error);
    return NextResponse.json({ message: 'Error creating admission' }, { status: 500 });
  }
}