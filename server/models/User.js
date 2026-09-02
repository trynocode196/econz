const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: 'password' },
  role: { type: String, default: 'Manager' }, // Admin, Manager, Sales, Finance, Operations
  entity: { type: String, default: 'India' }, // India, UAE, UK, US, Global
  phone: { type: String, default: '' },
  designation: { type: String, default: 'Customer Success Account Management Team' },
  status: { type: String, default: 'Active' },
  accessLevels: { type: [String], default: ['Sales Team', 'Quotes', 'Customers'] },
  reportingManagers: [{
    id: { type: String },
    name: { type: String },
    email: { type: String }
  }],
  avatar: { type: String, default: '' },
  googleId: { type: String, default: '' },
  authProvider: { type: String, default: 'local' }, // 'local' | 'google'
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
