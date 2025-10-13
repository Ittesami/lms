import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

export const dynamic = 'force-dynamic';

export async function PUT(request) {
    try {
        await connectDB();
        
        const { name, batchNumber, generic, brand, price, quantity, expiryDate } = await request.json();

        if (!name || !batchNumber) {
            return NextResponse.json({
                message: 'Name and batchNumber are required'
            }, { status: 400 });
        }

        const medicine = await Medicine.findOne({
            name,
            "batches.batchNumber": batchNumber
        });

        if (!medicine) {
            return NextResponse.json({
                message: 'Medicine not found'
            }, { status: 404 });
        }

        if (generic !== undefined) medicine.generic = generic;
        if (brand !== undefined) medicine.brand = brand;

        const batchIndex = medicine.batches.findIndex(batch => batch.batchNumber === batchNumber);
        
        if (batchIndex === -1) {
            return NextResponse.json({
                message: 'Batch not found'
            }, { status: 404 });
        }

        if (price !== undefined) medicine.batches[batchIndex].price = Number(price);
        if (quantity !== undefined) medicine.batches[batchIndex].quantity = Number(quantity);
        if (expiryDate !== undefined) medicine.batches[batchIndex].expiryDate = expiryDate;

        medicine.currentStock = medicine.batches.reduce((total, batch) => total + batch.quantity, 0);

        const updatedMedicine = await medicine.save();

        return NextResponse.json({
            message: 'Medicine updated successfully',
            medicine: updatedMedicine
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({
            message: 'Error updating medicine',
            error: error.message
        }, { status: 500 });
    }
}