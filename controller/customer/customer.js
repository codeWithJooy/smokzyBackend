const Customer = require('../../models/Customer/Customer');

// @route   POST /api/customers
exports.createCustomer = async (req, res) => {
  try {
    const { 
      name, 
      number, 
      email, 
      plotApartment, 
      streetAddress1, 
      streetAddress2, 
      city, 
      pin 
    } = req.body;

    // Check if customer exists (by email or phone)
    const existingCustomer = await Customer.findOne({ 
      $or: [{ email }, { number }] 
    });
    
    if (existingCustomer) {
      return res.status(400).json({ 
        code: 400,
        message: 'Customer with this email or phone already exists' 
      });
    }

    const customer = await Customer.create({
      name,
      number,
      email,
      address: {
        plotApartment,
        streetAddress1,
        streetAddress2,
        city,
        pin
      }
    });

    res.status(201).json({ 
      code: 201,
      message: 'Customer created successfully',
      data: customer 
    });
  } catch (err) {
    res.status(500).json({ 
      code: 500,
      message: 'Customer creation failed', 
      error: err.message 
    });
  }
};

// @route   GET /api/customers
exports.getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { number: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Customer.countDocuments(query);

    res.status(200).json({
      code: 200,
      data: customers,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ 
      code: 500,
      message: 'Failed to fetch customers', 
      error: err.message 
    });
  }
};

// @route   GET /api/customers/:id
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ 
        code: 404,
        message: 'Customer not found' 
      });
    }

    res.status(200).json({ 
      code: 200,
      data: customer 
    });
  } catch (err) {
    res.status(500).json({ 
      code: 500,
      message: 'Failed to fetch customer', 
      error: err.message 
    });
  }
};

// @route   PUT /api/customers/:id
exports.updateCustomer = async (req, res) => {
  try {
    const { 
      name, 
      number, 
      email, 
      plotApartment, 
      streetAddress1, 
      streetAddress2, 
      city, 
      pin 
    } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name,
        number,
        email,
        address: {
          plotApartment,
          streetAddress1,
          streetAddress2,
          city,
          pin
        }
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ 
        code: 404,
        message: 'Customer not found' 
      });
    }

    res.status(200).json({ 
      code: 200,
      message: 'Customer updated successfully',
      data: customer 
    });
  } catch (err) {
    res.status(500).json({ 
      code: 500,
      message: 'Customer update failed', 
      error: err.message 
    });
  }
};

// @route   DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({ 
        code: 404,
        message: 'Customer not found' 
      });
    }

    res.status(200).json({ 
      code: 200,
      message: 'Customer deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ 
      code: 500,
      message: 'Failed to delete customer', 
      error: err.message 
    });
  }
};