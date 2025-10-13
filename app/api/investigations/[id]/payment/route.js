// app/api/investigations/[id]/payment/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InvestigationBilling from '@/models/InvestigationBilling';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// POST add payment
export async function POST(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.COLLECT_PAYMENTS)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const data = await request.json();
    
    // Validate investigation ID format
    if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ 
        message: 'Invalid investigation ID format',
        providedId: params.id 
      }, { status: 400 });
    }

    const investigation = await InvestigationBilling.findById(params.id);

    if (!investigation) {
      return NextResponse.json({ message: 'Investigation not found' }, { status: 404 });
    }

    // Validate payment amount
    const amount = Number(data.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ message: 'Invalid payment amount' }, { status: 400 });
    }

    if (amount > investigation.due) {
      return NextResponse.json({ 
        message: `Payment amount cannot exceed due amount of ৳${investigation.due}` 
      }, { status: 400 });
    }

    // Add payment
    investigation.payments.push({
      amount,
      paymentMethod: data.paymentMethod || 'Cash',
      receivedBy: currentUser.id,
      date: new Date(),
      remarks: data.remarks || ''
    });

    // Recalculate paid and due
    investigation.paid = investigation.payments.reduce((sum, p) => sum + p.amount, 0);
    const grandTotal = investigation.totalAmount - investigation.discount;
    investigation.due = grandTotal - investigation.paid;

    // Update payment status
    if (investigation.due <= 0) {
      investigation.paymentStatus = 'Paid';
    } else if (investigation.paid > 0) {
      investigation.paymentStatus = 'Partial';
    } else {
      investigation.paymentStatus = 'Pending';
    }

    await investigation.save();

    // Populate and return
    const updatedInvestigation = await InvestigationBilling.findById(params.id)
      .populate('patient')
      .populate('consultant')
      .populate('services.service');

    return NextResponse.json({
      message: 'Payment collected successfully',
      investigation: updatedInvestigation
    });

  } catch (error) {
    console.error('Collect payment error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      message: 'Error collecting payment',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET payment history
export async function GET(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    // Validate investigation ID format
    if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ 
        message: 'Invalid investigation ID format',
        providedId: params.id 
      }, { status: 400 });
    }

    const investigation = await InvestigationBilling.findById(params.id)
      .select('billId payments paid due paymentStatus');

    if (!investigation) {
      return NextResponse.json({ message: 'Investigation not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      billId: investigation.billId,
      payments: investigation.payments,
      paid: investigation.paid,
      due: investigation.due,
      paymentStatus: investigation.paymentStatus
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      message: 'Error fetching payment history',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}