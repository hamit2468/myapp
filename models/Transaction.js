
import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    transactionType: {
      type: String,
      enum: ["RECEIVED", "ISSUE"],
      required: true,
    },

    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Part",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Received entry details
    supplierName: {
      type: String,
      trim: true,
      default: "",
    },

    // Issue entry details
    recipientType: {
      type: String,
      enum: ["", "IPC_DEPARTMENT", "LAB", "CUSTOMER"],
      default: "",
    },

    recipientName: {
      type: String,
      trim: true,
      default: "",
    },

    departmentName: {
      type: String,
      trim: true,
      default: "",
    },

    projectName: {
      type: String,
      trim: true,
      default: "",
    },

    purpose: {
      type: String,
      trim: true,
      default: "",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

TransactionSchema.index({ part: 1, transactionDate: -1 });
TransactionSchema.index({ transactionType: 1, transactionDate: -1 });

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
