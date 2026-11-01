
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const search = searchParams.get("search")?.trim() || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const query = {};

    if (type === "RECEIVED" || type === "ISSUE") {
      query.transactionType = type;
    }

    if (from || to) {
      query.transactionDate = {};

      if (from) {
        const fromDate = new Date(`${from}T00:00:00.000Z`);

        if (Number.isNaN(fromDate.getTime())) {
          return NextResponse.json(
            { success: false, message: "Invalid start date" },
            { status: 400 }
          );
        }

        query.transactionDate.$gte = fromDate;
      }

      if (to) {
        const toDate = new Date(`${to}T23:59:59.999Z`);

        if (Number.isNaN(toDate.getTime())) {
          return NextResponse.json(
            { success: false, message: "Invalid end date" },
            { status: 400 }
          );
        }

        query.transactionDate.$lte = toDate;
      }
    }

    let records = await Transaction.find(query)
      .populate(
        "part",
        "partName partNumber sapCode customerName projectName unit partImage"
      )
      .sort({ transactionDate: -1, createdAt: -1 })
      .lean();

    if (search) {
      const searchText = search.toLowerCase();

      records = records.filter((record) => {
        const part = record.part || {};

        const searchableValues = [
          part.partName,
          part.partNumber,
          part.sapCode,
          part.customerName,
          part.projectName,
          record.supplierName,
          record.recipientName,
          record.departmentName,
          record.projectName,
          record.purpose,
          record.remarks,
        ];

        return searchableValues.some((value) =>
          String(value || "").toLowerCase().includes(searchText)
        );
      });
    }

    return NextResponse.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("Fetch Records Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch transaction records",
      },
      { status: 500 }
    );
  }
}
