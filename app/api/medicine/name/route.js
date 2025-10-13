import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();
        
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json(
                { message: 'Name is required' },
                { status: 400 }
            );
        }

        const medicines = await Medicine.find({
            $or: [
                { name: { $regex: `^${name}$`, $options: 'i' } },
                { name: { $regex: `^${name} `, $options: 'i' } }
            ]
        });

        if (medicines.length === 0) {
            return NextResponse.json({
                message: 'No medicines found',
                medicines: []
            }, { status: 404 });
        }

        medicines.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({
            message: 'Medicines fetched successfully',
            medicines
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({
            message: 'Error fetching medicines',
            error: error.message
        }, { status: 500 });
    }
}