import mongoose from 'mongoose';

const dischargeSchema = new mongoose.Schema({
  admission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    required: true
  },
  dischargeDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  totalDays: {
    type: Number,
    required: true
  },
  bedCharges: {
    type: Number,
    required: true
  },
  medicineCharges: {
    type: Number,
    default: 0
  },
  serviceCharges: {
    type: Number,
    default: 0
  },
  admissionFee: {
    type: Number,
    default: 0
  },
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
  advancePaid: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    required: true
  },
  due: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Discharge || mongoose.model('Discharge', dischargeSchema);
