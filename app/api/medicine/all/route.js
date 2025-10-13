import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const medicines = await Medicine.find();
        
        return NextResponse.json({
            message: "Medicines fetched successfully",
            medicines: medicines,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({
            message: "Error fetching medicines",
            error: error.message,
        }, { status: 500 });
    }
}