const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
  uuid: {
    type: String,
    unique: true,
    default: uuidv4
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  orderType: {
    type: String,
    enum: ['Regular Order', 'Party Catering'],
    default: 'Regular Order'
  },
  items: {
    hookah: { type: Number, default: 0, min: 0 },
    chillums: { type: Number, default: 0, min: 0 },
    coals: { type: Number, default: 0, min: 0 }
  },
  flavor: {
    type: String,
    default: 'Mint'
  },
  extras: {
    ice: { type: Boolean, default: false },
    cups: { type: Boolean, default: false },
    tongs: { type: Boolean, default: false }
  },
  staff: {
    preparedBy: {
      type: String,  // Storing UUID as per your data
      required: true
    },
    deliveredBy: {
      type: String,
      required: true
    },
    collectedBy: {
      type: String,
      required: true
    }
  },
  address: {
    plotApartment: String,
    streetAddress1: String,
    streetAddress2: String,
    city: String,
    pin: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'Prepared', 'Out for Delivery', 'Delivered', 'Completed'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);