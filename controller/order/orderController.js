const Order = require("../../models/Orders/Orders");
const User = require("../../models/Users/user");

exports.createOrder = async (req, res) => {
  try {
    const { customer, orderType, items, flavor, extras, staff, address } =
      req.body;

    // Validate required fields
    if (
      !customer ||
      !staff.preparedBy ||
      !staff.deliveredBy ||
      !staff.collectedBy
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create new order
    const newOrder = new Order({
      customer: customer._id,
      orderType,
      items,
      flavor,
      extras,
      staff,
      address,
      status: "Pending",
    });

    // Save order to database
    const savedOrder = await newOrder.save();

    // Update assigned employees
    await Promise.all([
      User.findOneAndUpdate(
        { uuid: staff.preparedBy },
        {
          $push: {
            assignedOrders: { order: savedOrder._id, taskType: "Prepare" },
          },
        }
      ),
      User.findOneAndUpdate(
        { uuid: staff.deliveredBy },
        {
          $push: {
            assignedOrders: { order: savedOrder._id, taskType: "Delivery" },
          },
        }
      ),
      User.findOneAndUpdate(
        { uuid: staff.collectedBy },
        {
          $push: {
            assignedOrders: { order: savedOrder._id, taskType: "Collect" },
          },
        }
      ),
    ]);

    res.status(201).json({
      code: 200,
      success: true,
      message: "Order created successfully",
      data: savedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email number")
      .exec();

    if (!order) {
      return res.status(404).json({code:404, message: "Order not found" });
    }

    res.status(200).json({code:200,data:order,message:"Order Fetched"});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    // Get query parameters
    const { status, sort, limit } = req.query;

    // Build query object
    const query = {};
    if (status) {
      query.status = status;
    }

    // Build options
    const options = {
      sort: { createdAt: -1 }, // Default sorting by newest first
      limit: 20, // Default limit
    };

    if (sort) {
      options.sort = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
    }

    if (limit) {
      options.limit = parseInt(limit);
    }

    // Get orders with customer details
    const orders = await Order.find(query)
      .populate("customer", "name email number")
      .sort(options.sort)
      .limit(options.limit)
      .exec();

    res.status(200).json({
        code:200,
      success: true,
      count: orders.length,
      data:orders,
      message:"All orders Fetched Successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const userId = req.user._id; // Assuming you have user info in request

    // Validate status
    const validStatuses = [
      "Pending",
      "Preparing",
      "Ready",
      "Out for Delivery",
      "Delivered",
      "Completed",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status,
        $push: {
          statusHistory: {
            status,
            changedBy: userId,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    ).populate("customer", "name email number");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};
