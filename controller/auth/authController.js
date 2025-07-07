// controllers/authController.js
const user = require('../../models/Users/user');
const User = require('../../models/Users/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Generate Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { fullName, email, phone, password, role } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      role: role || 'Admin',
    });

    res.status(201).json({ code:200,message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ code:500,message: 'Signup failed', error: err.message });
  }
};

// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'User Not Found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    const token = generateToken(user);

    res.status(200).json({
      code:200,
      message: 'Login successful',
      token,
      data: {
        id: user.uuid,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

exports.getList=async(req,res)=>{
    try{
        const users=await user.find()
    res.status(200).json({
        code:200,
        users
    })
    }catch(error){
        res.status(500).json({
            code:500,
            message:"Unable To Fetch",
            error:err.message
        })
    }
}