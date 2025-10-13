import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        // Check authentication
        const currentUser = await getUserFromRequest(request);
        if (!currentUser) {
            return NextResponse.json(
                { message: 'Not authenticated' },
                { status: 401 }
            );
        }

        await connectDB();
        const user = await User.findById(currentUser.id);

        // Check permission
        if (!hasPermission(user, PERMISSIONS.ADD_MEDICINES)) {
            return NextResponse.json(
                { message: 'Permission denied' },
                { status: 403 }
            );
        }

        // Rest of your existing create medicine code...
        let { name, generic, brand, batchNumber, expiryDate, price, quantity } = await request.json();

        price = Number(price);
        quantity = Number(quantity);
        
        if (isNaN(price) || isNaN(quantity)) {
            return NextResponse.json(
                { message: "Price and quantity must be valid numbers." },
                { status: 400 }
            );
        }

        const exactMatch = await Medicine.findOne({
            name,
            generic,
            brand,
            "batches.batchNumber": batchNumber,
            "batches.expiryDate": expiryDate,
            "batches.price": price,
        });

        if (exactMatch) {
            const batchIndex = exactMatch.batches.findIndex(batch => 
                batch.batchNumber === batchNumber && 
                batch.expiryDate.getTime() === new Date(expiryDate).getTime() && 
                batch.price === price
            );
            
            exactMatch.batches[batchIndex].quantity += quantity;
            exactMatch.currentStock = exactMatch.batches.reduce((total, batch) => total + batch.quantity, 0);
            const updatedMedicine = await exactMatch.save();

            return NextResponse.json({
                message: "Exact medicine batch found. Quantity updated.",
                medicine: updatedMedicine,
            });
        }

        const partialMatch = await Medicine.findOne({ name, generic, brand });

        if (partialMatch) {
            partialMatch.batches.push({
                batchNumber,
                expiryDate,
                price,
                quantity
            });
            partialMatch.currentStock = partialMatch.batches.reduce((total, batch) => total + batch.quantity, 0);
            const updatedMedicine = await partialMatch.save();

            return NextResponse.json({
                message: "New batch added successfully.",
                medicine: updatedMedicine,
            });
        }

        const newMedicine = new Medicine({
            name,
            generic,
            brand,
            currentStock: quantity,
            batches: [{
                batchNumber,
                expiryDate,
                price,
                quantity
            }]
        });

        const savedMedicine = await newMedicine.save();

        return NextResponse.json({
            message: "New medicine created successfully.",
            medicine: savedMedicine,
        }, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({
            message: "Error creating medicine",
            error: error.message,
        }, { status: 500 }
        );
    }
}