import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDate, formatCurrency, formatDateTime } from './helpers';

export function generateInvestigationPDF(investigation, patient, doctor) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('HOSPITAL NAME', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Address Line 1, City, Country', 105, 27, { align: 'center' });
  doc.text('Phone: +880 XXX-XXXXXX | Email: info@hospital.com', 105, 32, { align: 'center' });
  
  // Line
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(15, 37, 195, 37);
  
  // Investigation Bill Header
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('INVESTIGATION BILL', 105, 45, { align: 'center' });
  
  // Bill Details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const startY = 55;
  
  // Left column
  doc.text(`Bill ID: ${investigation.billId}`, 15, startY);
  doc.text(`Date: ${formatDate(investigation.date)}`, 15, startY + 6);
  doc.text(`Delivery Date: ${formatDate(investigation.deliveryDate)}`, 15, startY + 12);
  
  // Right column
  doc.text(`Patient ID: ${patient.patientId}`, 120, startY);
  doc.text(`Consultant: ${doctor.name}`, 120, startY + 6);
  
  // Patient Information
  doc.setFont(undefined, 'bold');
  doc.text('Patient Information:', 15, startY + 22);
  doc.setFont(undefined, 'normal');
  doc.text(`Name: ${patient.name}`, 15, startY + 28);
  doc.text(`Age: ${patient.age}`, 70, startY + 28);
  doc.text(`Sex: ${patient.sex}`, 100, startY + 28);
  doc.text(`Blood Group: ${patient.bloodGroup || 'N/A'}`, 130, startY + 28);
  doc.text(`Phone: ${patient.phone}`, 15, startY + 34);
  doc.text(`Address: ${patient.address || 'N/A'}`, 70, startY + 34);
  
  // Services Table
  const tableStartY = startY + 45;
  const tableData = investigation.services.map((service, index) => [
    index + 1,
    service.serviceName,
    service.quantity || 1,
    formatCurrency(service.unitPrice),
    formatCurrency(service.unitPrice * (service.quantity || 1))
  ]);
  
  doc.autoTable({
    startY: tableStartY,
    head: [['#', 'Service Name', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
    }
  });
  
  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  const rightAlign = 195;
  
  doc.setFont(undefined, 'normal');
  doc.text('Subtotal:', rightAlign - 50, finalY, { align: 'right' });
  doc.text(formatCurrency(investigation.totalAmount), rightAlign, finalY, { align: 'right' });
  
  doc.text('Discount:', rightAlign - 50, finalY + 6, { align: 'right' });
  doc.text(formatCurrency(investigation.discount), rightAlign, finalY + 6, { align: 'right' });
  
  doc.setLineWidth(0.3);
  doc.line(rightAlign - 55, finalY + 9, rightAlign, finalY + 9);
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Grand Total:', rightAlign - 50, finalY + 14, { align: 'right' });
  doc.text(formatCurrency(investigation.totalAmount - investigation.discount), rightAlign, finalY + 14, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Paid:', rightAlign - 50, finalY + 20, { align: 'right' });
  doc.text(formatCurrency(investigation.paid), rightAlign, finalY + 20, { align: 'right' });
  
  doc.setFont(undefined, 'bold');
  doc.text('Due:', rightAlign - 50, finalY + 26, { align: 'right' });
  doc.text(formatCurrency(investigation.due), rightAlign, finalY + 26, { align: 'right' });
  
  // Remarks
  if (investigation.remarks) {
    doc.setFont(undefined, 'italic');
    doc.setFontSize(9);
    doc.text(`Remarks: ${investigation.remarks}`, 15, finalY + 35);
  }
  
  // Footer
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for choosing our services!', 105, 280, { align: 'center' });
  doc.text('This is a computer-generated document. No signature required.', 105, 285, { align: 'center' });
  
  return doc;
}

export function generateDischargePDF(discharge, admission, patient, doctor, bed) {
  const doc = new jsPDF();
  
  // Similar structure to investigation bill
  // Add hospital header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('HOSPITAL NAME', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Address Line 1, City, Country', 105, 27, { align: 'center' });
  doc.text('Phone: +880 XXX-XXXXXX | Email: info@hospital.com', 105, 32, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(15, 37, 195, 37);
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('DISCHARGE SUMMARY', 105, 45, { align: 'center' });
  
  // Details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const startY = 55;
  
  doc.text(`Admission ID: ${admission.admissionId}`, 15, startY);
  doc.text(`Patient: ${patient.name}`, 15, startY + 6);
  doc.text(`Consultant: ${doctor.name}`, 15, startY + 12);
  doc.text(`Bed: ${bed.bedNumber}`, 15, startY + 18);
  
  doc.text(`Admission Date: ${formatDate(admission.admissionDate)}`, 120, startY);
  doc.text(`Discharge Date: ${formatDate(discharge.dischargeDate)}`, 120, startY + 6);
  doc.text(`Total Days: ${discharge.totalDays}`, 120, startY + 12);
  
  // Charges breakdown
  const tableY = startY + 30;
  doc.autoTable({
    startY: tableY,
    head: [['Description', 'Amount']],
    body: [
      ['Bed Charges', formatCurrency(discharge.bedCharges)],
      ['Medicine Charges', formatCurrency(discharge.medicineCharges)],
      ['Service Charges', formatCurrency(discharge.serviceCharges)],
      ['Admission Fee', formatCurrency(discharge.admissionFee)]
    ],
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 45, halign: 'right' }
    }
  });
  
  const finalY = doc.lastAutoTable.finalY + 5;
  const rightAlign = 195;
  
  doc.setLineWidth(0.3);
  doc.line(rightAlign - 60, finalY, rightAlign, finalY);
  
  doc.setFont(undefined, 'bold');
  doc.text('Subtotal:', rightAlign - 50, finalY + 6, { align: 'right' });
  doc.text(formatCurrency(discharge.subtotal), rightAlign, finalY + 6, { align: 'right' });
  
  doc.setFont(undefined, 'normal');
  doc.text('Discount:', rightAlign - 50, finalY + 12, { align: 'right' });
  doc.text(formatCurrency(discharge.discount), rightAlign, finalY + 12, { align: 'right' });
  
  doc.setLineWidth(0.5);
  doc.line(rightAlign - 60, finalY + 15, rightAlign, finalY + 15);
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Grand Total:', rightAlign - 50, finalY + 21, { align: 'right' });
  doc.text(formatCurrency(discharge.grandTotal), rightAlign, finalY + 21, { align: 'right' });
  
  doc.setFontSize(10);
  doc.text('Advance Paid:', rightAlign - 50, finalY + 27, { align: 'right' });
  doc.text(formatCurrency(discharge.advancePaid), rightAlign, finalY + 27, { align: 'right' });
  
  doc.text('Total Paid:', rightAlign - 50, finalY + 33, { align: 'right' });
  doc.text(formatCurrency(discharge.totalPaid), rightAlign, finalY + 33, { align: 'right' });
  
  doc.setFont(undefined, 'bold');
  doc.text('Due Amount:', rightAlign - 50, finalY + 39, { align: 'right' });
  doc.text(formatCurrency(discharge.due), rightAlign, finalY + 39, { align: 'right' });
  
  // Remarks
  if (discharge.remarks) {
    doc.setFont(undefined, 'italic');
    doc.setFontSize(9);
    doc.text(`Remarks: ${discharge.remarks}`, 15, finalY + 50);
  }
  
  // Footer
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for choosing our hospital!', 105, 280, { align: 'center' });
  doc.text('Wishing you good health and speedy recovery.', 105, 285, { align: 'center' });
  
  return doc;
}