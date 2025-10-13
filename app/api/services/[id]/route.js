import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// PUT update service
export async function PUT(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.MANAGE_SERVICES)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const { id } = params;
    const updates = await request.json();

    const updatedService = await Service.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedService) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Service updated successfully',
      service: updatedService
    });

  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json({ message: 'Error updating service' }, { status: 500 });
  }
}

// DELETE service
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.MANAGE_SERVICES)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const { id } = params;

    // Soft delete
    const updatedService = await Service.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!updatedService) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Service deleted successfully' });

  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json({ message: 'Error deleting service' }, { status: 500 });
  }
}