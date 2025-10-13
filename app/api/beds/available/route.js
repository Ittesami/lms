import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bed from '@/models/Bed';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const availableBeds = await Bed.find({ isOccupied: false }).sort({ bedNumber: 1 });

    return NextResponse.json({ beds: availableBeds });
  } catch (error) {
    console.error('Get available beds error:', error);
    return NextResponse.json({ message: 'Error fetching available beds' }, { status: 500 });
  }
}
