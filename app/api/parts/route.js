
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Part from "@/models/Part";

// GET: Fetch all active parts
export async function GET() {
  try {
    await connectDB();

    const parts = await Part.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: parts.length,
      parts,
    });
  } catch (error) {
    console.error("Fetch Parts Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch parts",
      },
      { status: 500 }
    );
  }
}

// POST: Create a new part
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      customerName,
      projectName,
      sapCode,
      partName,
      partNumber,
      supplierName,
      cavities,
      partImages,
      partImagePublicIds,
      partImage,
      partImagePublicId,
      unit,
      reorderLevel,
    } = body;

    // Required field validation
    if (
      !customerName?.trim() ||
      !projectName?.trim() ||
      !partName?.trim() ||
      !partNumber?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer, Project, Part Name and Part Number are required",
        },
        { status: 400 }
      );
    }

    // Cavities validation
    const cavityCount = Number(cavities);

    if (
      cavities === undefined ||
      cavities === null ||
      String(cavities).trim() === "" ||
      !Number.isSafeInteger(cavityCount) ||
      cavityCount < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Cavities must be a whole number greater than 0",
        },
        { status: 400 }
      );
    }

    // Image validation
    const images = Array.isArray(partImages)
      ? partImages
      : partImage
        ? [partImage]
        : [];

    const imageIds = Array.isArray(partImagePublicIds)
      ? partImagePublicIds
      : partImagePublicId
        ? [partImagePublicId]
        : [];

    if (images.length > 2 || imageIds.length > 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum 2 images are allowed",
        },
        { status: 400 }
      );
    }

    if (
      images.some(
        (image) =>
          typeof image !== "string" ||
          !image.startsWith("https://res.cloudinary.com/")
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid part image URL",
        },
        { status: 400 }
      );
    }

    if (
      imageIds.some(
        (id) => typeof id !== "string" || !id.trim()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid image public ID",
        },
        { status: 400 }
      );
    }

    // Duplicate part number check
    const existingPart = await Part.findOne({
      partNumber: partNumber.trim(),
    });

    if (existingPart) {
      return NextResponse.json(
        {
          success: false,
          message: "Part number already exists",
        },
        { status: 409 }
      );
    }

    const newPart = await Part.create({
      customerName: customerName.trim(),
      projectName: projectName.trim(),
      sapCode: sapCode?.trim() || "",
      partName: partName.trim(),
      partNumber: partNumber.trim(),
      supplierName: supplierName?.trim() || "",
      cavities: cavityCount,

      partImages: images,
      partImagePublicIds: imageIds,

      // Keep legacy fields for compatibility
      partImage: images[0] || "",
      partImagePublicId: imageIds[0] || "",

      unit: unit || "NOS",
      reorderLevel: Number(reorderLevel) || 0,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Part created successfully",
        part: newPart,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Part Error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Part number already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create part",
      },
      { status: 500 }
    );
  }
}
