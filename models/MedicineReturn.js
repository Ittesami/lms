// models/MedicineReturn.js
import mongoose from 'mongoose';

const medicineReturnSchema = new mongoose.Schema({
  returnId: {
    type: Number,
    required: true,
    unique: true  // This creates the index automatically
  },
  returnDate: {
    type: Date,
    default: Date.now
  },
  returnType: {
    type: String,
    enum: ['Outdoor', 'Indoor'],
    required: true
  },
  // For outdoor sales
  outdoorSale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OutdoorSale'
  },
  // For indoor patients
  admission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission'
  },
  medicines: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    medicineName: String,
    batchNumber: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    returnPrice: Number, // Price at which it was sold
    reason: {
      type: String,
      default: ''
    }
  }],
  totalReturnAmount: {
    type: Number,
    required: true
  },
  refundMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Credit Note', 'Account Adjustment'],
    default: 'Cash'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Approved'
  }
}, {
  timestamps: true
});

// Indexes
medicineReturnSchema.index({ returnDate: -1 });
medicineReturnSchema.index({ returnType: 1 });
medicineReturnSchema.index({ outdoorSale: 1 });
medicineReturnSchema.index({ admission: 1 });

export default mongoose.models.MedicineReturn || mongoose.model('MedicineReturn', medicineReturnSchema);