
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    // Check image exists
    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, message: "Please select an image" },
        { status: 400 }
      );
    }

    // Check image type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Image must be under 5 MB" },
        { status: 400 }
      );
    }

    // Convert image into buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "npd-parts",
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      message: "Part image uploaded successfully",
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });

  } catch (error) {
    console.error("Image Upload Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Image upload failed",
      },
      { status: 500 }
    );
  }
}
