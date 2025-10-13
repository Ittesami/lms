// app/api/investigations/[id]/pdf/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InvestigationBilling from '@/models/InvestigationBilling';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const investigation = await InvestigationBilling.findById(params.id)
      .populate('patient')
      .populate('consultant')
      .populate('services.service');

    if (!investigation) {
      return NextResponse.json({ message: 'Investigation not found' }, { status: 404 });
    }

    // Generate HTML for PDF
    const html = generateInvestigationHTML(investigation);

    // Return HTML response with print styles
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ 
      message: 'Error generating PDF',
      error: error.message 
    }, { status: 500 });
  }
}

function generateInvestigationHTML(investigation) {
  const grandTotal = investigation.totalAmount - investigation.discount;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investigation Bill - ${investigation.billId}</title>
  <style>
    @media print {
      @page {
        size: A4;
        margin: 15mm;
      }
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 15px;
    }
    
    .header h1 {
      font-size: 28px;
      color: #2563eb;
      margin-bottom: 5px;
    }
    
    .header p {
      font-size: 11px;
      color: #666;
    }
    
    .bill-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
      padding: 15px;
      background: #f3f4f6;
      border-radius: 5px;
    }
    
    .info-group h3 {
      font-size: 13px;
      color: #2563eb;
      margin-bottom: 8px;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 4px;
    }
    
    .info-row {
      display: flex;
      padding: 3px 0;
      font-size: 11px;
    }
    
    .info-row .label {
      font-weight: 600;
      width: 100px;
      color: #666;
    }
    
    .info-row .value {
      flex: 1;
      color: #000;
    }
    
    .services-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .services-table th {
      background: #2563eb;
      color: white;
      padding: 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
    }
    
    .services-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 11px;
    }
    
    .services-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .services-table .text-right {
      text-align: right;
    }
    
    .services-table .text-center {
      text-align: center;
    }
    
    .summary {
      margin-top: 20px;
      padding: 15px;
      background: #f3f4f6;
      border-radius: 5px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
    }
    
    .summary-row.total {
      font-size: 16px;
      font-weight: bold;
      border-top: 2px solid #2563eb;
      margin-top: 8px;
      padding-top: 8px;
      color: #2563eb;
    }
    
    .summary-row.paid {
      color: #059669;
      font-weight: 600;
    }
    
    .summary-row.due {
      color: #dc2626;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    
    .signature {
      text-align: center;
      margin-top: 30px;
    }
    
    .signature-line {
      border-top: 1px solid #000;
      width: 200px;
      margin: 0 auto;
      padding-top: 5px;
      font-size: 10px;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .print-button:hover {
      background: #1d4ed8;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
    }
    
    .status-paid {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-partial {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status-pending {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .remarks {
      margin-top: 15px;
      padding: 10px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 3px;
      font-size: 11px;
    }
    
    .remarks strong {
      display: block;
      margin-bottom: 4px;
      color: #92400e;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>

  <div class="header">
    <h1>HOSPITAL NAME</h1>
    <p>Address Line 1, City, Country</p>
    <p>Phone: +880 1XXX-XXXXXX | Email: info@hospital.com</p>
  </div>

  <div style="text-align: center; margin: 15px 0;">
    <h2 style="font-size: 18px; color: #2563eb;">INVESTIGATION BILL</h2>
    <p style="font-size: 12px;">Bill ID: <strong>#${investigation.billId}</strong></p>
  </div>

  <div class="bill-info">
    <div class="info-group">
      <h3>Patient Information</h3>
      <div class="info-row">
        <span class="label">Patient ID:</span>
        <span class="value">${investigation.patient?.patientId || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Name:</span>
        <span class="value">${investigation.patient?.name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Age/Sex:</span>
        <span class="value">${investigation.patient?.age || 'N/A'}Y / ${investigation.patient?.sex || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Phone:</span>
        <span class="value">${investigation.patient?.phone || 'N/A'}</span>
      </div>
    </div>

    <div class="info-group">
      <h3>Bill Information</h3>
      <div class="info-row">
        <span class="label">Bill Date:</span>
        <span class="value">${new Date(investigation.date).toLocaleDateString('en-GB')}</span>
      </div>
      <div class="info-row">
        <span class="label">Delivery Date:</span>
        <span class="value">${new Date(investigation.deliveryDate).toLocaleDateString('en-GB')}</span>
      </div>
      <div class="info-row">
        <span class="label">Consultant:</span>
        <span class="value">${investigation.consultant?.name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Status:</span>
        <span class="value">
          <span class="status-badge status-${investigation.paymentStatus.toLowerCase()}">
            ${investigation.paymentStatus}
          </span>
        </span>
      </div>
    </div>
  </div>

  <table class="services-table">
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Service Name</th>
        <th class="text-center" style="width: 60px;">Qty</th>
        <th class="text-right" style="width: 100px;">Unit Price</th>
        <th class="text-right" style="width: 120px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${investigation.services.map((service, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${service.serviceName}</td>
          <td class="text-center">${service.quantity}</td>
          <td class="text-right">৳${service.unitPrice.toLocaleString()}</td>
          <td class="text-right" style="font-weight: 600;">৳${(service.unitPrice * service.quantity).toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row">
      <span>Subtotal:</span>
      <span>৳${investigation.totalAmount.toLocaleString()}</span>
    </div>
    <div class="summary-row">
      <span>Discount:</span>
      <span style="color: #dc2626;">-৳${investigation.discount.toLocaleString()}</span>
    </div>
    <div class="summary-row total">
      <span>Grand Total:</span>
      <span>৳${grandTotal.toLocaleString()}</span>
    </div>
    <div class="summary-row paid">
      <span>Paid:</span>
      <span>৳${investigation.paid.toLocaleString()}</span>
    </div>
    <div class="summary-row due">
      <span>Due Amount:</span>
      <span>৳${investigation.due.toLocaleString()}</span>
    </div>
  </div>

  ${investigation.remarks ? `
    <div class="remarks">
      <strong>Remarks:</strong>
      ${investigation.remarks}
    </div>
  ` : ''}

  <div class="footer">
    <div>
      <p><strong>Payment Method:</strong> ${investigation.payments && investigation.payments.length > 0 ? investigation.payments[0].paymentMethod : 'N/A'}</p>
      <p style="margin-top: 5px; font-size: 10px; color: #666;">
        Generated on: ${new Date().toLocaleString('en-GB')}
      </p>
    </div>
    <div class="signature">
      <div class="signature-line">Authorized Signature</div>
    </div>
  </div>

  <div style="margin-top: 30px; padding: 10px; background: #fef3c7; border-radius: 5px; font-size: 10px; text-align: center;">
    <p><strong>Note:</strong> Please collect your report on ${new Date(investigation.deliveryDate).toLocaleDateString('en-GB')}. Thank you for choosing our services!</p>
  </div>

  <script>
    // Auto-print on page load (optional)
    // window.onload = () => window.print();
  </script>
</body>
</html>
  `;
}