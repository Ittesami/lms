import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  supplier: {
    type: String,
    default: ''
  }
}, { _id: true });

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  genericName: {
    type: String,
    default: ''
  },
  manufacturer: {
    type: String,
    default: ''
  },
  dosageForm: {
    type: String,
    default: ''
  },
  strength: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  },
  currentStock: {
    type: Number,
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 10
  },
  batches: [batchSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for nearest expiry date
medicineSchema.virtual('nearestExpiryDate').get(function() {
  if (!this.batches || this.batches.length === 0) return null;
  
  const activeBatches = this.batches.filter(b => b.quantity > 0);
  if (activeBatches.length === 0) return null;
  
  return activeBatches.reduce((nearest, batch) => {
    return batch.expiryDate < nearest ? batch.expiryDate : nearest;
  }, activeBatches[0].expiryDate);
});

// Virtual for selling price (from earliest expiring batch)
medicineSchema.virtual('sellingPrice').get(function() {
  const batch = this.getNextBatch();
  return batch ? batch.price : 0;
});

// Method to get next batch to sell (FIFO - nearest expiry first)
medicineSchema.methods.getNextBatch = function() {
  if (!this.batches || this.batches.length === 0) return null;
  
  const activeBatches = this.batches
    .filter(b => b.quantity > 0)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  
  return activeBatches.length > 0 ? activeBatches[0] : null;
};

// Method to deduct stock (FIFO)
medicineSchema.methods.deductStock = function(quantity) {
  let remaining = quantity;
  const deductedBatches = [];
  
  // Sort batches by expiry date (FIFO)
  const sortedBatches = this.batches
    .filter(b => b.quantity > 0)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  
  for (const batch of sortedBatches) {
    if (remaining <= 0) break;
    
    const deductAmount = Math.min(batch.quantity, remaining);
    batch.quantity -= deductAmount;
    remaining -= deductAmount;
    
    deductedBatches.push({
      batchNumber: batch.batchNumber,
      quantity: deductAmount,
      price: batch.price,
      expiryDate: batch.expiryDate
    });
  }
  
  // Update total stock
  this.currentStock = this.batches.reduce((sum, b) => sum + b.quantity, 0);
  
  return {
    success: remaining === 0,
    deductedBatches,
    remaining
  };
};

// Method to add stock back (for returns)
medicineSchema.methods.addStockBack = function(batchNumber, quantity) {
  const batch = this.batches.find(b => b.batchNumber === batchNumber);
  
  if (batch) {
    batch.quantity += quantity;
  } else {
    // If batch not found, add to a return batch
    this.batches.push({
      batchNumber: batchNumber + '-RETURN',
      quantity: quantity,
      price: 0,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      supplier: 'Customer Return'
    });
  }
  
  this.currentStock = this.batches.reduce((sum, b) => sum + b.quantity, 0);
};

// Indexes
medicineSchema.index({ name: 'text', genericName: 'text' });
medicineSchema.index({ currentStock: 1 });
medicineSchema.index({ 'batches.expiryDate': 1 });

// Ensure virtuals are included
medicineSchema.set('toJSON', { virtuals: true });
medicineSchema.set('toObject', { virtuals: true });

// Delete the existing model to force recreation
if (mongoose.models.Medicine) {
  delete mongoose.models.Medicine;
}

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;