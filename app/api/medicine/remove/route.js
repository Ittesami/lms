import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

export const dynamic = 'force-dynamic';

export async function DELETE(request) {
    try {
        await connectDB();
        
        const { name, batchNumber } = await request.json();

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

        const batchToDelete = medicine.batches.find(batch => batch.batchNumber === batchNumber);

        if (medicine.batches.length === 1) {
            const deletedMedicine = await Medicine.findByIdAndDelete(medicine._id);
            return NextResponse.json({
                message: 'Medicine deleted successfully (last batch removed)',
                medicine: deletedMedicine
            });
        }

        medicine.batches = medicine.batches.filter(batch => batch.batchNumber !== batchNumber);
        medicine.currentStock = medicine.batches.reduce((total, batch) => total + batch.quantity, 0);
        
        const updatedMedicine = await medicine.save();

        return NextResponse.json({
            message: 'Batch deleted successfully',
            medicine: updatedMedicine,
            deletedBatch: batchToDelete
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({
            message: 'Error deleting medicine',
            error: error.message
        }, { status: 500 });
    }
}   