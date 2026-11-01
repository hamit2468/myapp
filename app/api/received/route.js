import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Part from "@/models/Part";
import Transaction from "@/models/Transaction";

// GET: Fetch received transactions
export async function GET() {
  try {
    await connectDB();

    const records = await Transaction.find({
      transactionType: "RECEIVED",
    })
      .populate("part", "partName partNumber sapCode customerName projectName unit")
      .sort({ transactionDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("Fetch Received Records Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch received records" },
      { status: 500 }
    );
  }
}

// POST: Save a new received transaction
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      partId,
      quantity,
      transactionDate,
      supplierName,
      remarks,
    } = body;

    // Validate required fields
    if (!partId || !mongoose.Types.ObjectId.isValid(partId)) {
      return NextResponse.json(
        { success: false, message: "Please select a valid part" },
        { status: 400 }
      );
    }

    const receivedQuantity = Number(quantity);

    if (
      !Number.isFinite(receivedQuantity) ||
      receivedQuantity <= 0
    ) {
      return NextResponse.json(
        { success: false, message: "Quantity must be greater than zero" },
        { status: 400 }
      );
    }

    // Check whether the part exists
    const part = await Part.findOne({
      _id: partId,
      isActive: true,
    });

    if (!part) {
      return NextResponse.json(
        { success: false, message: "Part not found or inactive" },
        { status: 404 }
      );
    }

    // Validate transaction date
    const receivedDate = transactionDate
      ? new Date(transactionDate)
      : new Date();

    if (Number.isNaN(receivedDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid transaction date" },
        { status: 400 }
      );
    }

    // Create received transaction
    const newTransaction = await Transaction.create({
      transactionType: "RECEIVED",
      part: part._id,
      quantity: receivedQuantity,
      transactionDate: receivedDate,
      supplierName: supplierName?.trim() || part.supplierName || "",
      remarks: remarks?.trim() || "",
    });

    const savedTransaction = await Transaction.findById(
      newTransaction._id
    )
      .populate("part", "partName partNumber sapCode customerName projectName unit")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Received entry saved successfully",
        record: savedTransaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Received Entry Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save received entry" },
      { status: 500 }
    );
  }
}