// app/api/investigations/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InvestigationBilling from '@/models/InvestigationBilling';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// GET single investigation
export async function GET(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const investigation = await InvestigationBilling.findById(params.id)
      .populate('patient')
      .populate('consultant')
      .populate('services.service')
      .populate('reportDeliveredBy', 'name');

    if (!investigation) {
      return NextResponse.json({ message: 'Investigation not found' }, { status: 404 });
    }

    return NextResponse.json({ investigation });
  } catch (error) {
    console.error('Get investigation error:', error);
    return NextResponse.json({ 
      message: 'Error fetching investigation',
      error: error.message 
    }, { status: 500 });
  }
}

// PUT update investigation (for report status, remarks, etc.)
export async function PUT(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.MANAGE_INVESTIGATIONS)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const data = await request.json();
    const investigation = await InvestigationBilling.findById(params.id);

    if (!investigation) {
      return NextResponse.json({ message: 'Investigation not found' }, { status: 404 });
    }

    // Update allowed fields
    if (data.reportStatus) {
      investigation.reportStatus = data.reportStatus;
      
      if (data.reportStatus === 'Delivered') {
        investigation.reportDeliveredAt = new Date();
        investigation.reportDeliveredBy = currentUser.id;
      }
    }

    if (data.remarks !== undefined) {
      investigation.remarks = data.remarks;
    }

    await investigation.save();

    const updatedInvestigation = await InvestigationBilling.findById(params.id)
      .populate('patient')
      .populate('consultant')
      .populate('services.service')
      .populate('reportDeliveredBy', 'name');

    return NextResponse.json({
      message: 'Investigation updated successfully',
      investigation: updatedInvestigation
    });

  } catch (error) {
    console.error('Update investigation error:', error);
    return NextResponse.json({ 
      message: 'Error updating investigation',
      error: error.message 
    }, { status: 500 });
  }
}