
"use client";

import { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  CalendarDays,
  LoaderCircle,
} from "lucide-react";

import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const HEADERS = [
  "Customer + Projects",
  "SAP Part No",
  "Part Code",
  "Part Name",
  "Supplier",
  "Today Opening Stock",
  "Issue To",
  "Received",
  "Month Opening Stock",
];

function quantityWithUnit(quantity, unit) {
  return `${Number(quantity || 0).toLocaleString("en-IN")} ${unit || "NOS"}`;
}

function getFileDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function InventoryReportExport() {
  const [period, setPeriod] = useState("today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateReady, setDateReady] = useState(false);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  // Date browser mount hone ke baad set hogi.
  // Isse Next.js 16 prerender error nahi aayega.
  useEffect(() => {
    const today = getFileDate();

    setFrom(today);
    setTo(today);
    setDateReady(true);
  }, []);

  async function getReport() {
    const params = new URLSearchParams({ period });

    if (period === "custom") {
      if (!from || !to) {
        throw new Error("Please select both dates.");
      }

      if (from > to) {
        throw new Error("From date cannot be after To date.");
      }

      params.set("from", from);
      params.set("to", to);
    }

    const response = await fetch(
      `/api/inventory-report?${params.toString()}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to generate report."
      );
    }

    return data;
  }

  function getRows(report) {
    return report.map((item) => [
      item.customerProjects || "",
      item.sapPartNo || "",
      item.partCode || "",
      item.partName || "",
      item.supplier || "",
      quantityWithUnit(
        item.todayOpeningStock,
        item.unit
      ),
      item.issueTo || "—",
      quantityWithUnit(item.received, item.unit),
      quantityWithUnit(
        item.monthOpeningStock,
        item.unit
      ),
    ]);
  }

  function getPeriodLabel(data) {
    if (data.period === "today") {
      return `Today: ${data.from}`;
    }

    if (data.period === "month") {
      return `Current Month: ${data.from} to ${data.to}`;
    }

    return `Custom Period: ${data.from} to ${data.to}`;
  }

  async function downloadExcel() {
    try {
      setLoading("excel");
      setError("");

      const data = await getReport();
      const workbook = new ExcelJS.Workbook();

      workbook.creator = "NPD Room Inventory";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet(
        "Inventory Report",
        {
          views: [{ state: "frozen", ySplit: 4 }],
        }
      );

      sheet.columns = [
        { width: 28 },
        { width: 18 },
        { width: 18 },
        { width: 28 },
        { width: 22 },
        { width: 22 },
        { width: 38 },
        { width: 18 },
        { width: 22 },
      ];

      // Report title
      sheet.mergeCells("A1:I1");

      sheet.getCell("A1").value =
        "NPD ROOM - INVENTORY REPORT";

      sheet.getCell("A1").font = {
        bold: true,
        size: 16,
        color: { argb: "FFFFFFFF" },
      };

      sheet.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F2742" },
      };

      sheet.getCell("A1").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      sheet.getRow(1).height = 34;

      // Report period
      sheet.mergeCells("A2:I2");

      sheet.getCell("A2").value =
        `${getPeriodLabel(data)} | Generated: ${new Date().toLocaleString("en-IN")}`;

      sheet.getCell("A2").font = {
        italic: true,
        size: 10,
        color: { argb: "FF475569" },
      };

      sheet.getCell("A2").alignment = {
        horizontal: "center",
      };

      sheet.getRow(2).height = 23;

      // Column headings
      sheet.getRow(4).values = HEADERS;

      const headerRow = sheet.getRow(4);
      headerRow.height = 32;

      headerRow.eachCell((cell) => {
        cell.font = {
          bold: true,
          color: { argb: "FFFFFFFF" },
          size: 10,
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF087E8B" },
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };

        cell.border = {
          top: {
            style: "thin",
            color: { argb: "FFCBD5E1" },
          },
          bottom: {
            style: "thin",
            color: { argb: "FFCBD5E1" },
          },
          left: {
            style: "thin",
            color: { argb: "FFCBD5E1" },
          },
          right: {
            style: "thin",
            color: { argb: "FFCBD5E1" },
          },
        };
      });

      // Report data
      const rows = getRows(data.report || []);

      rows.forEach((values, index) => {
        const row = sheet.addRow(values);

        row.height = 25;

        row.eachCell((cell) => {
          cell.font = {
            size: 10,
            color: { argb: "FF1E293B" },
          };

          cell.alignment = {
            vertical: "middle",
            wrapText: true,
          };

          cell.border = {
            bottom: {
              style: "hair",
              color: { argb: "FFE2E8F0" },
            },
          };

          if (index % 2 === 1) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF1F5F9" },
            };
          }
        });
      });

      // Excel filters
      sheet.autoFilter = {
        from: "A4",
        to: "I4",
      };

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        `NPD_Inventory_Report_${getFileDate()}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel Export Error:", err);
      setError(err.message || "Excel download failed.");
    } finally {
      setLoading("");
    }
  }

  async function downloadPDF() {
    try {
      setLoading("pdf");
      setError("");

      const data = await getReport();
      const rows = getRows(data.report || []);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a3",
      });

      doc.setFontSize(17);
      doc.setTextColor(15, 39, 66);

      doc.text(
        "NPD ROOM - INVENTORY REPORT",
        14,
        15
      );

      doc.setFontSize(9);
      doc.setTextColor(90, 100, 115);

      doc.text(getPeriodLabel(data), 14, 22);

      doc.text(
        `Generated: ${new Date().toLocaleString("en-IN")}`,
        14,
        27
      );

      autoTable(doc, {
        startY: 33,
        head: [HEADERS],
        body: rows,
        theme: "grid",

        styles: {
          fontSize: 7,
          cellPadding: 3,
          overflow: "linebreak",
          valign: "middle",
          lineColor: [220, 228, 238],
          lineWidth: 0.15,
        },

        headStyles: {
          fillColor: [8, 126, 139],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },

        alternateRowStyles: {
          fillColor: [241, 245, 249],
        },

        columnStyles: {
          0: { cellWidth: 39 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 38 },
          4: { cellWidth: 30 },
          5: { cellWidth: 29 },
          6: { cellWidth: 55 },
          7: { cellWidth: 25 },
          8: { cellWidth: 29 },
        },

        margin: {
          left: 14,
          right: 14,
        },

        didDrawPage: () => {
          const pageHeight =
            doc.internal.pageSize.height;

          const pageWidth =
            doc.internal.pageSize.width;

          doc.setFontSize(8);
          doc.setTextColor(120, 130, 145);

          doc.text(
            `NPD Room Inventory | Page ${doc.internal.getNumberOfPages()}`,
            pageWidth - 14,
            pageHeight - 7,
            { align: "right" }
          );
        },
      });

      doc.save(
        `NPD_Inventory_Report_${getFileDate()}.pdf`
      );
    } catch (err) {
      console.error("PDF Export Error:", err);
      setError(err.message || "PDF download failed.");
    } finally {
      setLoading("");
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
          <Download size={21} />
        </div>

        <div>
          <h2 className="font-semibold text-white">
            Inventory Report Export
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Download current stock report in Excel or PDF.
          </p>
        </div>
      </div>

      {/* Period selection */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { value: "today", label: "Today" },
          { value: "month", label: "This Month" },
          {
            value: "custom",
            label: "Custom Date Range",
          },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setPeriod(option.value)}
            className={`rounded-xl border px-3 py-3 text-sm transition ${
              period === option.value
                ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-200"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Custom dates */}
      {period === "custom" && (
        <div className="grid gap-3 sm:grid-cols-2">

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs text-slate-400">
              <CalendarDays size={14} />
              From Date
            </label>

            <input
              type="date"
              value={from}
              max={to || undefined}
              disabled={!dateReady}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs text-slate-400">
              <CalendarDays size={14} />
              To Date
            </label>

            <input
              type="date"
              value={to}
              min={from || undefined}
              disabled={!dateReady}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
            />
          </div>

        </div>
      )}

      {/* Download buttons */}
      <div className="grid gap-3 sm:grid-cols-2">

        <button
          type="button"
          onClick={downloadExcel}
          disabled={!!loading || !dateReady}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "excel" ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <FileSpreadsheet size={18} />
          )}

          {loading === "excel"
            ? "Preparing Excel..."
            : "Download Excel"}
        </button>

        <button
          type="button"
          onClick={downloadPDF}
          disabled={!!loading || !dateReady}
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "pdf" ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <FileText size={18} />
          )}

          {loading === "pdf"
            ? "Preparing PDF..."
            : "Download PDF"}
        </button>

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <p className="text-xs leading-5 text-slate-500">
        Both files use the same 9 columns. Opening stock is
        calculated separately for today and the current month.
        Received and Issue To quantities follow the selected
        period.
      </p>

    </section>
  );
}
