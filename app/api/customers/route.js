
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Customer from "@/models/Customer";

export async function GET() {
  try {
    await connectDB();

    const customers = await Customer.find().sort({ name: 1 });

    return NextResponse.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Customer name is required" },
        { status: 400 }
      );
    }

    const customer = await Customer.create({
      name: name.trim().toUpperCase(),
    });

    return NextResponse.json(
      { success: true, customer },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Customer already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await connectDB();

    const { id, name, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Customer ID is required" },
        { status: 400 }
      );
    }

    const update = {};

    if (typeof name === "string" && name.trim()) {
      update.name = name.trim().toUpperCase();
    }

    if (typeof isActive === "boolean") {
      update.isActive = isActive;
    }

    const customer = await Customer.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Customer name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
