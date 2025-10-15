// app/api/medicine/returns/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MedicineReturn from '@/models/MedicineReturn';
import OutdoorSale from '@/models/OutdoorSale';
import Admission from '@/models/Admission';
import Medicine from '@/models/Medicine';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getNextId } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

// GET all returns
export async function GET(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const returns = await MedicineReturn.find()
      .populate('processedBy', 'fullName')
      .populate('outdoorSale')
      .populate('admission')
      .populate('medicines.medicine', 'name')
      .sort({ returnDate: -1 })
      .limit(100);

    return NextResponse.json({ returns });
  } catch (error) {
    console.error('Get returns error:', error);
    return NextResponse.json({ 
      message: 'Error fetching returns',
      error: error.message 
    }, { status: 500 });
  }
}

// POST create return
export async function POST(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(currentUser.id);

    if (!hasPermission(user, PERMISSIONS.MANAGE_INVENTORY)) {
      return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.returnType) {
      return NextResponse.json({ message: 'Return type is required' }, { status: 400 });
    }

    if (!data.medicines || data.medicines.length === 0) {
      return NextResponse.json({ message: 'At least one medicine is required' }, { status: 400 });
    }

    let sourceDocument = null;
    let sourceMedicines = [];

    // Validate based on return type
    if (data.returnType === 'Outdoor') {
      if (!data.billId) {
        return NextResponse.json({ message: 'Bill ID is required for outdoor returns' }, { status: 400 });
      }

      sourceDocument = await OutdoorSale.findOne({ billId: parseInt(data.billId) });
      if (!sourceDocument) {
        return NextResponse.json({ message: `Sale not found with Bill ID: ${data.billId}` }, { status: 404 });
      }
      sourceMedicines = sourceDocument.medicines;

    } else if (data.returnType === 'Indoor') {
      if (!data.admissionId) {
        return NextResponse.json({ message: 'Admission ID is required for indoor returns' }, { status: 400 });
      }

      sourceDocument = await Admission.findOne({ admissionId: parseInt(data.admissionId) });
      if (!sourceDocument) {
        return NextResponse.json({ message: `Admission not found with ID: ${data.admissionId}` }, { status: 404 });
      }

      // Collect all medicines from all invoices
      sourceMedicines = sourceDocument.medicineInvoices.flatMap(inv => 
        inv.medicines.map(m => ({
          medicine: m.medicineId,
          medicineId: m.medicineId,
          name: m.name,
          batchNumber: m.batchNumber,
          quantity: m.quantity,
          price: m.price
        }))
      );
    }

    // Process returns and validate
    const processedReturns = [];
    let totalReturnAmount = 0;

    for (const returnItem of data.medicines) {
      // Find the medicine in the source
      const soldMedicine = sourceMedicines.find(m => {
        const medId = m.medicine?._id?.toString() || m.medicine?.toString() || m.medicineId?.toString();
        return medId === returnItem.medicineId;
      });

      if (!soldMedicine) {
        return NextResponse.json({ 
          message: `Medicine not found in original ${data.returnType === 'Outdoor' ? 'sale' : 'admission'}: ${returnItem.medicineName}` 
        }, { status: 400 });
      }

      // Validate quantity
      if (returnItem.quantity > soldMedicine.quantity) {
        return NextResponse.json({ 
          message: `Cannot return more than sold quantity for ${returnItem.medicineName}. Sold: ${soldMedicine.quantity}, Trying to return: ${returnItem.quantity}` 
        }, { status: 400 });
      }

      // Get medicine and add stock back
      const medicine = await Medicine.findById(returnItem.medicineId);
      if (!medicine) {
        return NextResponse.json({ 
          message: `Medicine not found in inventory: ${returnItem.medicineName}` 
        }, { status: 404 });
      }

      // Determine return price
      const returnPrice = soldMedicine.unitPrice || soldMedicine.price || 0;
      
      // Add stock back to the batch (inline logic instead of method)
      const batchNumber = soldMedicine.batchNumber;
      const batch = medicine.batches.find(b => b.batchNumber === batchNumber);
      
      if (batch) {
        batch.quantity += returnItem.quantity;
      } else {
        // If batch not found, add to a return batch
        medicine.batches.push({
          batchNumber: batchNumber + '-RETURN',
          quantity: returnItem.quantity,
          price: returnPrice,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          supplier: 'Customer Return'
        });
      }
      
      // Update total stock
      medicine.currentStock = medicine.batches.reduce((sum, b) => sum + b.quantity, 0);
      await medicine.save();

      const itemReturnAmount = returnPrice * returnItem.quantity;
      totalReturnAmount += itemReturnAmount;

      processedReturns.push({
        medicine: medicine._id,
        medicineName: medicine.name,
        batchNumber: batchNumber,
        quantity: returnItem.quantity,
        returnPrice: returnPrice,
        reason: returnItem.reason || ''
      });
    }

    // Get next return ID
    const returnId = await getNextId('medicineReturn');

    // Create return record
    const medicineReturn = await MedicineReturn.create({
      returnId,
      returnDate: new Date(),
      returnType: data.returnType,
      outdoorSale: data.returnType === 'Outdoor' ? sourceDocument._id : undefined,
      admission: data.returnType === 'Indoor' ? sourceDocument._id : undefined,
      medicines: processedReturns,
      totalReturnAmount,
      refundMethod: data.refundMethod || 'Cash',
      processedBy: currentUser.id,
      remarks: data.remarks || '',
      status: 'Approved'
    });

    // Update source document if needed (mark as partially returned, etc.)
    // This is optional based on your business logic

    const populatedReturn = await MedicineReturn.findById(medicineReturn._id)
      .populate('processedBy', 'fullName')
      .populate('medicines.medicine', 'name');

    return NextResponse.json({
      message: 'Medicine return processed successfully',
      return: populatedReturn
    }, { status: 201 });

  } catch (error) {
    console.error('Create return error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      data: JSON.stringify(error)
    });
    return NextResponse.json({ 
      message: 'Error processing return',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}