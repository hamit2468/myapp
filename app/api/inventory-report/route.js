import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Part from "@/models/Part";
import Transaction from "@/models/Transaction";

const TIME_ZONE = "Asia/Kolkata";

function getIndiaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = {};

  parts.forEach(({ type, value }) => {
    values[type] = value;
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day + days));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getIndiaStart(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error("Invalid date format");
  }

  const date = new Date(`${dateString}T00:00:00+05:30`);

  if (
    Number.isNaN(date.getTime()) ||
    getIndiaDate(date) !== dateString
  ) {
    throw new Error("Invalid date");
  }

  return date;
}

function getRecipientName(transaction) {
  if (transaction.recipientName?.trim()) {
    return transaction.recipientName.trim();
  }

  if (transaction.departmentName?.trim()) {
    return transaction.departmentName.trim();
  }

  if (transaction.recipientType === "IPC_DEPARTMENT") {
    return "IPC Department";
  }

  if (transaction.recipientType === "LAB") {
    return "LAB";
  }

  if (transaction.recipientType === "CUSTOMER") {
    return "Customer";
  }

  return "Not Specified";
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const period = searchParams.get("period") || "today";
    const today = getIndiaDate();
    const currentMonth = `${today.slice(0, 7)}-01`;

    const todayStart = getIndiaStart(today);
    const monthStart = getIndiaStart(currentMonth);

    let periodStart;
    let periodEnd;

    if (period === "today") {
      periodStart = todayStart;
      periodEnd = new Date();
    } else if (period === "month") {
      periodStart = monthStart;
      periodEnd = new Date();
    } else if (period === "custom") {
      const from = searchParams.get("from");
      const to = searchParams.get("to");

      if (!from || !to) {
        return NextResponse.json(
          {
            success: false,
            message: "Please select both start and end dates.",
          },
          { status: 400 }
        );
      }

      if (from > to) {
        return NextResponse.json(
          {
            success: false,
            message: "Start date cannot be after end date.",
          },
          { status: 400 }
        );
      }

      periodStart = getIndiaStart(from);

      // End date is inclusive.
      periodEnd = getIndiaStart(addDays(to, 1));
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report period.",
        },
        { status: 400 }
      );
    }

    const parts = await Part.find({ isActive: true })
      .select(
        "customerName projectName sapCode partNumber partName supplierName unit"
      )
      .sort({ customerName: 1, projectName: 1, partName: 1 })
      .lean();

    // Fetch transactions needed for both opening balances and selected period.
    const transactionLimit =
      periodEnd > todayStart ? periodEnd : todayStart;

    const transactions = await Transaction.find({
      transactionDate: { $lt: transactionLimit },
    })
      .select(
        "part transactionType quantity transactionDate supplierName recipientType recipientName departmentName"
      )
      .sort({ transactionDate: 1 })
      .lean();

    const reportMap = new Map();

    for (const part of parts) {
      reportMap.set(String(part._id), {
        partId: String(part._id),
        customerProjects: [
          part.customerName,
          part.projectName,
        ]
          .filter(Boolean)
          .join(" / "),
        sapPartNo: part.sapCode || "",
        partCode: part.partNumber || "",
        partName: part.partName || "",
        supplier: part.supplierName || "",
        unit: part.unit || "NOS",

        todayOpeningStock: 0,
        monthOpeningStock: 0,
        received: 0,
        issued: 0,

        issueToMap: {},
      });
    }

    for (const transaction of transactions) {
      const partId = String(transaction.part);
      const row = reportMap.get(partId);

      if (!row) continue;

      const quantity = Number(transaction.quantity) || 0;
      const transactionDate = new Date(transaction.transactionDate);

      const isReceived = transaction.transactionType === "RECEIVED";
      const stockChange = isReceived ? quantity : -quantity;

      // Stock available at the beginning of today.
      if (transactionDate < todayStart) {
        row.todayOpeningStock += stockChange;
      }

      // Stock available at the beginning of this month.
      if (transactionDate < monthStart) {
        row.monthOpeningStock += stockChange;
      }

      // Transactions inside the selected report period.
      if (
        transactionDate >= periodStart &&
        transactionDate < periodEnd
      ) {
        if (isReceived) {
          row.received += quantity;
        } else {
          row.issued += quantity;

          const recipient = getRecipientName(transaction);

          row.issueToMap[recipient] =
            (row.issueToMap[recipient] || 0) + quantity;
        }
      }
    }

    const report = Array.from(reportMap.values()).map((row) => {
      const issueTo = Object.entries(row.issueToMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, quantity]) => `${name} - ${quantity} ${row.unit}`)
        .join(", ");

      return {
        partId: row.partId,
        customerProjects: row.customerProjects,
        sapPartNo: row.sapPartNo,
        partCode: row.partCode,
        partName: row.partName,
        supplier: row.supplier,
        todayOpeningStock: row.todayOpeningStock,
        issueTo: issueTo || "—",
        received: row.received,
        monthOpeningStock: row.monthOpeningStock,
        unit: row.unit,
      };
    });

    return NextResponse.json({
      success: true,
      period,
      from: getIndiaDate(periodStart),
      to:
        period === "custom"
          ? searchParams.get("to")
          : today,
      count: report.length,
      report,
    });
  } catch (error) {
    console.error("Inventory Report Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate inventory report.",
      },
      { status: 500 }
    );
  }
}