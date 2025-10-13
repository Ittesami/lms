import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admission from '@/models/Admission';
import Medicine from '@/models/Medicine';
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

    if (!hasPermission(user, PERMISSIONS.INDOOR_SALES)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const { id } = params;
    const { medicines } = await request.json();

    const admission = await Admission.findById(id);
    if (!admission) {
      return NextResponse.json({ message: 'Admission not found' }, { status: 404 });
    }

    if (admission.status !== 'Admitted') {
      return NextResponse.json({ message: 'Patient is not admitted' }, { status: 400 });
    }

    // Calculate total
    let totalAmount = 0;
    const medicineDetails = [];

    for (const item of medicines) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) continue;

      // Find the batch
      const batch = medicine.batches.find(b => b.batchNumber === item.batchNumber);
      if (!batch || batch.quantity < item.quantity) {
        return NextResponse.json({ 
          message: `Insufficient quantity for ${medicine.name}` 
        }, { status: 400 });
      }

      // Deduct from stock
      batch.quantity -= item.quantity;
      medicine.currentStock = medicine.batches.reduce((sum, b) => sum + b.quantity, 0);
      await medicine.save();

      const itemTotal = batch.price * item.quantity;
      totalAmount += itemTotal;

      medicineDetails.push({
        medicineId: medicine._id,
        name: medicine.name,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        price: batch.price
      });
    }

    // Add to admission
    admission.medicineInvoices.push({
      medicines: medicineDetails,
      totalAmount,
      date: new Date()
    });

    admission.totalBill += totalAmount;
    await admission.save();

    return NextResponse.json({
      message: 'Medicine added successfully',
      admission
    });

  } catch (error) {
    console.error('Add medicine error:', error);
    return NextResponse.json({ message: 'Error adding medicine' }, { status: 500 });
  }
}