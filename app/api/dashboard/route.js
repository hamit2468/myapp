
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Part from "@/models/Part";
import Transaction from "@/models/Transaction";

export async function GET() {
  try {
    await connectDB();

    // 1. Active registered parts
    const parts = await Part.find({ isActive: true })
      .select(
        "customerName projectName partName partNumber sapCode unit reorderLevel partImage"
      )
      .lean();

    const totalParts = parts.length;

    // 2. Received and issued quantities
    const transactionSummary = await Transaction.aggregate([
      {
        $group: {
          _id: "$transactionType",
          totalQuantity: { $sum: "$quantity" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    const receivedData = transactionSummary.find(
      (item) => item._id === "RECEIVED"
    );

    const issuedData = transactionSummary.find(
      (item) => item._id === "ISSUE"
    );

    const totalReceived = receivedData?.totalQuantity || 0;
    const totalIssued = issuedData?.totalQuantity || 0;
    const availableStock = totalReceived - totalIssued;

    // 3. Stock calculation for each active part
    const stockSummary = await Transaction.aggregate([
      {
        $group: {
          _id: {
            part: "$part",
            type: "$transactionType",
          },
          quantity: { $sum: "$quantity" },
        },
      },
    ]);

    const stockMap = {};

    stockSummary.forEach((item) => {
      const partId = String(item._id.part);

      if (!stockMap[partId]) {
        stockMap[partId] = {
          received: 0,
          issued: 0,
        };
      }

      if (item._id.type === "RECEIVED") {
        stockMap[partId].received = item.quantity;
      }

      if (item._id.type === "ISSUE") {
        stockMap[partId].issued = item.quantity;
      }
    });

    const lowStockParts = parts
      .map((part) => {
        const stock = stockMap[String(part._id)] || {
          received: 0,
          issued: 0,
        };

        const currentStock = stock.received - stock.issued;

        return {
          _id: part._id,
          partName: part.partName,
          partNumber: part.partNumber,
          customerName: part.customerName,
          partImage: part.partImage,
          unit: part.unit || "NOS",
          reorderLevel: part.reorderLevel || 0,
          availableStock: currentStock,
        };
      })
      .filter(
        (part) =>
          part.reorderLevel > 0 &&
          part.availableStock <= part.reorderLevel
      )
      .sort((a, b) => a.availableStock - b.availableStock);

    // 4. Customer-wise registered parts
    const customerMap = {};

    parts.forEach((part) => {
      const name = part.customerName || "Other";

      if (!customerMap[name]) {
        customerMap[name] = 0;
      }

      customerMap[name] += 1;
    });

    const customerOverview = Object.entries(customerMap)
      .map(([customerName, partCount]) => ({
        customerName,
        partCount,
      }))
      .sort((a, b) => b.partCount - a.partCount);

    // 5. Recent transactions
    const recentTransactions = await Transaction.find()
      .populate(
        "part",
        "partName partNumber customerName partImage unit"
      )
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(8)
      .lean();

    // 6. Response
    return NextResponse.json({
      success: true,

      stats: {
        totalParts,
        totalReceived,
        totalIssued,
        availableStock,
        receivedTransactions: receivedData?.totalTransactions || 0,
        issuedTransactions: issuedData?.totalTransactions || 0,
        lowStockCount: lowStockParts.length,
      },

      lowStockParts,
      customerOverview,
      recentTransactions,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard data.",
      },
      { status: 500 }
    );
  }
}
