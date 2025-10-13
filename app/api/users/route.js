import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest, hashPassword } from '@/lib/auth';
import { hasPermission, PERMISSIONS, ROLES } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// Get all users
export async function GET(request) {
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

    const users = await User.find().select('-password');

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { message: 'Error fetching users' },
      { status: 500 }
    );
  }
}

// Create user (admin only)
export async function POST(request) {
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

    const { username, email, password, fullName, role, permissions } = await request.json();

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // If role is admin, give all permissions
    const userPermissions = role === 'admin' 
      ? Object.values(PERMISSIONS)
      : (permissions || ROLES[role]?.permissions || []);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: role || 'viewer',
      permissions: userPermissions
    });

    const userResponse = await User.findById(newUser._id).select('-password');

    return NextResponse.json({
      message: 'User created successfully',
      user: userResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { message: 'Error creating user' },
      { status: 500 }
    );
  }
}