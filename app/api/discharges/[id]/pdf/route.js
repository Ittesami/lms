// app/api/discharges/[id]/pdf/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Discharge from '@/models/Discharge';
import { generateDischargePDF } from '@/lib/pdfGenerator';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const discharge = await Discharge.findById(id)
      .populate({
        path: 'admission',
        populate: [
          { path: 'patient' },
          { path: 'consultant' },
          { path: 'bed' }
        ]
      });

    if (!discharge) {
      return NextResponse.json({ message: 'Discharge not found' }, { status: 404 });
    }

    const pdf = generateDischargePDF(
      discharge,
      discharge.admission,
      discharge.admission.patient,
      discharge.admission.consultant,
      discharge.admission.bed
    );

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="discharge-${discharge.admission.admissionId}.pdf"`
      }
    });

  } catch (error) {
    console.error('Generate discharge PDF error:', error);
    return NextResponse.json({ message: 'Error generating PDF' }, { status: 500 });
  }
}