import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        
        const medicines = await Medicine.find(
            { currentStock: { $gt: 0 } },
            { name: 1, generic: 1, currentStock: 1, brand: 1, batches: 1, _id: 1 }
        );
        
        return NextResponse.json({ 
            medicines,
            count: medicines.length 
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}