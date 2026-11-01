
import mongoose from "mongoose";

const PartSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    projectName: {
      type: String,
      required: true,
      trim: true,
    },

    // SAP Code is optional
    sapCode: {
      type: String,
      trim: true,
      default: "",
    },

    partName: {
      type: String,
      required: true,
      trim: true,
    },

    partNumber: {
      type: String,
      required: true,
      trim: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },

    supplierName: {
      type: String,
      trim: true,
      default: "",
    },

    // Moulding cavity count
    cavities: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Cavities must be a whole number.",
      },
    },

    // New two-image support
    partImages: {
      type: [String],
      default: [],
      validate: {
        validator: (images) => images.length <= 2,
        message: "Maximum 2 part images are allowed.",
      },
    },

    partImagePublicIds: {
      type: [String],
      default: [],
      validate: {
        validator: (ids) => ids.length <= 2,
        message: "Maximum 2 image IDs are allowed.",
      },
    },

    // Legacy image fields retained for existing parts
    partImage: {
      type: String,
      default: "",
    },

    partImagePublicId: {
      type: String,
      default: "",
    },

    unit: {
      type: String,
      default: "NOS",
    },

    reorderLevel: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Part ||
  mongoose.model("Part", PartSchema);
