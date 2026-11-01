
"use client";

import { useEffect, useState } from "react";
import {
  PackageMinus,
  Boxes,
  ClipboardList,
  CalendarDays,
  Building2,
  FlaskConical,
  Users,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Package,
} from "lucide-react";

const CUSTOMERS = [
  "YAZAKI",
  "APTIV",
  "WEBASTO",
  "YAPP",
  "JOHN DEERE",
];

const DESTINATIONS = [
  {
    value: "IPC_DEPARTMENT",
    label: "IPC Department",
    icon: Building2,
  },
  {
    value: "LAB",
    label: "LAB",
    icon: FlaskConical,
  },
  {
    value: "CUSTOMER",
    label: "Customer",
    icon: Users,
  },
];

const initialForm = {
  partId: "",
  quantity: "",
  transactionDate: new Date().toISOString().split("T")[0],
  recipientType: "IPC_DEPARTMENT",
  recipientName: "",
  departmentName: "",
  projectName: "",
  purpose: "",
  remarks: "",
};

const recipientLabels = {
  IPC_DEPARTMENT: "IPC Department",
  LAB: "LAB",
  CUSTOMER: "Customer",
};

export default function IssuePage() {
  const [parts, setParts] = useState([]);
  const [receivedRecords, setReceivedRecords] = useState([]);
  const [issueRecords, setIssueRecords] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Fetch all required data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [partsRes, receivedRes, issueRes] = await Promise.all([
        fetch("/api/parts"),
        fetch("/api/received"),
        fetch("/api/issue"),
      ]);

      const [partsData, receivedData, issueData] = await Promise.all([
        partsRes.json(),
        receivedRes.json(),
        issueRes.json(),
      ]);

      if (!partsRes.ok || !partsData.success) {
        throw new Error(partsData.message || "Failed to load parts");
      }

      if (!receivedRes.ok || !receivedData.success) {
        throw new Error(
          receivedData.message || "Failed to load received records"
        );
      }

      if (!issueRes.ok || !issueData.success) {
        throw new Error(
          issueData.message || "Failed to load issue records"
        );
      }

      setParts(partsData.parts || []);
      setReceivedRecords(receivedData.records || []);
      setIssueRecords(issueData.records || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate available stock for a part
  const getPartStock = (partId) => {
    const received = receivedRecords
      .filter((record) => {
        const id = record.part?._id || record.part;
        return String(id) === String(partId);
      })
      .reduce(
        (total, record) => total + Number(record.quantity || 0),
        0
      );

    const issued = issueRecords
      .filter((record) => {
        const id = record.part?._id || record.part;
        return String(id) === String(partId);
      })
      .reduce(
        (total, record) => total + Number(record.quantity || 0),
        0
      );

    return {
      received,
      issued,
      available: received - issued,
    };
  };

  const selectedPart = parts.find(
    (part) => part._id === form.partId
  );

  const selectedStock = selectedPart
    ? getPartStock(selectedPart._id)
    : null;

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // Change issue destination
  const handleDestinationChange = (destination) => {
    setForm((prev) => ({
      ...prev,
      recipientType: destination,
      recipientName: "",
      departmentName: "",
      projectName: "",
    }));

    setMessage("");
    setError("");
  };

  // Submit issue entry
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!form.partId) {
      setError("Please select a part.");
      return;
    }

    const issueQuantity = Number(form.quantity);

    if (
      !Number.isSafeInteger(issueQuantity) ||
      issueQuantity <= 0
    ) {
      setError("Please enter a valid whole number quantity.");
      return;
    }

    if (!selectedStock || selectedStock.available <= 0) {
      setError("This part has no available stock.");
      return;
    }

    if (issueQuantity > selectedStock.available) {
      setError(
        `Insufficient stock! Only ${selectedStock.available} ${selectedPart.unit} available.`
      );
      return;
    }

    if (
      form.recipientType === "CUSTOMER" &&
      !form.recipientName
    ) {
      setError("Please select a customer.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          quantity: issueQuantity,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to issue part");
      }

      setMessage(
        `Part issued successfully! Remaining stock: ${data.availableStockAfterIssue} ${selectedPart.unit}`
      );

      setForm({
        ...initialForm,
        transactionDate: new Date().toISOString().split("T")[0],
      });

      await fetchData();
    } catch (err) {
      setError(err.message || "Something went wrong");
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  // Search records
  const filteredRecords = issueRecords.filter((record) => {
    const part = record.part || {};

    const recipient =
      record.recipientName ||
      record.departmentName ||
      "";

    const searchText = [
      part.partName,
      part.partNumber,
      part.sapCode,
      recipient,
      record.projectName,
      record.purpose,
      record.remarks,
    ]
      .join(" ")
      .toLowerCase();

    return searchText.includes(search.toLowerCase());
  });

  const totalIssued = issueRecords.reduce(
    (total, record) => total + Number(record.quantity || 0),
    0
  );

  const totalAvailable = parts.reduce(
    (total, part) => total + getPartStock(part._id).available,
    0
  );

  return (
    <main className="min-h-screen bg-[#080d1b] px-4 pb-32 pt-8 text-white sm:px-6 lg:px-8">

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-blue-600/15 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-7">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-purple-300">
              <PackageMinus size={17} />
              NPD INVENTORY MANAGEMENT
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Issue Parts
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Issue parts to IPC Department, LAB and customers.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur-xl transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
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

            <p className="mt-1 text-xs text-slate-500">
              Active parts
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Total Issued</p>
              <PackageMinus className="text-purple-400" />
            </div>

            <h2 className="mt-4 text-3xl font-bold">
              {loading ? "—" : totalIssued.toLocaleString()}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Quantity across all units
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Total Available</p>
              <Package className="text-emerald-400" />
            </div>

            <h2 className="mt-4 text-3xl font-bold">
              {loading ? "—" : totalAvailable.toLocaleString()}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Calculated from transactions
            </p>
          </div>
        </div>

        {/* Success message */}
        {message && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 size={19} />
            {message}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {/* Issue Form */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7">

          <div className="mb-7 flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/15 p-3 text-purple-400">
              <PackageMinus size={23} />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                New Issue Entry
              </h2>

              <p className="text-sm text-slate-400">
                Select a part and enter issue details.
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
                className="w-full rounded-xl border border-white/10 bg-[#111a2d] px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
              >
                <option value="">Choose a part...</option>

                {parts.map((part) => {
                  const stock = getPartStock(part._id);

                  return (
                    <option key={part._id} value={part._id}>
                      {part.partName} — {part.partNumber} | Stock: {stock.available}
                    </option>
                  );
                })}
              </select>

              {!loading && parts.length === 0 && (
                <p className="mt-2 text-xs text-amber-300">
                  No active parts found. Add a part from the Stock page first.
                </p>
              )}
            </div>

            {/* Selected Part Details */}
            {selectedPart && (
              <div className="grid gap-5 rounded-2xl border border-purple-400/20 bg-purple-500/[0.07] p-4 sm:grid-cols-[110px_1fr]">

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

            {/* Stock Information */}
            {selectedPart && selectedStock && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4">
                  <p className="text-xs text-blue-300">Total Received</p>
                  <p className="mt-2 text-2xl font-bold">
                    {selectedStock.received} {selectedPart.unit}
                  </p>
                </div>

                <div className="rounded-xl border border-purple-400/20 bg-purple-500/10 p-4">
                  <p className="text-xs text-purple-300">Total Issued</p>
                  <p className="mt-2 text-2xl font-bold">
                    {selectedStock.issued} {selectedPart.unit}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <p className="text-xs text-emerald-300">Available Stock</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-300">
                    {selectedStock.available} {selectedPart.unit}
                  </p>
                </div>

              </div>
            )}

            {/* Quantity and Date */}
            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Issue Quantity <span className="text-red-400">*</span>
                </label>

                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  min="1"
                  max={selectedStock?.available || undefined}
                  step="1"
                  required
                  placeholder="Enter issue quantity"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-400"
                />

                {selectedStock && (
                  <p className="mt-2 text-xs text-slate-500">
                    Maximum available: {selectedStock.available} {selectedPart.unit}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                  <CalendarDays size={15} />
                  Issue Date
                </label>

                <input
                  type="date"
                  name="transactionDate"
                  value={form.transactionDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
                />
              </div>

            </div>

            {/* Issue Destination */}
            <div>
              <label className="mb-3 block text-sm font-medium text-slate-300">
                Issue To <span className="text-red-400">*</span>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {DESTINATIONS.map((item) => {
                  const Icon = item.icon;
                  const active = form.recipientType === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleDestinationChange(item.value)}
                      className={`flex items-center justify-center gap-3 rounded-xl border p-4 text-sm font-medium transition ${
                        active
                          ? "border-purple-400/50 bg-purple-500/15 text-purple-300"
                          : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      <Icon size={19} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Dropdown */}
            {form.recipientType === "CUSTOMER" && (
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Select Customer <span className="text-red-400">*</span>
                </label>

                <select
                  name="recipientName"
                  value={form.recipientName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#111a2d] px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
                >
                  <option value="">Choose customer...</option>

                  {CUSTOMERS.map((customer) => (
                    <option key={customer} value={customer}>
                      {customer}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Destination Information */}
            {(form.recipientType === "IPC_DEPARTMENT" ||
              form.recipientType === "LAB") && (
              <div className="rounded-xl border border-purple-400/20 bg-purple-500/10 p-4">
                <p className="text-sm text-slate-400">
                  Selected destination
                </p>

                <p className="mt-1 font-semibold text-purple-300">
                  {form.recipientType === "IPC_DEPARTMENT"
                    ? "IPC Department"
                    : "LAB"}
                </p>
              </div>
            )}

            {/* Customer Project */}
            {form.recipientType === "CUSTOMER" && (
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Customer Project / Trial (Optional)
                </label>

                <input
                  type="text"
                  name="projectName"
                  value={form.projectName}
                  onChange={handleChange}
                  placeholder="Enter customer project or trial name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-400"
                />
              </div>
            )}

            {/* Purpose */}
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Purpose
              </label>

              <input
                type="text"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                placeholder="Example: NPD Trial, Testing, Sample Development"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-400"
              />
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
                className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-400"
              />
            </div>

            {/* Submit buttons */}
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
                disabled={
                  saving ||
                  loading ||
                  !selectedPart ||
                  !selectedStock ||
                  selectedStock.available <= 0
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PackageMinus size={18} />
                    Issue Part
                  </>
                )}
              </button>

            </div>
          </form>
        </section>

        {/* Recent Issue Records */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7">

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">
                Recent Issue Records
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                History of issued parts.
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
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-400 sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-4">Part Details</th>
                  <th className="px-4 py-4">SAP Code</th>
                  <th className="px-4 py-4">Issue To</th>
                  <th className="px-4 py-4">Project / Trial</th>
                  <th className="px-4 py-4">Purpose</th>
                  <th className="px-4 py-4">Quantity</th>
                  <th className="px-4 py-4">Date</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      Loading records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No issue records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const recipient =
                      record.recipientName ||
                      record.departmentName ||
                      "—";

                    return (
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

                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-200">
                            {recipient}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {recipientLabels[record.recipientType] || record.recipientType || "—"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-slate-300">
                          {record.projectName || "—"}
                        </td>

                        <td className="px-4 py-4 text-slate-400">
                          {record.purpose || "—"}
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-1.5 font-semibold text-red-300">
                            -{record.quantity} {record.part?.unit || ""}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-300">
                          {record.transactionDate
                            ? new Date(record.transactionDate).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4 text-xs text-slate-500">
            Showing {filteredRecords.length} of {issueRecords.length} records
          </div>
        </section>

      </div>
    </main>
  );
}
