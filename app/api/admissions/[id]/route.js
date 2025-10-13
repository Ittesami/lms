// app/api/admissions/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admission from '@/models/Admission';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// GET single admission
export async function GET(request, { params }) {
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

    // Validate ID format
    if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ 
        message: 'Invalid admission ID format',
        providedId: params.id 
      }, { status: 400 });
    }

    const admission = await Admission.findById(params.id)
      .populate('patient')
      .populate('consultant')
      .populate('bed')
      .populate('bedHistory.bed');

    if (!admission) {
      return NextResponse.json({ message: 'Admission not found' }, { status: 404 });
    }

    return NextResponse.json({ admission });

  } catch (error) {
    console.error('Get admission error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      message: 'Error fetching admission',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT update admission
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

    // Validate ID format
    if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ 
        message: 'Invalid admission ID format' 
      }, { status: 400 });
    }

    const data = await request.json();
    const admission = await Admission.findById(params.id);

    if (!admission) {
      return NextResponse.json({ message: 'Admission not found' }, { status: 404 });
    }

    // Update allowed fields
    if (data.contactPersonName) admission.contactPersonName = data.contactPersonName;
    if (data.contactPersonPhone) admission.contactPersonPhone = data.contactPersonPhone;
    if (data.referredBy !== undefined) admission.referredBy = data.referredBy;

    await admission.save();

    const updatedAdmission = await Admission.findById(params.id)
      .populate('patient')
      .populate('consultant')
      .populate('bed');

    return NextResponse.json({
      message: 'Admission updated successfully',
      admission: updatedAdmission
    });

  } catch (error) {
    console.error('Update admission error:', error);
    return NextResponse.json({ 
      message: 'Error updating admission',
      error: error.message 
    }, { status: 500 });
  }
}