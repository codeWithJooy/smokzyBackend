const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  number: {
    type: String,
    required: [true, 'Customer phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  address: {
    plotApartment: {
      type: String,
      required: [true, 'Plot/Apartment is required'],
      trim: true
    },
    streetAddress1: {
      type: String,
      required: [true, 'Street Address 1 is required'],
      trim: true
    },
    streetAddress2: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    pin: {
      type: String,
      required: [true, 'PIN code is required'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^[1-9][0-9]{5}$/.test(v);
        },
        message: props => `${props.value} is not a valid PIN code!`
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports =  mongoose.model('Customer', customerSchema);
