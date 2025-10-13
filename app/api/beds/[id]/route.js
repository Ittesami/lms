import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bed from '@/models/Bed';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// PUT update bed
export async function PUT(request, { params }) {
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

    const { id } = params;
    const updates = await request.json();

    const updatedBed = await Bed.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedBed) {
      return NextResponse.json({ message: 'Bed not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Bed updated successfully',
      bed: updatedBed
    });

  } catch (error) {
    console.error('Update bed error:', error);
    return NextResponse.json({ message: 'Error updating bed' }, { status: 500 });
  }
}

// DELETE bed
export async function DELETE(request, { params }) {
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

    const { id } = params;

    const bed = await Bed.findById(id);
    if (bed.isOccupied) {
      return NextResponse.json({ message: 'Cannot delete occupied bed' }, { status: 400 });
    }

    await Bed.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Bed deleted successfully' });

  } catch (error) {
    console.error('Delete bed error:', error);
    return NextResponse.json({ message: 'Error deleting bed' }, { status: 500 });
  }
}