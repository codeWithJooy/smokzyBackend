const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Helper function to validate image array limit (max 5 images)
function arrayLimit(val) {
  return val.length <= 5;
}

const orderSchema = new mongoose.Schema(
  {
    // Unique Identifiers
    uuid: {
      type: String,
      unique: true,
      default: uuidv4,
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // Customer & Order Info
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    orderType: {
      type: String,
      enum: ["Regular Order", "Party Catering"],
      default: "Regular Order",
    },

    // Order Items & Customization
    items: {
      hookah: { type: Number, default: 0, min: 0 },
      chillums: { type: Number, default: 0, min: 0 },
      coals: { type: Number, default: 0, min: 0 },
    },
    flavor: {
      type: String,
      default: "Mint",
    },
    extras: {
      ice: { type: Boolean, default: false },
      cups: { type: Boolean, default: false },
      tongs: { type: Boolean, default: false },
    },

    // Staff Assignment (UUIDs)
    staff: {
      preparedBy: { type: String, required: true },
      deliveredBy: { type: String },
      collectedBy: { type: String },
    },

    // Delivery Address
    address: {
      plotApartment: String,
      streetAddress1: String,
      streetAddress2: String,
      city: String,
      pin: String,
    },

    // Workflow Tracking
    currentStep: {
      type: String,
      enum: ["Preparation", "Delivery", "Collection"],
      default: "Preparation",
    },
    stepDetails: {
      preparation: {
        type: {
          startedAt: Date,
          completedAt: Date,
          staffId: String,
          notes: String,
          images: {
            type: [String],
            validate: [arrayLimit, "Max 5 images allowed"],
            default: [],
          },
        },
        default: {},
      },
      delivery: {
        type: {
          startedAt: Date,
          completedAt: Date,
          staffId: String,
          notes: String,
          images: {
            type: [String],
            validate: [arrayLimit, "Max 5 images allowed"],
            default: [],
          },
        },
        default: {},
      },
      collection: {
        type: {
          startedAt: Date,
          completedAt: Date,
          staffId: String,
          notes: String,
          images: {
            type: [String],
            validate: [arrayLimit, "Max 5 images allowed"],
            default: [],
          },
        },
        default: {},
      },
    },

    // Order Status (Auto-synced with currentStep)
    status: {
      type: String,
      enum: [
        "Pending",
        "Preparing",
        "Prepared",
        "Out for Delivery",
        "Delivered",
        "Completed",
      ],
      default: "Pending",
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ========================
// **MIDDLEWARE & VALIDATION**
// ========================

// 1. Auto-initialize Preparation step when order is created
orderSchema.pre("save", function (next) {
  if (this.isNew) {
    this.stepDetails.preparation = {
      startedAt: new Date(),
      staffId: this.staff.preparedBy,
      notes: "Order created",
      images: [],
    };
    this.currentStep = "Preparation";
    this.status = "Preparing";
  }
  next();
});

// 2. Enforce step progression (cannot skip steps)
orderSchema.pre("save", function (next) {
  if (this.isModified("currentStep")) {
    const { currentStep, stepDetails } = this;

    // Moving to Delivery requires Preparation completion
    if (currentStep === "Delivery" && !stepDetails.preparation.completedAt) {
      return next(
        new Error("Cannot proceed to Delivery: Preparation not completed")
      );
    }

    // Moving to Collection requires Delivery completion
    if (currentStep === "Collection" && !stepDetails.delivery.completedAt) {
      return next(
        new Error("Cannot proceed to Collection: Delivery not completed")
      );
    }

    // Auto-update status based on step
    if (currentStep === "Preparation") this.status = "Preparing";
    if (currentStep === "Delivery") this.status = "Out for Delivery";
    if (currentStep === "Collection") this.status = "Delivered"; // Later updated to 'Completed'
  }
  next();
});

// 3. Auto-update status to 'Completed' when Collection is finished
orderSchema.post("findOneAndUpdate", async function (doc) {
  if (
    doc &&
    doc.currentStep === "Collection" &&
    doc.stepDetails.collection.completedAt
  ) {
    doc.status = "Completed";
    await doc.save();
  }
});

// ========================
// **INDEXES (For Faster Queries)**
// ========================
orderSchema.index({ orderNumber: 1 }); // Faster order lookups
orderSchema.index({ customer: 1 }); // All orders by a customer
orderSchema.index({ currentStep: 1 }); // Filter orders by step
orderSchema.index({ status: 1 }); // Filter by status
orderSchema.index({ createdAt: -1 }); // Latest orders first

module.exports = mongoose.model("Order", orderSchema);
