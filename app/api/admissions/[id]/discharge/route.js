import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admission from '@/models/Admission';
import Discharge from '@/models/Discharge';
import Bed from '@/models/Bed';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { calculateDays } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.DISCHARGE_PATIENTS)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const { id } = params;
    const data = await request.json();

    const admission = await Admission.findById(id);
    if (!admission) {
      return NextResponse.json({ message: 'Admission not found' }, { status: 404 });
    }

    if (admission.status !== 'Admitted') {
      return NextResponse.json({ message: 'Patient is already discharged' }, { status: 400 });
    }

    const dischargeDate = data.dischargeDate || new Date();
    const totalDays = calculateDays(admission.admissionDate, dischargeDate);

    // Calculate bed charges considering bed changes
    let bedCharges = 0;
    for (const bedHistory of admission.bedHistory) {
      const endDate = bedHistory.toDate || dischargeDate;
      const days = calculateDays(bedHistory.fromDate, endDate);
      bedCharges += days * bedHistory.chargePerDay;
    }

    // Calculate medicine charges
    const medicineCharges = admission.medicineInvoices.reduce(
      (sum, invoice) => sum + invoice.totalAmount, 0
    );

    // Calculate service charges
    const serviceCharges = admission.serviceInvoices.reduce(
      (sum, invoice) => sum + invoice.totalAmount, 0
    );

    const admissionFee = admission.admissionFee;
    const subtotal = bedCharges + medicineCharges + serviceCharges + admissionFee;
    const discount = data.discount || 0;
    const grandTotal = subtotal - discount;
    const advancePaid = admission.advanceAmount;
    const totalPaid = advancePaid + (data.paid || 0);
    const due = grandTotal - totalPaid;

    // Create discharge record
    const discharge = await Discharge.create({
      admission: admission._id,
      dischargeDate,
      totalDays,
      bedCharges,
      medicineCharges,
      serviceCharges,
      admissionFee,
      subtotal,
      discount,
      grandTotal,
      advancePaid,
      totalPaid,
      due,
      remarks: data.remarks || ''
    });

    // Update admission
    admission.status = 'Discharged';
    admission.dischargeDate = dischargeDate;
    admission.totalBill = grandTotal;
    await admission.save();

    // Free the bed
    await Bed.findByIdAndUpdate(admission.bed, {
      isOccupied: false,
      currentPatient: null
    });

    // Close bed history
    const lastBedHistory = admission.bedHistory[admission.bedHistory.length - 1];
    lastBedHistory.toDate = dischargeDate;
    await admission.save();

    const populatedDischarge = await Discharge.findById(discharge._id)
      .populate({
        path: 'admission',
        populate: [
          { path: 'patient' },
          { path: 'consultant' },
          { path: 'bed' }
        ]
      });

    return NextResponse.json({
      message: 'Patient discharged successfully',
      discharge: populatedDischarge
    });

  } catch (error) {
    console.error('Discharge error:', error);
    return NextResponse.json({ message: 'Error discharging patient' }, { status: 500 });
  }
}