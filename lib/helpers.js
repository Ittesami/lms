// lib/helpers.js
import Counter from '@/models/Counter';

// Get next ID for any counter
export async function getNextId(counterName) {
  const counter = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return counter.value;
}

// Generate patient ID
export async function generatePatientId() {
  const id = await getNextId('patient');
  return `P${String(id).padStart(6, '0')}`; // P000001
}

// Generate investigation bill ID
export async function generateInvestigationId() {
  const id = await getNextId('investigation');
  return id; // Returns numeric ID
}

// Generate outdoor sale ID
export async function generateOutdoorSaleId() {
  const id = await getNextId('outdoorSale');
  return id; // Returns numeric ID
}

// Generate medicine return ID
export async function generateMedicineReturnId() {
  const id = await getNextId('medicineReturn');
  return id; // Returns numeric ID
}

// Calculate days between dates
export function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1; // Minimum 1 day
}

// Format currency
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0
  }).format(amount);
}

// Format date
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Format date and time
export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Create patient key
export function createPatientKey(phone, name) {
  return `${phone.trim()}-${name.toLowerCase().trim()}`;
}