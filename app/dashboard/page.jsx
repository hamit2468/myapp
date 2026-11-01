
"use client";

import { useCallback, useEffect, useState } from "react";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Dashboard loading failed");
      }

      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080d19] p-6 text-white">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-white/10" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 rounded-3xl bg-white/5"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080d19] p-6 text-white">
        <div className="max-w-md rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <p className="text-lg font-semibold">Dashboard Error</p>
          <p className="mt-2 text-sm text-slate-400">{error}</p>

          <button
            onClick={() => {
              setLoading(true);
              loadDashboard();
            }}
            className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const stats = dashboard?.stats || {};

  return (
    <main className="min-h-screen bg-[#080d19] px-4 py-7 pb-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
              NPD ROOM INVENTORY
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Inventory overview and stock performance.
            </p>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              loadDashboard();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10"
          >
            <span>↻</span>
            Refresh Data
          </button>
        </div>

        {/* Main Stats */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Inventory Overview</h2>
            <p className="mt-1 text-xs text-slate-500">
              Current inventory statistics
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Registered Parts"
              value={stats.totalParts}
              subtitle="Unique active parts"
              icon="▦"
              accent="cyan"
            />

            <StatCard
              title="Total Received"
              value={stats.totalReceived}
              subtitle={`${stats.receivedTransactions || 0} transactions`}
              icon="↓"
              accent="emerald"
            />

            <StatCard
              title="Total Issued"
              value={stats.totalIssued}
              subtitle={`${stats.issuedTransactions || 0} transactions`}
              icon="↑"
              accent="orange"
            />

            <StatCard
              title="Available Stock"
              value={stats.availableStock}
              subtitle="Received minus issued"
              icon="◈"
              accent="purple"
            />
          </div>
        </section>

        {/* Stock Alert */}
        <section className="rounded-3xl border border-orange-400/20 bg-gradient-to-r from-orange-400/[0.09] to-transparent p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-400/10 text-2xl text-orange-300">
                !
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  Low Stock Alert
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Parts that have reached their reorder level.
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-3xl font-bold text-orange-300">
                {stats.lowStockCount || 0}
              </p>
              <p className="text-xs text-slate-500">Parts need attention</p>
            </div>
          </div>
        </section>

        {/* Middle Section */}
        <div className="grid gap-6 xl:grid-cols-2">

          {/* Customer Overview */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Customer-wise Overview
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Registered parts by customer
              </p>
            </div>

            {dashboard.customerOverview?.length ? (
              <div className="space-y-5">
                {dashboard.customerOverview.map((customer) => {
                  const percentage = stats.totalParts
                    ? (customer.partCount / stats.totalParts) * 100
                    : 0;

                  return (
                    <div key={customer.customerName}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {customer.customerName}
                        </p>

                        <p className="shrink-0 text-sm text-cyan-300">
                          {customer.partCount} Parts
                        </p>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-cyan-400 transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState text="No customer data available yet." />
            )}
          </section>

          {/* Low Stock Parts */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Low Stock Parts</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Reorder attention required
                </p>
              </div>

              <span className="rounded-full bg-orange-400/10 px-3 py-1 text-xs font-medium text-orange-300">
                {dashboard.lowStockParts?.length || 0} Parts
              </span>
            </div>

            {dashboard.lowStockParts?.length ? (
              <div className="space-y-3">
                {dashboard.lowStockParts.slice(0, 5).map((part) => (
                  <div
                    key={part._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {part.partName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {part.partNumber} · {part.customerName}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-orange-300">
                        {part.availableStock} {part.unit}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Reorder: {part.reorderLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No low stock parts. Everything looks good!" />
            )}
          </section>
        </div>

        {/* Recent Transactions */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest 8 inventory activities
              </p>
            </div>

            <a
              href="/records"
              className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
            >
              View All →
            </a>
          </div>

          {dashboard.recentTransactions?.length ? (
            <div className="space-y-3">
              {dashboard.recentTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                        transaction.transactionType === "RECEIVED"
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-orange-400/10 text-orange-300"
                      }`}
                    >
                      {transaction.transactionType === "RECEIVED" ? "↓" : "↑"}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {transaction.part?.partName || "Part unavailable"}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {transaction.part?.partNumber || "—"} ·{" "}
                        {transaction.part?.customerName || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        transaction.transactionType === "RECEIVED"
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-orange-400/10 text-orange-300"
                      }`}
                    >
                      {transaction.transactionType}
                    </span>

                    <p className="min-w-16 text-right text-sm font-semibold text-white">
                      {transaction.quantity}{" "}
                      {transaction.part?.unit || "NOS"}
                    </p>

                    <p className="min-w-24 text-right text-xs text-slate-500">
                      {new Date(transaction.transactionDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No transactions available yet." />
          )}
        </section>

        <p className="pb-3 text-center text-xs text-slate-600">
          NPD Room Inventory Management System
        </p>
      </div>
    </main>
  );
}

function StatCard({ title, value, subtitle, icon, accent }) {
  const styles = {
    cyan: "bg-cyan-400/10 text-cyan-300 border-cyan-400/10",
    emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-400/10",
    orange: "bg-orange-400/10 text-orange-300 border-orange-400/10",
    purple: "bg-purple-400/10 text-purple-300 border-purple-400/10",
  };

  return (
    <div className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-xl ${styles[accent]}`}
        >
          {icon}
        </div>
      </div>

      <h3 className="mt-5 text-3xl font-bold tracking-tight text-white">
        {Number(value || 0).toLocaleString("en-IN")}
      </h3>

      <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 py-9 text-center">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
