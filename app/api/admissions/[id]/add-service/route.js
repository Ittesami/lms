import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admission from '@/models/Admission';
import Service from '@/models/Service';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
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

    const { id } = params;
    const { services } = await request.json();

    const admission = await Admission.findById(id);
    if (!admission) {
      return NextResponse.json({ message: 'Admission not found' }, { status: 404 });
    }

    if (admission.status !== 'Admitted') {
      return NextResponse.json({ message: 'Patient is not admitted' }, { status: 400 });
    }

    // Calculate total
    let totalAmount = 0;
    const serviceDetails = [];

    for (const item of services) {
      const service = await Service.findById(item.serviceId);
      if (!service) continue;

      const itemTotal = service.unitPrice * (item.quantity || 1);
      totalAmount += itemTotal;

      serviceDetails.push({
        service: service._id,
        serviceName: service.name,
        unitPrice: service.unitPrice,
        quantity: item.quantity || 1
      });
    }

    // Add to admission
    admission.serviceInvoices.push({
      services: serviceDetails,
      totalAmount,
      date: new Date()
    });

    admission.totalBill += totalAmount;
    await admission.save();

    return NextResponse.json({
      message: 'Service added successfully',
      admission
    });

  } catch (error) {
    console.error('Add service error:', error);
    return NextResponse.json({ message: 'Error adding service' }, { status: 500 });
  }
}