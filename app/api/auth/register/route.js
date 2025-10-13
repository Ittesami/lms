import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { ROLES } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    
    const { username, email, password, fullName, role } = await request.json();

    // Validate input
    if (!username || !email || !password || !fullName) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Set default permissions based on role
    const userRole = role || 'viewer';
    const defaultPermissions = ROLES[userRole]?.permissions || [];

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: userRole,
      permissions: defaultPermissions
    });

    // Remove password from response
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions
    };

    return NextResponse.json({
      message: 'User created successfully',
      user: userResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { message: 'Error creating user', error: error.message },
      { status: 500 }
    );
  }
}