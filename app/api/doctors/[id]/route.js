import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// PUT update doctor
export async function PUT(request, { params }) {
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

    const { id } = params;
    const updates = await request.json();

    const updatedDoctor = await Doctor.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedDoctor) {
      return NextResponse.json({ message: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Doctor updated successfully',
      doctor: updatedDoctor
    });

  } catch (error) {
    console.error('Update doctor error:', error);
    return NextResponse.json({ message: 'Error updating doctor' }, { status: 500 });
  }
}

// DELETE doctor
export async function DELETE(request, { params }) {
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

    const { id } = params;

    // Soft delete - set isActive to false
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!updatedDoctor) {
      return NextResponse.json({ message: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Doctor deleted successfully' });

  } catch (error) {
    console.error('Delete doctor error:', error);
    return NextResponse.json({ message: 'Error deleting doctor' }, { status: 500 });
  }
}
