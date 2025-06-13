const express = require("express");
const router = express.Router();
const userController = require("../../controller/user/userController");

// @route   POST /api/users
// @desc    Add a user
router.post("/add", userController.addUser);

// @route   GET /api/users
// @desc    Get all users
router.get("/", userController.getUsers);

// @route   GET /api/users/:uuid
// @desc    Get user by UUID
router.get("/:uuid", userController.getUserByUUID);

// @route   PUT /api/users/:uuid
// @desc    Update user by UUID
router.put("/:uuid", userController.updateUserByUUID);

// @route   DELETE /api/users/:uuid
// @desc    Delete user by UUID
router.delete("/:uuid", userController.deleteUserByUUID);

module.exports = router;
