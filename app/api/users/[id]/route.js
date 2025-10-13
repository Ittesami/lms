import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest, hashPassword } from '@/lib/auth';
import { hasPermission, PERMISSIONS, ROLES } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// Update user
export async function PUT(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);

    if (!currentUser) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const userDoc = await User.findById(currentUser.id);

    if (!hasPermission(userDoc, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json(
        { message: 'Permission denied' },
        { status: 403 }
      );
    }

    const { id } = params;
    const updates = await request.json();

    // Don't allow updating password through this endpoint
    delete updates.password;

    // If changing role, update permissions
    if (updates.role) {
      if (updates.role === 'admin') {
        updates.permissions = Object.values(PERMISSIONS);
      } else if (!updates.permissions) {
        updates.permissions = ROLES[updates.role]?.permissions || [];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { message: 'Error updating user' },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);

    if (!currentUser) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const userDoc = await User.findById(currentUser.id);

    if (!hasPermission(userDoc, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json(
        { message: 'Permission denied' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Don't allow deleting yourself
    if (id === currentUser.id) {
      return NextResponse.json(
        { message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { message: 'Error deleting user' },
      { status: 500 }
    );
  }
}