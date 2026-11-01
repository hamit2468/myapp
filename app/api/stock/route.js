
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Part from "@/models/Part";
import Transaction from "@/models/Transaction";

export async function GET() {
  try {
    await connectDB();

    const [parts, totals] = await Promise.all([
      Part.find({ isActive: true })
        .select(
          "customerName projectName sapCode partName partNumber supplierName partImage unit reorderLevel"
        )
        .sort({ partName: 1 })
        .lean(),

      Transaction.aggregate([
        {
          $group: {
            _id: {
              part: "$part",
              type: "$transactionType",
            },
            total: { $sum: "$quantity" },
          },
        },
      ]),
    ]);

    const totalsMap = {};

    totals.forEach((item) => {
      const partId = String(item._id.part);

      if (!totalsMap[partId]) {
        totalsMap[partId] = {
          received: 0,
          issued: 0,
        };
      }

      if (item._id.type === "RECEIVED") {
        totalsMap[partId].received = item.total;
      }

      if (item._id.type === "ISSUE") {
        totalsMap[partId].issued = item.total;
      }
    });

    const records = parts.map((part) => {
      const partId = String(part._id);
      const totalsForPart = totalsMap[partId] || {
        received: 0,
        issued: 0,
      };

      const availableStock =
        totalsForPart.received - totalsForPart.issued;

      return {
        ...part,
        totalReceived: totalsForPart.received,
        totalIssued: totalsForPart.issued,
        availableStock,
        isLowStock:
          Number(part.reorderLevel) > 0 &&
          availableStock <= Number(part.reorderLevel),
      };
    });

    return NextResponse.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("Stock API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch stock records",
      },
      { status: 500 }
    );
  }
}
