import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// GET all doctors
export async function GET(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const doctors = await Doctor.find({ isActive: true }).sort({ name: 1 });

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    return NextResponse.json({ message: 'Error fetching doctors' }, { status: 500 });
  }
}

// POST create doctor
export async function POST(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.MANAGE_DOCTORS)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const doctorData = await request.json();
    const newDoctor = await Doctor.create(doctorData);

    return NextResponse.json({
      message: 'Doctor created successfully',
      doctor: newDoctor
    }, { status: 201 });

  } catch (error) {
    console.error('Create doctor error:', error);
    return NextResponse.json({ message: 'Error creating doctor' }, { status: 500 });
  }
}