
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    // Test MongoDB
    await connectDB();

    // Test Cloudinary
    const cloudinaryResult = await cloudinary.api.ping();

    return NextResponse.json({
      success: true,
      message: "All backend connections successful!",
      mongodb: "Connected",
      cloudinary: cloudinaryResult.status,
    });

  } catch (error) {
    console.error("Connection Test Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
