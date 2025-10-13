import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// GET all services
export async function GET(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const services = await Service.find({ isActive: true }).sort({ name: 1 });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json({ message: 'Error fetching services' }, { status: 500 });
  }
}

// POST create service
export async function POST(request) {
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

    const serviceData = await request.json();
    const newService = await Service.create(serviceData);

    return NextResponse.json({
      message: 'Service created successfully',
      service: newService
    }, { status: 201 });

  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ message: 'Error creating service' }, { status: 500 });
  }
}

