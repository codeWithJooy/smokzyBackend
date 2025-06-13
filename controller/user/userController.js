const User = require("../../models/Users/user");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

//Add A new user
exports.addUser = async (req, res) => {
  try {
    const { fullName, email, phone, password, role } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      role: role || "admin",
    });

    res
      .status(201)
      .json({ code: 200, message: "User registered successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ code: 500, message: "Signup failed", error: err.message });
  }
};

//Get all users
exports.getUsers = async (req, res) => {
  try {
    console.log("Users");
    const users = await User.find();
    console.log("Users are",users)
    if (users.length === 0) {
      return res
        .status(200)
        .json({ code: 404, message: "No users found", data: [] });
    }
    res.status(200).json({ code: 200, message: "Users Fetched", data: users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res
      .status(500)
      .json({ code: 500, message: "Failed to get users", data: [] });
  }
};

// Get user by UUID
exports.getUserByUUID = async (req, res) => {
  try {
    const { uuid } = req.params;
    const user = await User.findOne({ uuid });

    if (!user) {
      return res
        .status(404)
        .json({ code: 404, message: "User not found", data: null });
    }

    res
      .status(200)
      .json({ code: 200, message: "User fetched successfully", data: user });
  } catch (err) {
    console.error("Error fetching user by UUID:", err);
    res
      .status(500)
      .json({ code: 500, message: "Failed to get user", data: null });
  }
};

// Edit user by UUID
exports.updateUserByUUID = async (req, res) => {
  try {
    const { uuid } = req.params;
    const updates = req.body;

    const updatedUser = await User.findOneAndUpdate({ uuid }, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ code: 404, message: "User not found", data: null });
    }

    res
      .status(200)
      .json({
        code: 200,
        message: "User updated successfully",
        data: updatedUser,
      });
  } catch (err) {
    console.error("Error updating user:", err);
    res
      .status(500)
      .json({ code: 500, message: "Failed to update user", data: null });
  }
};

// Delete user by UUID
exports.deleteUserByUUID = async (req, res) => {
  try {
    const { uuid } = req.params;

    const deletedUser = await User.findOneAndDelete({ uuid });

    if (!deletedUser) {
      return res
        .status(404)
        .json({ code: 404, message: "User not found", data: null });
    }

    res
      .status(200)
      .json({
        code: 200,
        message: "User deleted successfully",
        data: deletedUser,
      });
  } catch (err) {
    console.error("Error deleting user:", err);
    res
      .status(500)
      .json({ code: 500, message: "Failed to delete user", data: null });
  }
};
