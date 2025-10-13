import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  bedNumber: {
    type: String,
    required: true,
    unique: true
  },
  bedName: {
    type: String,
    required: true
  },
  chargePerDay: {
    type: Number,
    required: true,
    min: 0
  },
  facilities: {
    type: String,
    default: ''
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  currentPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Bed || mongoose.model('Bed', bedSchema);