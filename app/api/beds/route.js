import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bed from '@/models/Bed';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// GET all beds
export async function GET(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const beds = await Bed.find().sort({ bedNumber: 1 }).populate('currentPatient');

    return NextResponse.json({ beds });
  } catch (error) {
    console.error('Get beds error:', error);
    return NextResponse.json({ message: 'Error fetching beds' }, { status: 500 });
  }
}

// POST create bed
export async function POST(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.MANAGE_BEDS)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const bedData = await request.json();

    // Check if bed number already exists
    const existingBed = await Bed.findOne({ bedNumber: bedData.bedNumber });
    if (existingBed) {
      return NextResponse.json({ message: 'Bed number already exists' }, { status: 400 });
    }

    const newBed = await Bed.create(bedData);

    return NextResponse.json({
      message: 'Bed created successfully',
      bed: newBed
    }, { status: 201 });

  } catch (error) {
    console.error('Create bed error:', error);
    return NextResponse.json({ message: 'Error creating bed' }, { status: 500 });
  }
}