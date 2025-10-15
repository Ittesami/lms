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
    
    console.log('Received sale data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.medicines || data.medicines.length === 0) {
      return NextResponse.json({ message: 'At least one medicine is required' }, { status: 400 });
    }

    // Process medicines and validate stock
    const processedMedicines = [];
    let subtotal = 0;
    const stockUpdates = []; // Store medicines to update after validation

    // First pass: Validate all medicines and calculate totals
    for (const item of data.medicines) {
      console.log('Processing medicine item:', item);
      
      // Find medicine - ensure we get a Mongoose document
      const medicine = await Medicine.findById(item.medicineId).exec();
      
      if (!medicine) {
        return NextResponse.json({ 
          message: `Medicine not found: ${item.medicineName || item.medicineId}` 
        }, { status: 404 });
      }

      console.log('Found medicine:', {
        id: medicine._id,
        name: medicine.name,
        currentStock: medicine.currentStock,
        batchCount: medicine.batches?.length
      });

      // Verify the medicine has the deductStock method
      if (typeof medicine.deductStock !== 'function') {
        console.error('Medicine object is not a proper Mongoose document');
        console.error('Medicine proto:', Object.getPrototypeOf(medicine));
        return NextResponse.json({ 
          message: 'Internal error: Invalid medicine document' 
        }, { status: 500 });
      }

      // Check if enough stock available
      if (medicine.currentStock < item.quantity) {
        return NextResponse.json({ 
          message: `Insufficient stock for ${medicine.name}. Available: ${medicine.currentStock}, Required: ${item.quantity}` 
        }, { status: 400 });
      }

      // Store for second pass
      stockUpdates.push({ medicine, quantity: item.quantity });
    }

    // Second pass: Deduct stock and create sale items
    for (const { medicine, quantity } of stockUpdates) {
      try {
        console.log(`Deducting ${quantity} units from ${medicine.name}`);
        
        // Deduct stock using FIFO method
        const deductResult = medicine.deductStock(quantity);
        
        console.log('Deduct result:', deductResult);
        
        if (!deductResult.success) {
          return NextResponse.json({ 
            message: `Could not deduct full quantity for ${medicine.name}. Short by ${deductResult.remaining} units.` 
          }, { status: 400 });
        }

        // Save the medicine with updated stock
        await medicine.save();
        console.log(`Stock updated for ${medicine.name}, new stock: ${medicine.currentStock}`);

        // Use the batches that were actually deducted for recording
        for (const deductedBatch of deductResult.deductedBatches) {
          const totalPrice = deductedBatch.price * deductedBatch.quantity;
          subtotal += totalPrice;

          processedMedicines.push({
            medicine: medicine._id,
            medicineName: medicine.name,
            batchNumber: deductedBatch.batchNumber,
            quantity: deductedBatch.quantity,
            unitPrice: deductedBatch.price,
            totalPrice
          });
        }
      } catch (deductError) {
        console.error('Error deducting stock:', deductError);
        throw new Error(`Failed to deduct stock for ${medicine.name}: ${deductError.message}`);
      }
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

    if (paid < 0 || discount < 0) {
      return NextResponse.json({ 
        message: 'Paid and discount amounts must be non-negative' 
      }, { status: 400 });
    }

    // Get next bill ID
    const billId = await generateOutdoorSaleId();
    console.log('Generated bill ID:', billId);

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

    console.log('Sale created:', sale._id);

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
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      message: 'Error creating sale',
      error: error.message 
    }, { status: 500 });
  }
}