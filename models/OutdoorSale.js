// models/OutdoorSale.js
import mongoose from 'mongoose';

const outdoorSaleSchema = new mongoose.Schema({
  billId: {
    type: Number,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  customerName: {
    type: String,
    default: ''
  },
  customerPhone: {
    type: String,
    default: ''
  },
  medicines: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine'
    },
    medicineName: String,
    batchNumber: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true
  },
  paid: {
    type: Number,
    required: true,
    default: 0
  },
  due: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Mobile Banking', 'Bank Transfer'],
    default: 'Cash'
  },
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
outdoorSaleSchema.index({ billId: 1 }, { unique: true });
outdoorSaleSchema.index({ date: -1 });
outdoorSaleSchema.index({ soldBy: 1 });
outdoorSaleSchema.index({ customerPhone: 1 });

export default mongoose.models.OutdoorSale || mongoose.model('OutdoorSale', outdoorSaleSchema);