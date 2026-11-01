
"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [customers, setCustomers] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [showInactive, setShowInactive] = useState(false);
  const [activeSection, setActiveSection] = useState("customers");

  async function loadCustomers() {
    try {
      setLoading(true);

      const response = await fetch("/api/customers", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load customers");
      }

      setCustomers(data.customers || []);
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function showMessage(text, type = "success") {
    setMessage(text);
    setMessageType(type);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!customerName.trim()) {
      showMessage("Please enter customer name.", "error");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const isEditing = Boolean(editingId);

      const response = await fetch("/api/customers", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing
            ? { id: editingId, name: customerName }
            : { name: customerName }
        ),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Something went wrong");
      }

      setCustomerName("");
      setEditingId(null);

      showMessage(
        isEditing
          ? "Customer updated successfully."
          : "Customer added successfully."
      );

      await loadCustomers();
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(customer) {
    setEditingId(customer._id);
    setCustomerName(customer.name);
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setCustomerName("");
    setMessage("");
  }

  async function toggleCustomer(customer) {
    const action = customer.isActive ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${customer.name}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/customers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: customer._id,
          isActive: !customer.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update customer");
      }

      showMessage(`Customer ${action}d successfully.`);
      await loadCustomers();
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  const activeCustomers = customers.filter((c) => c.isActive);
  const inactiveCustomers = customers.filter((c) => !c.isActive);

  const visibleCustomers = showInactive
    ? customers
    : activeCustomers;

  return (
    <main className="min-h-screen bg-[#080d19] px-4 py-7 pb-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              NPD INVENTORY SYSTEM
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Settings
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage your application preferences and master data.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <span className="text-xl">⚙</span>
            <div>
              <p className="text-xs text-slate-500">System Status</p>
              <p className="text-sm font-medium text-emerald-300">
                Configuration Active
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Customers"
            value={customers.length}
            icon="▦"
            color="cyan"
          />

          <StatCard
            title="Active Customers"
            value={activeCustomers.length}
            icon="✓"
            color="green"
          />

          <StatCard
            title="Inactive Customers"
            value={inactiveCustomers.length}
            icon="⊘"
            color="orange"
          />
        </div>

        {/* Main Layout */}
        <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">

          {/* Sidebar */}
          <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
            <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Settings Menu
            </p>

            <div className="space-y-2">
              <SidebarItem
                icon="♙"
                label="Customer Management"
                active={activeSection === "customers"}
                onClick={() => setActiveSection("customers")}
              />

              <SidebarItem
                icon="▤"
                label="Application Info"
                active={activeSection === "app"}
                onClick={() => setActiveSection("app")}
              />
            </div>

            <div className="mt-7 border-t border-white/10 pt-5">
              <div className="rounded-2xl bg-cyan-400/[0.07] p-4">
                <p className="text-xs font-semibold text-cyan-300">
                  NPD INVENTORY
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Manage your parts, customers and inventory configuration.
                </p>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0">

            {activeSection === "customers" && (
              <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">

                {/* Section Header */}
                <div className="border-b border-white/10 p-5 sm:p-7">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                        MASTER DATA
                      </div>

                      <h2 className="text-xl font-bold">
                        Customer Management
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        Manage customers available in the Issue section.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300">
                      {activeCustomers.length} Active
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-5 sm:p-7">

                  {/* Add Customer Form */}
                  <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.035] p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-xl text-cyan-300">
                        +
                      </div>

                      <div>
                        <h3 className="font-semibold">
                          {editingId ? "Edit Customer" : "Add New Customer"}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {editingId
                            ? "Update the selected customer name."
                            : "Register a new customer in your system."}
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                      <label className="mb-2 block text-xs font-medium text-slate-400">
                        CUSTOMER NAME
                      </label>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter customer name..."
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                        />

                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                        >
                          {saving
                            ? "Saving..."
                            : editingId
                              ? "Update Customer"
                              : "+ Add Customer"}
                        </button>

                        {editingId && (
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Feedback */}
                  {message && (
                    <div
                      className={`rounded-xl border px-4 py-3 text-sm ${messageType === "error"
                          ? "border-red-400/20 bg-red-400/10 text-red-300"
                          : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                        }`}
                    >
                      {message}
                    </div>
                  )}

                  {/* Customer List Header */}
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-semibold">Registered Customers</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {visibleCustomers.length} records found
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowInactive(!showInactive)}
                      className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
                    >
                      {showInactive
                        ? "Show Active Only"
                        : "Include Inactive"}
                    </button>
                  </div>

                  {/* Customer List */}
                  <div className="space-y-3">
                    {loading ? (
                      <div className="py-12 text-center text-sm text-slate-400">
                        Loading customers...
                      </div>
                    ) : visibleCustomers.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
                        <p className="text-3xl">♙</p>
                        <p className="mt-3 text-sm text-slate-400">
                          No customers found.
                        </p>
                      </div>
                    ) : (
                      visibleCustomers.map((customer, index) => (
                        <div
                          key={customer._id}
                          className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4 transition hover:border-white/15 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.08] text-sm font-bold text-cyan-300">
                              {String(index + 1).padStart(2, "0")}
                            </div>

                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-semibold text-white">
                                {customer.name}
                              </h4>
                              <p className="mt-1 text-xs text-slate-500">
                                Customer account
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${customer.isActive
                                  ? "bg-emerald-400/10 text-emerald-300"
                                  : "bg-red-400/10 text-red-300"
                                }`}
                            >
                              {customer.isActive ? "● Active" : "● Inactive"}
                            </span>

                            <button
                              type="button"
                              onClick={() => startEdit(customer)}
                              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCustomer(customer)}
                              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${customer.isActive
                                  ? "bg-red-400/10 text-red-300 hover:bg-red-400/20"
                                  : "bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                                }`}
                            >
                              {customer.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeSection === "app" && (
              <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl sm:p-7">
                <div className="mb-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    SYSTEM DETAILS
                  </p>
                  <h2 className="mt-2 text-xl font-bold">
                    Application Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Basic information about your inventory application.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoCard
                    label="Application Name"
                    value="NPD Room Inventory"
                    icon="▦"
                  />
                  <InfoCard
                    label="Department"
                    value="New Product Development"
                    icon="▤"
                  />
                  <InfoCard
                    label="Database"
                    value="MongoDB"
                    icon="◈"
                  />
                  <InfoCard
                    label="Image Storage"
                    value="Cloudinary"
                    icon="▧"
                  />
                  <InfoCard
                    label="Frontend"
                    value="Next.js"
                    icon="⌘"
                  />
                  <InfoCard
                    label="Styling"
                    value="Tailwind CSS"
                    icon="◉"
                  />
                </div>

                <div className="pt-5 text-center">
                  <p className="text-xs text-slate-500">
                    NPD Room Inventory Management System
                  </p>

                  <p className="mt-2 text-sm font-semibold tracking-wider text-cyan-400">
                    Website Built by HAMITDEV
                  </p>

                  <p className="mt-1 text-[10px] text-slate-600">
                    Designed & Developed with ❤️
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>

        <p className="pt-3 text-center text-xs text-slate-600">
          NPD Room Inventory Management System
        </p>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon, color }) {
  const styles = {
    cyan: "bg-cyan-400/10 text-cyan-300",
    green: "bg-emerald-400/10 text-emerald-300",
    orange: "bg-orange-400/10 text-orange-300",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:border-white/20">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${styles[color]}`}>
          {icon}
        </div>
      </div>

      <h3 className="mt-4 text-3xl font-bold text-white">
        {value.toLocaleString("en-IN")}
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        Customer accounts
      </p>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${active
          ? "border border-cyan-400/15 bg-cyan-400/10 font-semibold text-cyan-300"
          : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
        }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-lg text-cyan-300">
          {icon}
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">{value}</p>
        </div>
      </div>
    </div>
  );
}
