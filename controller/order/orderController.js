const Order = require("../../models/Orders/Orders");
const Counter = require("../../models/Orders/Counter");
const User = require("../../models/Users/user");
const { uploadMultipleFilesToS3 } = require("../../utils/awsUtil");

async function getNextOrderNumber() {
  const today = new Date();
  const dateKey = today.toISOString().split("T")[0]; // YYYY-MM-DD
  const formattedDate = [
    String(today.getDate()).padStart(2, "0"),
    String(today.getMonth() + 1).padStart(2, "0"),
    today.getFullYear(),
  ].join("/"); // DD/MM/YYYY

  // Atomically increment the daily sequence
  const counter = await Counter.findOneAndUpdate(
    { _id: `orderNumber-${dateKey}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  return `${formattedDate}-${counter.seq}`;
}

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

    // Generate unique order number
    const orderNumber = await getNextOrderNumber();

    // Create new order
    const newOrder = new Order({
      customer: customer._id,
      orderNumber,
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
            assignedOrders: {
              order: savedOrder._id,
              taskType: "Prepare",
            },
          },
        }
      ),
      User.findOneAndUpdate(
        { uuid: staff.deliveredBy },
        {
          $push: {
            assignedOrders: {
              order: savedOrder._id,
              taskType: "Delivery",
            },
          },
        }
      ),
      User.findOneAndUpdate(
        { uuid: staff.collectedBy },
        {
          $push: {
            assignedOrders: {
              order: savedOrder._id,
              taskType: "Collect",
            },
          },
        }
      ),
    ]);

    const populatedOrder = await Order.findById(savedOrder._id)
      .populate({
        path: "customer",
        select: "name number email address", // Select fields you want to include
      })
      .lean(); // Convert to plain JavaScript object

    // Transform the response
    const responseData = {
      ...populatedOrder,
      customerName: populatedOrder.customer.name,
      customer: undefined,
    };

    res.status(201).json({
      code: 200,
      success: true,
      message: "Order created successfully",
      data: responseData,
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
      return res.status(404).json({ code: 404, message: "Order not found" });
    }

    res.status(200).json({ code: 200, data: order, message: "Order Fetched" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getEmpOrders = async (req, res) => {
  try {
    const { uuid } = req.query;
  } catch (error) {}
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
      code: 200,
      success: true,
      count: orders.length,
      data: orders,
      message: "All orders Fetched Successfully",
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

exports.getOrderStatusCounts = async (req, res) => {
  try {
    console.log("Counts Starting");
    // Count orders in each category
    const counts = await Promise.all([
      // Pending orders (just 'Pending' status)
      Order.countDocuments({ status: "Pending" }),

      // Processing orders (multiple statuses)
      Order.countDocuments({
        status: {
          $in: ["Preparing", "Prepared", "out-for-delivery", "Delivered"],
        },
      }),

      // Completed orders
      Order.countDocuments({ status: "Completed" }),
    ]);
    console.log("Counts is ", counts);
    // Prepare response
    const response = {
      pending: counts[0],
      processing: counts[1],
      completed: counts[2],
      total: counts[0] + counts[1] + counts[2], // Optional: total count
    };

    res.status(200).json({
      code: 200,
      success: true,
      data: response,
      message: "Order status counts fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order status counts",
      error: error.message,
    });
  }
};

// exports.orderByUuid = async (req, res) => {
//   try {
//     const { uuid } = req.params;

//     if (!uuid) {
//       return res.status(400).json({ success: false, message: "UUID is required" });
//     }

//     // Find the user with that UUID
//     const user = await User.findOne({ uuid });

//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     // Get all assigned orders
//     const assignedOrders = user.assignedOrders || [];

//     // Extract order IDs
//     const orderIds = assignedOrders.map((task) => task.order);
//     console.log(orderIds)

//     // Fetch orders from DB
//     const orders = await Order.find({ _id: { $in: orderIds } })
//       .populate("customer", "name email number")
//       .lean();

//     // Add taskType info to orders
//     const ordersWithTaskType = orders.map((order) => {
//       const task = assignedOrders.find(
//         (assigned) => assigned.order.toString() === order._id.toString()
//       );
//       return {
//         ...order,
//         taskType: task ? task.taskType : null,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       message: "Orders fetched by UUID",
//       data: ordersWithTaskType,
//       count: ordersWithTaskType.length,
//     });
//   } catch (error) {
//     console.error("Error in orderByUuid:", error);
//     res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//   }
// };

exports.orderByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    if (!uuid) {
      return res
        .status(400)
        .json({ success: false, message: "UUID is required" });
    }

    const user = await User.findOne({ uuid });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const assignedOrders = user.assignedOrders || [];
    const result = [];

    // Process each task individually
    for (const task of assignedOrders) {
      const order = await Order.findById(task.order)
        .populate("customer", "name email number")
        .lean();

      if (order) {
        result.push({
          ...order,
          taskType: task.taskType,
          taskStatus: task.taskStatus,
          taskId: task._id,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Orders fetched by UUID",
      data: result,
      count: result.length,
    });
  } catch (error) {
    console.error("Error in orderByUuid:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//Employee Section Of Orders
exports.startOrderStep = async (req, res) => {
  try {
    //Get The OrderId,Step and StaffId
    const { orderId, step, staffId } = req.body;

    //First Find The Order
    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res
        .status(404)
        .json({ code: 404, message: "Order Not Found", data: [] });
    }
    //Check If Correct Order Is Followed Or Not
    if (step === "Delivery") {
      if (order.status !== "Prepared") {
        return res.status(200).json({
          code: 404,
          message: "Cannot Perform This Task Now",
          data: [],
        });
      }
    } else if (step === "Collect") {
      if (order.status !== "Delivered") {
        return res.status(200).json({
          code: 404,
          message: "Cannot Perform This Task Now",
          data: [],
        });
      }
    }

    //Find the User
    const user = await User.findOne({ uuid: staffId });
    if (!user) {
      return res
        .status(404)
        .json({ code: 404, message: "User Not Found", data: [] });
    }

    //Find the Assigned Task
    const assignment = user.assignedOrders.find(
      (a) =>
        a.order.equals(orderId) &&
        a.taskType.toLowerCase() === step.toLowerCase()
    );

    if (!assignment) {
      return res.status(403).json({
        code: 403,
        message: "User not assigned to this order step",
        data: [],
      });
    }

    // Update order based on step
    const stepLower = step.toLowerCase();
    const now = new Date();

    switch (stepLower) {
      case "prepare":
        order.stepDetails.preparation.startedAt = now;
        order.status = "Preparing";
        break;
      case "collect":
        order.stepDetails.collection.startedAt = now;
        order.status = "Out For Collection";
        break;
      case "delivery":
        order.stepDetails.delivery.startedAt = now;
        order.status = "Out for Delivery";
        break;
      default:
        return res.status(400).json({
          code: 400,
          message: "Invalid step provided",
          data: [],
        });
    }

    // Update the assignment
    assignment.taskStatus = "Started";
    user.markModified("assignedOrders");

    order.markModified("stepDetails");
    order.markModified("status");

    await Promise.all([order.save(), user.save()]);

    return res
      .status(200)
      .json({ code: 200, message: "Task Started", data: order });
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message });
  }
};

//Update The Order
exports.updateOrderStep = async (req, res) => {
  try {
    const { files, body } = req;

    if (!files || files.length === 0) {
      return res.json({ code: 400, message: "Add Atlest One Image", data: [] });
    }
    const { orderId, status, notes, step, staffId } = body;
    //First Find the Order
    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res
        .status(200)
        .json({ code: 404, message: "Cannot Find The Order", data: [] });
    }

    //Upload the Images
    const imagesUrl = await uploadMultipleFilesToS3(files);
    console.log(imagesUrl);

    //Find the User
    const user = await User.findOne({ uuid: staffId });
    if (!user) {
      return res
        .status(200)
        .json({ code: 404, message: "User Not Found", data: [] });
    }

    //Find the Assigned Task
    const assignment = user.assignedOrders.find(
      (a) =>
        a.order.equals(orderId) &&
        a.taskType.toLowerCase() === step.toLowerCase()
    );

    if (!assignment) {
      return res.status(403).json({
        code: 403,
        message: "User not assigned to this order step",
        data: [],
      });
    }

    //Make Changes In DB
    if (status === "Prepared") {
      order.stepDetails.preparation.completedAt = new Date();
      order.stepDetails.preparation.notes = notes;
      order.stepDetails.preparation.images = imagesUrl;
      order.currentStep = "Delivery";
      order.status = "Prepared";
    }
    if (status === "Delivered") {
      order.stepDetails.delivery.completedAt = new Date();
      order.stepDetails.delivery.notes = notes;
      order.stepDetails.delivery.images = imagesUrl;
      order.currentStep = "Collection";
      order.status = "Delivered";
    }
    if (status === "Collected") {
      order.stepDetails.collection.completedAt = new Date();
      order.stepDetails.collection.notes = notes;
      order.stepDetails.collection.images = imagesUrl;
      order.currentStep = "Preparation";
      order.status = "Collected";
    }

    order.markModified("stepDetails");
    order.markModified("status");

    // Update the assignment
    assignment.taskStatus = "Completed";
    user.markModified("assignedOrders");

    await Promise.all([order.save(), user.save()]);

    return res
      .status(200)
      .json({ code: 200, message: "Order Updated Successfull", data: order });
  } catch (error) {
    console.log("Error is ", error.message);
    return res.status(500).json({ code: 500, message: "Images Failed To Add" });
  }
};
