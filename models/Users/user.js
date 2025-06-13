const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  uuid: { type: String, unique: true, default: uuidv4 },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Employee'], default: 'Admin' },
  assignedOrders: [{
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    taskType: {
      type: String,
      required: true
    },
    status: {
      type: String,
      default: 'Pending'
    }
  }],
  status:{type:String,default:"active"}

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password comparison method
userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
