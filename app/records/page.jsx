
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  RefreshCw,
  PackageCheck,
  PackageMinus,
  CalendarDays,
  Filter,
  X,
  Eye,
  XCircle,
} from "lucide-react";
import InventoryReportExport from "@/components/InventoryReportExport";

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState("");

  async function fetchRecords(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const params = new URLSearchParams();

      if (type !== "ALL") params.set("type", type);
      if (search.trim()) params.set("search", search.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(
        `/api/records?${params.toString()}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load records");
      }

      setRecords(data.records || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchRecords();
  }, [type, from, to]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const stats = useMemo(() => {
    return records.reduce(
      (result, record) => {
        if (record.transactionType === "RECEIVED") {
          result.received += 1;
          result.receivedQty += record.quantity || 0;
        }

        if (record.transactionType === "ISSUE") {
          result.issued += 1;
          result.issuedQty += record.quantity || 0;
        }

        return result;
      },
      {
        received: 0,
        issued: 0,
        receivedQty: 0,
        issuedQty: 0,
      }
    );
  }, [records]);

  function clearFilters() {
    setSearch("");
    setType("ALL");
    setFrom("");
    setTo("");
  }

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(date) {
    if (!date) return "";

    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-[#080d19] px-4 pb-32 pt-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
<InventoryReportExport />
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-cyan-300">
              <ClipboardList size={16} />
              NPD INVENTORY
            </div>

            <h1 className="text-3xl font-bold sm:text-4xl">
              Transaction Records
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Complete history of received and issued parts.
            </p>
          </div>

          <button
            onClick={() => fetchRecords(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Received Entries"
            value={stats.received}
            icon={PackageCheck}
            color="text-emerald-300"
          />
          <StatCard
            label="Issue Entries"
            value={stats.issued}
            icon={PackageMinus}
            color="text-orange-300"
          />
          <StatCard
            label="Received Quantity"
            value={stats.receivedQty}
            icon={PackageCheck}
            color="text-cyan-300"
          />
          <StatCard
            label="Issued Quantity"
            value={stats.issuedQty}
            icon={PackageMinus}
            color="text-purple-300"
          />
        </div>

        {/* Filters */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
          <div className="flex items-center gap-2">
            <Filter size={17} className="text-cyan-300" />
            <h2 className="font-semibold">Search & Filters</h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search part, SAP, customer, supplier..."
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] py-3 pl-10 pr-4 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
              />
            </div>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              <option value="ALL">All Transactions</option>
              <option value="RECEIVED">Received Only</option>
              <option value="ISSUE">Issue Only</option>
            </select>

            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10"
            >
              <X size={16} />
              Clear Filters
            </button>
          </div>

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
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
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
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
              />
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
            <button
              onClick={() => fetchRecords()}
              className="ml-3 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Records */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-5">
            <div>
              <h2 className="font-semibold">All Transactions</h2>
              <p className="mt-1 text-xs text-slate-400">
                {loading ? "Loading..." : `${records.length} records found`}
              </p>
            </div>
            <ClipboardList size={21} className="text-slate-500" />
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">
              Loading transaction history...
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList
                size={35}
                className="mx-auto text-slate-600"
              />
              <p className="mt-3 font-medium text-slate-300">
                No records found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or date filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {records.map((record) => {
                const isReceived =
                  record.transactionType === "RECEIVED";

                const part = record.part || {};

                const destination = isReceived
                  ? record.supplierName || "Supplier not specified"
                  : record.recipientName ||
                    record.departmentName ||
                    "Destination not specified";

                return (
                  <div
                    key={record._id}
                    className="flex flex-col gap-4 p-4 transition hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      {part.partImage ? (
                        <img
                          src={part.partImage}
                          alt={part.partName || "Part"}
                          className="h-12 w-12 shrink-0 rounded-xl border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-500">
                          {isReceived ? (
                            <PackageCheck size={21} />
                          ) : (
                            <PackageMinus size={21} />
                          )}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-100">
                            {part.partName || "Part unavailable"}
                          </p>

                          <TransactionBadge received={isReceived} />
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          {part.partNumber || "—"} · SAP: {part.sapCode || "—"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {part.customerName || "—"}
                          {part.projectName ? ` / ${part.projectName}` : ""}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {isReceived ? "Supplier" : "Destination"}:{" "}
                          <span className="text-slate-200">
                            {destination}
                          </span>
                        </p>

                        {!isReceived && record.projectName && (
                          <p className="mt-1 text-xs text-slate-500">
                            Trial / Project: {record.projectName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div>
                        <p
                          className={`text-lg font-bold tabular-nums ${
                            isReceived
                              ? "text-emerald-300"
                              : "text-orange-300"
                          }`}
                        >
                          {isReceived ? "+" : "-"}
                          {record.quantity} {part.unit || "NOS"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(record.transactionDate)}
                          {" · "}
                          {formatTime(record.transactionDate)}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
                        title="View details"
                      >
                        <Eye size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#111a2b] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Transaction Details</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Complete entry information
                </p>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <XCircle size={21} />
              </button>
            </div>

            <div className="mt-5">
              <TransactionBadge
                received={
                  selectedRecord.transactionType === "RECEIVED"
                }
              />
            </div>

            <div className="mt-5 space-y-3">
              <Detail
                label="Part Name"
                value={selectedRecord.part?.partName}
              />
              <Detail
                label="Part Number"
                value={selectedRecord.part?.partNumber}
              />
              <Detail
                label="SAP Code"
                value={selectedRecord.part?.sapCode}
              />
              <Detail
                label="Customer"
                value={selectedRecord.part?.customerName}
              />
              <Detail
                label="Part Project"
                value={selectedRecord.part?.projectName}
              />
              <Detail
                label="Transaction Quantity"
                value={`${selectedRecord.quantity} ${selectedRecord.part?.unit || "NOS"}`}
              />
              <Detail
                label="Transaction Date"
                value={formatDate(selectedRecord.transactionDate)}
              />

              {selectedRecord.transactionType === "RECEIVED" ? (
                <Detail
                  label="Supplier"
                  value={selectedRecord.supplierName}
                />
              ) : (
                <>
                  <Detail
                    label="Destination Type"
                    value={selectedRecord.recipientType}
                  />
                  <Detail
                    label="Recipient"
                    value={selectedRecord.recipientName || selectedRecord.departmentName}
                  />
                  <Detail
                    label="Trial / Project"
                    value={selectedRecord.projectName}
                  />
                  <Detail
                    label="Purpose"
                    value={selectedRecord.purpose}
                  />
                </>
              )}

              <Detail label="Remarks" value={selectedRecord.remarks} />
            </div>

            <button
              onClick={() => setSelectedRecord(null)}
              className="mt-6 w-full rounded-xl bg-cyan-500 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${color}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-2xl font-bold tabular-nums">
        {value.toLocaleString("en-IN")}
      </p>
      <p className="mt-1 text-xs text-slate-400 sm:text-sm">{label}</p>
    </div>
  );
}

function TransactionBadge({ received }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
        received
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
          : "border-orange-400/20 bg-orange-500/10 text-orange-300"
      }`}
    >
      {received ? "RECEIVED" : "ISSUE"}
    </span>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="max-w-[65%] break-words text-right text-sm text-slate-200">
        {value || "—"}
      </span>
    </div>
  );
}
