
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Part from "@/models/Part";
import Transaction from "@/models/Transaction";

const CUSTOMERS = [
  "YAZAKI",
  "APTIV",
  "WEBASTO",
  "YAPP",
  "JOHN DEERE",
];

// GET: Fetch issue records
export async function GET() {
  try {
    await connectDB();

    const records = await Transaction.find({
      transactionType: "ISSUE",
    })
      .populate(
        "part",
        "partName partNumber sapCode customerName projectName unit partImage"
      )
      .sort({ transactionDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("Fetch Issue Records Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch issue records",
      },
      { status: 500 }
    );
  }
}

// POST: Create issue transaction
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      partId,
      quantity,
      transactionDate,
      recipientType,
      recipientName,
      departmentName,
      projectName,
      purpose,
      remarks,
    } = body;

    // Validate part ID
    if (!partId || !mongoose.Types.ObjectId.isValid(partId)) {
      return NextResponse.json(
        { success: false, message: "Please select a valid part" },
        { status: 400 }
      );
    }

    // Validate quantity
    const issueQuantity = Number(quantity);

    if (
      !Number.isSafeInteger(issueQuantity) ||
      issueQuantity <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be a positive whole number",
        },
        { status: 400 }
      );
    }

    // Validate destination
    const allowedTypes = [
      "IPC_DEPARTMENT",
      "LAB",
      "CUSTOMER",
    ];

    if (!allowedTypes.includes(recipientType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a valid issue destination",
        },
        { status: 400 }
      );
    }

    // Validate customer
    let finalRecipientName = "";
    let finalDepartmentName = "";

    if (recipientType === "CUSTOMER") {
      const selectedCustomer = recipientName?.trim()?.toUpperCase();

      if (!CUSTOMERS.includes(selectedCustomer)) {
        return NextResponse.json(
          {
            success: false,
            message: "Please select a valid customer",
          },
          { status: 400 }
        );
      }

      finalRecipientName = selectedCustomer;
    }

    if (recipientType === "IPC_DEPARTMENT") {
      finalDepartmentName = "IPC Department";
    }

    if (recipientType === "LAB") {
      finalDepartmentName = "LAB";
    }

    // Find active part
    const part = await Part.findOne({
      _id: partId,
      isActive: true,
    });

    if (!part) {
      return NextResponse.json(
        {
          success: false,
          message: "Part not found or inactive",
        },
        { status: 404 }
      );
    }

    // Validate transaction date
    const issueDate = transactionDate
      ? new Date(transactionDate)
      : new Date();

    if (Number.isNaN(issueDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid transaction date",
        },
        { status: 400 }
      );
    }

    // Calculate stock
    const stockSummary = await Transaction.aggregate([
      {
        $match: {
          part: part._id,
          transactionType: {
            $in: ["RECEIVED", "ISSUE"],
          },
        },
      },
      {
        $group: {
          _id: "$transactionType",
          total: { $sum: "$quantity" },
        },
      },
    ]);

    const totalReceived =
      stockSummary.find((item) => item._id === "RECEIVED")?.total || 0;

    const totalIssued =
      stockSummary.find((item) => item._id === "ISSUE")?.total || 0;

    const availableStock = totalReceived - totalIssued;

    // Prevent insufficient stock
    if (issueQuantity > availableStock) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient stock. Available: ${availableStock} ${part.unit}`,
          availableStock,
        },
        { status: 400 }
      );
    }

    // Save transaction
    const newTransaction = await Transaction.create({
      transactionType: "ISSUE",
      part: part._id,
      quantity: issueQuantity,
      transactionDate: issueDate,

      recipientType,
      recipientName: finalRecipientName,
      departmentName: finalDepartmentName,

      projectName:
        recipientType === "CUSTOMER"
          ? (projectName?.trim() || "")
          : "",

      purpose: purpose?.trim() || "",
      remarks: remarks?.trim() || "",
    });

    const savedTransaction = await Transaction.findById(
      newTransaction._id
    )
      .populate(
        "part",
        "partName partNumber sapCode customerName projectName unit partImage"
      )
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Part issued successfully",
        availableStockAfterIssue: availableStock - issueQuantity,
        record: savedTransaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Issue Entry Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create issue entry",
      },
      { status: 500 }
    );
  }
}
