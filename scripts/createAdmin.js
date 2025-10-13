const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://ittehad:ittehad@cluster.dunprm8.mongodb.net/?retryWrites=true&w=majority&appName=cluster';

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  fullName: String,
  role: String,
  permissions: [String],
  isActive: Boolean,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await User.create({
      username: 'admin',
      email: 'admin@pharmacy.com',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'admin',
      permissions: [
        'view_medicines',
        'add_medicines',
        'edit_medicines',
        'delete_medicines',
        'view_inventory',
        'manage_users',
        'manage_roles',
        'view_reports',
        'manage_sales'
      ],
      isActive: true,
      createdAt: new Date()
    });

    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdmin();