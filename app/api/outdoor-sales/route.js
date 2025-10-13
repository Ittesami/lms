// app/api/outdoor-sales/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OutdoorSale from '@/models/OutdoorSale';
import Medicine from '@/models/Medicine';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { generateOutdoorSaleId } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

// GET all outdoor sales
export async function GET(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.OUTDOOR_SALES)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await OutdoorSale.find(query)
      .populate('soldBy', 'fullName email')
      .populate('medicines.medicine', 'name')
      .sort({ date: -1 })
      .limit(100);

    return NextResponse.json({ sales });
  } catch (error) {
    console.error('Get outdoor sales error:', error);
    return NextResponse.json({ 
      message: 'Error fetching sales',
      error: error.message 
    }, { status: 500 });
  }
}

// POST create outdoor sale
export async function POST(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.OUTDOOR_SALES)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.medicines || data.medicines.length === 0) {
      return NextResponse.json({ message: 'At least one medicine is required' }, { status: 400 });
    }

    // Process medicines and validate stock
    const processedMedicines = [];
    let subtotal = 0;

    for (const item of data.medicines) {
      const medicine = await Medicine.findById(item.medicineId);
      
      if (!medicine) {
        return NextResponse.json({ 
          message: `Medicine not found: ${item.medicineName}` 
        }, { status: 404 });
      }

      // Find the batch
      const batch = medicine.batches.find(b => b.batchNumber === item.batchNumber);
      
      if (!batch) {
        return NextResponse.json({ 
          message: `Batch not found for ${medicine.name}` 
        }, { status: 404 });
      }

      if (batch.quantity < item.quantity) {
        return NextResponse.json({ 
          message: `Insufficient stock for ${medicine.name}. Available: ${batch.quantity}` 
        }, { status: 400 });
      }

      const totalPrice = batch.price * item.quantity;
      subtotal += totalPrice;

      processedMedicines.push({
        medicine: medicine._id,
        medicineName: medicine.name,
        batchNumber: batch.batchNumber,
        quantity: item.quantity,
        unitPrice: batch.price,
        totalPrice
      });

      // Deduct from stock
      batch.quantity -= item.quantity;
      medicine.currentStock = medicine.batches.reduce((sum, b) => sum + b.quantity, 0);
      await medicine.save();
    }

    // Calculate totals
    const discount = Number(data.discount) || 0;
    const grandTotal = subtotal - discount;
    const paid = Number(data.paid) || 0;
    const due = grandTotal - paid;

    // Validate calculations
    if (discount > subtotal) {
      return NextResponse.json({ 
        message: 'Discount cannot be greater than subtotal' 
      }, { status: 400 });
    }

    // Get next bill ID
    const billId = await generateOutdoorSaleId();

    // Create sale
    const sale = await OutdoorSale.create({
      billId,
      date: data.date || new Date(),
      customerName: data.customerName || '',
      customerPhone: data.customerPhone || '',
      medicines: processedMedicines,
      subtotal,
      discount,
      grandTotal,
      paid,
      due,
      paymentMethod: data.paymentMethod || 'Cash',
      soldBy: currentUser.id,
      remarks: data.remarks || ''
    });

    // Populate and return
    const populatedSale = await OutdoorSale.findById(sale._id)
      .populate('soldBy', 'fullName email')
      .populate('medicines.medicine', 'name');

    return NextResponse.json({
      message: 'Sale completed successfully',
      sale: populatedSale
    }, { status: 201 });

  } catch (error) {
    console.error('Create outdoor sale error:', error);
    return NextResponse.json({ 
      message: 'Error creating sale',
      error: error.message 
    }, { status: 500 });
  }
}