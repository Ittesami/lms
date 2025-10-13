// app/api/outdoor-sales/[id]/invoice/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OutdoorSale from '@/models/OutdoorSale';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const sale = await OutdoorSale.findById(params.id)
      .populate('soldBy', 'fullName');

    if (!sale) {
      return NextResponse.json({ message: 'Sale not found' }, { status: 404 });
    }

    // Generate HTML for invoice
    const html = generateInvoiceHTML(sale);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ 
      message: 'Error generating invoice',
      error: error.message 
    }, { status: 500 });
  }
}

function generateInvoiceHTML(sale) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${sale.billId}</title>
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
      border-bottom: 3px solid #10b981;
      padding-bottom: 15px;
    }
    
    .header h1 {
      font-size: 28px;
      color: #10b981;
      margin-bottom: 5px;
    }
    
    .header p {
      font-size: 11px;
      color: #666;
    }
    
    .invoice-info {
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
      color: #10b981;
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
    
    .medicines-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .medicines-table th {
      background: #10b981;
      color: white;
      padding: 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
    }
    
    .medicines-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 11px;
    }
    
    .medicines-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .medicines-table .text-right {
      text-align: right;
    }
    
    .medicines-table .text-center {
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
      border-top: 2px solid #10b981;
      margin-top: 8px;
      padding-top: 8px;
      color: #10b981;
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
      background: #10b981;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .print-button:hover {
      background: #059669;
    }
    
    .thank-you {
      text-align: center;
      margin-top: 30px;
      padding: 15px;
      background: #fef3c7;
      border-radius: 5px;
      font-size: 11px;
      color: #92400e;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Print Invoice</button>

  <div class="header">
    <h1>PHARMACY NAME</h1>
    <p>Address Line 1, City, Country</p>
    <p>Phone: +880 1XXX-XXXXXX | Email: pharmacy@hospital.com</p>
  </div>

  <div style="text-align: center; margin: 15px 0;">
    <h2 style="font-size: 18px; color: #10b981;">SALES INVOICE</h2>
    <p style="font-size: 12px;">Invoice No: <strong>#${sale.billId}</strong></p>
  </div>

  <div class="invoice-info">
    <div class="info-group">
      <h3>Customer Information</h3>
      <div class="info-row">
        <span class="label">Name:</span>
        <span class="value">${sale.customerName || 'Walk-in Customer'}</span>
      </div>
      <div class="info-row">
        <span class="label">Phone:</span>
        <span class="value">${sale.customerPhone || 'N/A'}</span>
      </div>
    </div>

    <div class="info-group">
      <h3>Invoice Information</h3>
      <div class="info-row">
        <span class="label">Date:</span>
        <span class="value">${new Date(sale.date).toLocaleString('en-GB')}</span>
      </div>
      <div class="info-row">
        <span class="label">Sold By:</span>
        <span class="value">${sale.soldBy?.fullName || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Payment:</span>
        <span class="value">${sale.paymentMethod}</span>
      </div>
    </div>
  </div>

  <table class="medicines-table">
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Medicine Name</th>
        <th style="width: 120px;">Batch Number</th>
        <th class="text-center" style="width: 60px;">Qty</th>
        <th class="text-right" style="width: 100px;">Unit Price</th>
        <th class="text-right" style="width: 120px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${sale.medicines.map((med, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${med.medicineName}</td>
          <td>${med.batchNumber}</td>
          <td class="text-center">${med.quantity}</td>
          <td class="text-right">৳${med.unitPrice.toLocaleString()}</td>
          <td class="text-right" style="font-weight: 600;">৳${med.totalPrice.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row">
      <span>Subtotal:</span>
      <span>৳${sale.subtotal.toLocaleString()}</span>
    </div>
    <div class="summary-row">
      <span>Discount:</span>
      <span style="color: #dc2626;">-৳${sale.discount.toLocaleString()}</span>
    </div>
    <div class="summary-row total">
      <span>Grand Total:</span>
      <span>৳${sale.grandTotal.toLocaleString()}</span>
    </div>
    <div class="summary-row paid">
      <span>Paid:</span>
      <span>৳${sale.paid.toLocaleString()}</span>
    </div>
    <div class="summary-row due">
      <span>Due Amount:</span>
      <span>৳${sale.due.toLocaleString()}</span>
    </div>
  </div>

  ${sale.remarks ? `
    <div style="margin-top: 15px; padding: 10px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 3px; font-size: 11px;">
      <strong style="display: block; margin-bottom: 4px; color: #92400e;">Remarks:</strong>
      ${sale.remarks}
    </div>
  ` : ''}

  <div class="footer">
    <div>
      <p style="margin-top: 5px; font-size: 10px; color: #666;">
        Generated on: ${new Date().toLocaleString('en-GB')}
      </p>
    </div>
    <div class="signature">
      <div class="signature-line">Customer Signature</div>
    </div>
  </div>

  <div class="thank-you">
    <p><strong>Thank you for your purchase!</strong></p>
    <p>For any queries, please contact us at the number above.</p>
  </div>
</body>
</html>
  `;
}