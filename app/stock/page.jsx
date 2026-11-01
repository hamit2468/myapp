
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Search,
  RefreshCw,
  Package,
  PackageCheck,
  PackageMinus,
  AlertTriangle,
  Plus,
  ArrowUpRight,
} from "lucide-react";

export default function StockPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");

  async function fetchStock(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/stock", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load stock");
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
    fetchStock();
  }, []);

  const stats = useMemo(() => {
    return records.reduce(
      (result, part) => {
        result.totalParts += 1;
        result.received += part.totalReceived || 0;
        result.issued += part.totalIssued || 0;
        result.available += part.availableStock || 0;

        if (part.isLowStock) {
          result.lowStock += 1;
        }

        return result;
      },
      {
        totalParts: 0,
        received: 0,
        issued: 0,
        available: 0,
        lowStock: 0,
      }
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((part) => {
      const matchesSearch =
        !query ||
        [
          part.partName,
          part.partNumber,
          part.sapCode,
          part.customerName,
          part.projectName,
          part.supplierName,
        ].some((value) => String(value || "").toLowerCase().includes(query));

      const matchesFilter =
        filter === "ALL" ||
        (filter === "LOW" && part.isLowStock) ||
        (filter === "AVAILABLE" && part.availableStock > 0) ||
        (filter === "OUT" && part.availableStock <= 0);

      return matchesSearch && matchesFilter;
    });
  }, [records, search, filter]);

  const statCards = [
    {
      label: "Registered Parts",
      value: stats.totalParts,
      icon: Boxes,
      color: "text-blue-300",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Received",
      value: stats.received,
      icon: PackageCheck,
      color: "text-emerald-300",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total Issued",
      value: stats.issued,
      icon: PackageMinus,
      color: "text-orange-300",
      bg: "bg-orange-500/10",
    },
    {
      label: "Available Stock",
      value: stats.available,
      icon: Package,
      color: "text-cyan-300",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <main className="min-h-screen bg-[#080d19] px-4 pb-32 pt-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-cyan-300">
              <Boxes size={16} />
              NPD INVENTORY
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Stock Overview
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Monitor received, issued and available parts stock.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchStock(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              href="/parts"
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Plus size={17} />
              Add New Part
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
            <button
              onClick={() => fetchStock()}
              className="ml-3 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
                  >
                    <Icon size={20} />
                  </div>
                  <ArrowUpRight size={17} className="text-slate-600" />
                </div>

                <p className="mt-4 text-2xl font-bold tabular-nums sm:text-3xl">
                  {loading ? "—" : stat.value.toLocaleString("en-IN")}
                </p>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Low stock alert */}
        {!loading && stats.lowStock > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
              <AlertTriangle size={20} />
            </div>

            <div>
              <p className="font-semibold text-amber-200">
                Low Stock Alert
              </p>
              <p className="text-sm text-amber-100/70">
                {stats.lowStock} part(s) are at or below their reorder level.
              </p>
            </div>
          </div>
        )}

        {/* Stock Table */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/10 backdrop-blur-xl">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-semibold">Part Stock Details</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {loading
                    ? "Loading stock records..."
                    : `${filteredRecords.length} of ${records.length} parts`}
                </p>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search part, SAP, customer..."
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                ["ALL", "All Parts"],
                ["AVAILABLE", "In Stock"],
                ["LOW", "Low Stock"],
                ["OUT", "Out of Stock"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                    filter === value
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">
              Loading stock data...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <Boxes size={35} className="mx-auto text-slate-600" />
              <p className="mt-3 font-medium text-slate-300">
                No stock records found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try another search or add a new part.
              </p>
              <Link
                href="/parts"
                className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200"
              >
                <Plus size={16} />
                Add New Part
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.035] text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Part Details</th>
                      <th className="px-4 py-4">Customer / Project</th>
                      <th className="px-4 py-4 text-right">Received</th>
                      <th className="px-4 py-4 text-right">Issued</th>
                      <th className="px-4 py-4 text-right">Available</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredRecords.map((part) => (
                      <tr
                        key={part._id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {part.partImage ? (
                              <img
                                src={part.partImage}
                                alt={part.partName}
                                className="h-11 w-11 rounded-xl border border-white/10 object-cover"
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-slate-500">
                                <Package size={19} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-100">
                                {part.partName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {part.partNumber} · SAP: {part.sapCode}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-slate-200">
                            {part.customerName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {part.projectName}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-right font-medium tabular-nums text-emerald-300">
                          {part.totalReceived} {part.unit}
                        </td>

                        <td className="px-4 py-4 text-right font-medium tabular-nums text-orange-300">
                          {part.totalIssued} {part.unit}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <span className="font-bold tabular-nums text-white">
                            {part.availableStock}
                          </span>
                          <span className="ml-1 text-xs text-slate-500">
                            {part.unit}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StockStatus part={part} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 p-3 md:hidden">
                {filteredRecords.map((part) => (
                  <div
                    key={part._id}
                    className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                  >
                    <div className="flex items-start gap-3">
                      {part.partImage ? (
                        <img
                          src={part.partImage}
                          alt={part.partName}
                          className="h-12 w-12 rounded-xl border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-slate-500">
                          <Package size={20} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">
                          {part.partName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {part.partNumber} · {part.sapCode}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {part.customerName} / {part.projectName}
                        </p>
                      </div>

                      <StockStatus part={part} />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">
                          Received
                        </p>
                        <p className="mt-1 text-sm font-semibold text-emerald-300">
                          {part.totalReceived}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase text-slate-500">
                          Issued
                        </p>
                        <p className="mt-1 text-sm font-semibold text-orange-300">
                          {part.totalIssued}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase text-slate-500">
                          Available
                        </p>
                        <p className="mt-1 text-sm font-bold text-white">
                          {part.availableStock} {part.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <p className="text-center text-xs text-slate-600">
          Stock balance is calculated from all received and issue transactions.
        </p>
      </div>
    </main>
  );
}

function StockStatus({ part }) {
  if (part.availableStock <= 0) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-300">
        Out of Stock
      </span>
    );
  }

  if (part.isLowStock) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex whitespace-nowrap rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
      In Stock
    </span>
  );
}
