// models/InvestigationBilling.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Mobile Banking', 'Bank Transfer'],
    default: 'Cash'
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  },
  remarks: String
}, { _id: true });

const investigationBillingSchema = new mongoose.Schema({
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
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  consultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  services: [{
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    serviceName: String,
    unitPrice: Number,
    quantity: {
      type: Number,
      default: 1
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
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
  // Payment tracking
  payments: [paymentSchema],
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid'],
    default: 'Pending'
  },
  // Report delivery tracking
  reportStatus: {
    type: String,
    enum: ['Pending', 'Ready', 'Delivered'],
    default: 'Pending'
  },
  reportDeliveredAt: Date,
  reportDeliveredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for grand total
investigationBillingSchema.virtual('grandTotal').get(function() {
  return (this.totalAmount || 0) - (this.discount || 0);
});

// Ensure virtuals are included in JSON
investigationBillingSchema.set('toJSON', { virtuals: true });
investigationBillingSchema.set('toObject', { virtuals: true });

// Method to add payment
investigationBillingSchema.methods.addPayment = function(paymentData) {
  this.payments.push(paymentData);
  
  // Recalculate paid and due
  this.paid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  this.due = this.grandTotal - this.paid;
  
  // Update payment status
  if (this.due <= 0) {
    this.paymentStatus = 'Paid';
  } else if (this.paid > 0) {
    this.paymentStatus = 'Partial';
  } else {
    this.paymentStatus = 'Pending';
  }
  
  return this.save();
};

// Method to populate payment users manually
investigationBillingSchema.methods.populatePaymentUsers = async function() {
  const User = mongoose.model('User');
  
  for (let payment of this.payments) {
    if (payment.receivedBy && !payment.receivedBy.name) {
      const user = await User.findById(payment.receivedBy).select('name email');
      if (user) {
        payment.receivedBy = user;
      }
    }
  }
  
  return this;
};

// Indexes for performance
investigationBillingSchema.index({ billId: 1 }, { unique: true });
investigationBillingSchema.index({ patient: 1 });
investigationBillingSchema.index({ date: -1 });
investigationBillingSchema.index({ paymentStatus: 1 });
investigationBillingSchema.index({ reportStatus: 1 });
investigationBillingSchema.index({ due: 1 });

export default mongoose.models.InvestigationBilling || mongoose.model('InvestigationBilling', investigationBillingSchema);