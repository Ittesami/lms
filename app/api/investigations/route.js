// app/api/investigations/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InvestigationBilling from '@/models/InvestigationBilling';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';
import Service from '@/models/Service';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { generateInvestigationId } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

// GET all investigations with optional filters
export async function GET(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.VIEW_INVESTIGATIONS)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, partial, paid
    const reportStatus = searchParams.get('reportStatus'); // pending, ready, delivered
    const hasDue = searchParams.get('hasDue'); // true/false

    let query = {};
    
    if (status) {
      query.paymentStatus = status.charAt(0).toUpperCase() + status.slice(1);
    }
    
    if (reportStatus) {
      query.reportStatus = reportStatus.charAt(0).toUpperCase() + reportStatus.slice(1);
    }
    
    if (hasDue === 'true') {
      query.due = { $gt: 0 };
    }

    const investigations = await InvestigationBilling.find(query)
      .populate('patient')
      .populate('consultant')
      .populate('services.service')
      .sort({ date: -1 })
      .limit(100);

    return NextResponse.json({ investigations });
  } catch (error) {
    console.error('Get investigations error:', error);
    return NextResponse.json({ 
      message: 'Error fetching investigations',
      error: error.message 
    }, { status: 500 });
  }
}

// POST create investigation
export async function POST(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.CREATE_INVESTIGATIONS)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.patient) {
      return NextResponse.json({ message: 'Patient is required' }, { status: 400 });
    }
    if (!data.consultant) {
      return NextResponse.json({ message: 'Consultant is required' }, { status: 400 });
    }
    if (!data.deliveryDate) {
      return NextResponse.json({ message: 'Delivery date is required' }, { status: 400 });
    }
    if (!data.services || data.services.length === 0) {
      return NextResponse.json({ message: 'At least one service is required' }, { status: 400 });
    }

    // Verify patient exists
    const patient = await Patient.findById(data.patient);
    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    // Verify consultant exists
    const consultant = await Doctor.findById(data.consultant);
    if (!consultant) {
      return NextResponse.json({ message: 'Consultant not found' }, { status: 404 });
    }

    // Get next bill ID
    const billId = await generateInvestigationId();

    // Process services and calculate totals
    const processedServices = data.services.map(service => ({
      service: service.service,
      serviceName: service.serviceName,
      unitPrice: Number(service.unitPrice) || 0,
      quantity: Number(service.quantity) || 1
    }));

    const totalAmount = processedServices.reduce((sum, service) => 
      sum + (service.unitPrice * service.quantity), 0
    );

    const discount = Number(data.discount) || 0;
    const paidAmount = Number(data.paid) || 0;
    const grandTotal = totalAmount - discount;
    const due = grandTotal - paidAmount;

    // Validate calculations
    if (discount > totalAmount) {
      return NextResponse.json({ 
        message: 'Discount cannot be greater than total amount' 
      }, { status: 400 });
    }

    // Determine payment status
    let paymentStatus = 'Pending';
    if (paidAmount >= grandTotal) {
      paymentStatus = 'Paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'Partial';
    }

    // Create initial payment record if amount paid
    const payments = [];
    if (paidAmount > 0) {
      payments.push({
        amount: paidAmount,
        paymentMethod: data.paymentMethod || 'Cash',
        receivedBy: currentUser.id,
        date: new Date(),
        remarks: 'Initial payment'
      });
    }

    // Create investigation
    const investigation = await InvestigationBilling.create({
      billId,
      date: data.date || new Date(),
      patient: data.patient,
      consultant: data.consultant,
      deliveryDate: new Date(data.deliveryDate),
      services: processedServices,
      totalAmount,
      discount,
      paid: paidAmount,
      due,
      payments,
      paymentStatus,
      reportStatus: 'Pending',
      remarks: data.remarks || ''
    });

    // Populate and return
    const populatedInvestigation = await InvestigationBilling.findById(investigation._id)
      .populate('patient')
      .populate('consultant')
      .populate('services.service');

    return NextResponse.json({
      message: 'Investigation created successfully',
      investigation: populatedInvestigation
    }, { status: 201 });

  } catch (error) {
    console.error('Create investigation error:', error);
    return NextResponse.json({ 
      message: 'Error creating investigation',
      error: error.message 
    }, { status: 500 });
  }
}