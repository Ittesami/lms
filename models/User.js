import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'pharmacist', 'cashier', 'viewer'],
    default: 'viewer'
  },
  permissions: [{
    type: String,
    enum: [
      'view_medicines',
      'add_medicines',
      'edit_medicines',
      'delete_medicines',
      'view_inventory',
      'manage_users',
      'manage_roles',
      'view_reports',
      'manage_sales'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

export default mongoose.models.User || mongoose.model('User', userSchema);