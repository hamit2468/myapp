
"use client";

import { useEffect, useState } from "react";
import {
  PackagePlus,
  Boxes,
  CalendarDays,
  Truck,
  ClipboardList,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";

const initialForm = {
  partId: "",
  quantity: "",
  transactionDate: new Date().toISOString().split("T")[0],
  supplierName: "",
  remarks: "",
};

export default function Received() {
  const [parts, setParts] = useState([]);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const selectedPart = parts.find(
    (part) => part._id === form.partId
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [partsResponse, recordsResponse] = await Promise.all([
        fetch("/api/parts"),
        fetch("/api/received"),
      ]);

      const partsData = await partsResponse.json();
      const recordsData = await recordsResponse.json();

      if (!partsResponse.ok || !partsData.success) {
        throw new Error(partsData.message || "Failed to load parts");
      }

      if (!recordsResponse.ok || !recordsData.success) {
        throw new Error(
          recordsData.message || "Failed to load received records"
        );
      }

      setParts(partsData.parts || []);
      setRecords(recordsData.records || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "partId"
        ? {
            supplierName:
              parts.find((part) => part._id === value)?.supplierName || "",
          }
        : {}),
    }));

    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!form.partId) {
      setError("Please select a part.");
      return;
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/received", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save received entry");
      }

      setMessage("Received entry saved successfully!");

      setForm({
        ...initialForm,
        transactionDate: new Date().toISOString().split("T")[0],
      });

      await fetchData();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = records.filter((record) => {
    const part = record.part || {};

    const searchText = [
      part.partName,
      part.partNumber,
      part.sapCode,
      record.supplierName,
      record.remarks,
    ]
      .join(" ")
      .toLowerCase();

    return searchText.includes(search.toLowerCase());
  });

  const totalReceived = records.reduce(
    (total, record) => total + Number(record.quantity || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#080d1b] px-4 pb-32 pt-8 text-white sm:px-6 lg:px-8">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-purple-600/15 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-7">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-300">
              <PackagePlus size={17} />
              NPD INVENTORY MANAGEMENT
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Received Parts
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage incoming parts and maintain your stock records.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur-xl transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh Data
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Registered Parts</p>
              <Boxes className="text-blue-400" />
            </div>
            <h2 className="mt-4 text-3xl font-bold">
              {loading ? "—" : parts.length}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Active parts in database</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Received Entries</p>
              <ClipboardList className="text-purple-400" />
            </div>
            <h2 className="mt-4 text-3xl font-bold">
              {loading ? "—" : records.length}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Total transactions</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Total Received</p>
              <PackagePlus className="text-emerald-400" />
            </div>
            <h2 className="mt-4 text-3xl font-bold">
              {loading ? "—" : totalReceived.toLocaleString()}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Quantity across all units
            </p>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 size={19} />
            {message}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {/* Received Form */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
          <div className="mb-7 flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/15 p-3 text-blue-400">
              <PackagePlus size={23} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">New Received Entry</h2>
              <p className="text-sm text-slate-400">
                Enter details of the incoming part.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Part Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Select Part <span className="text-red-400">*</span>
              </label>

              <select
                name="partId"
                value={form.partId}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-white/10 bg-[#111a2d] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400"
              >
                <option value="">Choose a part...</option>
                {parts.map((part) => (
                  <option key={part._id} value={part._id}>
                    {part.partName} — {part.partNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Part Preview */}
            {selectedPart && (
              <div className="grid gap-5 rounded-2xl border border-blue-400/20 bg-blue-500/[0.07] p-4 sm:grid-cols-[110px_1fr]">
                <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {selectedPart.partImage ? (
                    <img
                      src={selectedPart.partImage}
                      alt={selectedPart.partName}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ImageIcon size={30} className="text-slate-500" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {[
                    ["Part Name", selectedPart.partName],
                    ["Part Number", selectedPart.partNumber],
                    ["SAP Code", selectedPart.sapCode],
                    ["Customer", selectedPart.customerName],
                    ["Project", selectedPart.projectName],
                    ["Unit", selectedPart.unit],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 break-words text-sm font-medium text-slate-200">
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Received Quantity <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  required
                  placeholder="Enter quantity"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                  <CalendarDays size={15} />
                  Received Date
                </label>
                <input
                  type="date"
                  name="transactionDate"
                  value={form.transactionDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                  <Truck size={15} />
                  Supplier Name
                </label>
                <input
                  type="text"
                  name="supplierName"
                  value={form.supplierName}
                  onChange={handleChange}
                  placeholder="Enter supplier name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400"
                />
              </div>

            </div>

            {/* Remarks */}
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows={3}
                placeholder="Enter additional information..."
                className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400"
              />
            </div>

            {/* Submit */}
            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    ...initialForm,
                    transactionDate: new Date().toISOString().split("T")[0],
                  });
                  setMessage("");
                  setError("");
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10"
              >
                Clear Form
              </button>

              <button
                type="submit"
                disabled={saving || loading || parts.length === 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <PackagePlus size={18} />
                    Save Received Entry
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Recent Records */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">Recent Received Records</h2>
              <p className="mt-1 text-sm text-slate-400">
                History of incoming parts.
              </p>
            </div>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search records..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400 sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-4">Part Details</th>
                  <th className="px-4 py-4">SAP Code</th>
                  <th className="px-4 py-4">Supplier</th>
                  <th className="px-4 py-4">Quantity</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Remarks</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      Loading records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      No received records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr
                      key={record._id}
                      className="border-b border-white/[0.06] transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium text-white">
                          {record.part?.partName || "Part unavailable"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {record.part?.partNumber || "—"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {record.part?.sapCode || "—"}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {record.supplierName || "—"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 font-semibold text-emerald-300">
                          +{record.quantity} {record.part?.unit || ""}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-300">
                        {record.transactionDate
                          ? new Date(record.transactionDate).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="max-w-48 truncate px-4 py-4 text-slate-400">
                        {record.remarks || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4 text-xs text-slate-500">
            Showing {filteredRecords.length} of {records.length} records
          </div>
        </section>

      </div>
    </main>
  );
}
