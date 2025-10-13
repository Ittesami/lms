import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema({
  admissionId: {
    type: Number,
    required: true,
    unique: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  contactPersonName: {
    type: String,
    required: true
  },
  contactPersonPhone: {
    type: String,
    required: true
  },
  consultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  referredBy: {
    type: String,
    default: ''
  },
  bed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed',
    required: true
  },
  chargePerDay: {
    type: Number,
    required: true
  },
  admissionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  admissionFee: {
    type: Number,
    default: 0
  },
  advanceAmount: {
    type: Number,
    default: 0
  },
  // Bed change history
  bedHistory: [{
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed'
    },
    bedNumber: String,
    chargePerDay: Number,
    fromDate: Date,
    toDate: Date
  }],
  // Medicine invoices
  medicineInvoices: [{
    invoiceId: mongoose.Schema.Types.ObjectId,
    medicines: [{
      medicineId: mongoose.Schema.Types.ObjectId,
      name: String,
      quantity: Number,
      price: Number
    }],
    totalAmount: Number,
    date: Date
  }],
  // Service invoices
  serviceInvoices: [{
    services: [{
      service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      },
      serviceName: String,
      unitPrice: Number,
      quantity: Number
    }],
    totalAmount: Number,
    date: Date
  }],
  status: {
    type: String,
    enum: ['Admitted', 'Discharged'],
    default: 'Admitted'
  },
  dischargeDate: {
    type: Date,
    default: null
  },
  totalBill: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Admission || mongoose.model('Admission', admissionSchema);