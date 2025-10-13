import mongoose from 'mongoose';

const medicineSaleSchema = new mongoose.Schema({
  saleId: {
    type: Number,
    required: true,
    unique: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null // Can be null for walk-in customers
  },
  customerName: {
    type: String,
    default: ''
  },
  medicines: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    medicineName: String,
    batchNumber: String,
    quantity: Number,
    price: Number
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
    required: true
  },
  due: {
    type: Number,
    default: 0
  },
  saleType: {
    type: String,
    enum: ['Outdoor', 'Indoor'],
    default: 'Outdoor'
  },
  admission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    default: null
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.MedicineSale || mongoose.model('MedicineSale', medicineSaleSchema);