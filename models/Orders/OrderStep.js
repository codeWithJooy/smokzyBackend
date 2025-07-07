// models/OrderStep.js
const mongoose = require('mongoose');

const orderStepSchema = new mongoose.Schema({
  orderNumber: { 
    type: String, 
    ref: 'Order', 
    required: true 
  },
  stepType: { 
    type: String, 
    required: true 
  },
  staffId: { 
    type: String, 
    required: true 
  },
  notes: { 
    type: String, 
    maxlength: 500 
  },
  images: { 
    type: [String], 
    validate: [arrayLimit, '{PATH} exceeds the limit of 5'],
    default: [] 
  },
  status: { 
    type: String, 
    default: 'started' 
  },
}, { timestamps: true });

// Validate max 5 images
function arrayLimit(val) {
  return val.length <= 5;
}

module.exports = mongoose.model('OrderStep', orderStepSchema);