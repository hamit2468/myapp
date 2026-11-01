
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PartCamera from "@/components/PartCamera";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none backdrop-blur-md transition focus:border-blue-400/60 focus:bg-white/[0.10] focus:ring-4 focus:ring-blue-500/10";

const labelClass = "mb-2 block text-sm font-medium text-slate-300";

const sectionClass =
  "rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10 backdrop-blur-2xl sm:p-7";

// Reusable input field
function Field({
  label,
  name,
  placeholder,
  required = false,
  type = "text",
  value,
  onChange,
  min,
  step,
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={name}>
        {label}
        {required && <span className="ml-1 text-blue-400">*</span>}
      </label>

      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        className={inputClass}
      />
    </div>
  );
}

// Reusable image upload and camera card
function ImageUploadCard({
  title,
  description,
  preview,
  file,
  inputId,
  onChange,
  onRemove,
  onCamera,
}) {
  return (
    <div>
      <label className={labelClass}>{title}</label>

      <p className="mb-3 text-xs text-slate-500">
        {description}
      </p>

      <label
        htmlFor={inputId}
        className="flex min-h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/15 bg-black/20 p-4 text-center transition hover:border-blue-400/50 hover:bg-blue-500/[0.06]"
      >
        {preview ? (
          <img
            src={preview}
            alt={title}
            className="h-48 w-full object-contain"
          />
        ) : (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-3xl">
              📷
            </div>

            <p className="font-medium text-slate-200">
              Click to upload
            </p>

            <p className="mt-2 text-xs text-slate-500">
              JPG, PNG · Maximum 5 MB
            </p>
          </>
        )}
      </label>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />

      <button
        type="button"
        onClick={onCamera}
        className="mt-3 w-full rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
      >
        📷 Open Camera
      </button>

      {preview && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs text-blue-300">
            ✓ {file?.name || "Camera photo"}
          </p>

          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-xs text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export default function AddPartPage() {
  const [images, setImages] = useState([null, null]);
  const [previews, setPreviews] = useState(["", ""]);

  const [activeCamera, setActiveCamera] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    projectName: "",
    sapCode: "",
    partName: "",
    partNumber: "",
    supplierName: "",
    cavities: "1",
    unit: "NOS",
    reorderLevel: "0",
  });

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [previews]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Handle uploaded or captured image
  function handleImageFile(index, file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image.");
      setMessageType("error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Each image must be under 5 MB.");
      setMessageType("error");
      return;
    }

    const newPreview = URL.createObjectURL(file);

    setPreviews((prev) => {
      const updated = [...prev];

      if (updated[index]) {
        URL.revokeObjectURL(updated[index]);
      }

      updated[index] = newPreview;
      return updated;
    });

    setImages((prev) => {
      const updated = [...prev];
      updated[index] = file;
      return updated;
    });

    setMessage("");
    setMessageType("");
  }

  // File input handler
  function handleImage(index, e) {
    const file = e.target.files?.[0];

    handleImageFile(index, file);

    e.target.value = "";
  }

  // Remove selected image
  function removeImage(index) {
    setImages((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });

    setPreviews((prev) => {
      const updated = [...prev];
      updated[index] = "";
      return updated;
    });

    const input = document.getElementById(`part-image-${index}`);

    if (input) input.value = "";
  }

  // Reset complete form
  function resetForm() {
    setForm({
      customerName: "",
      projectName: "",
      sapCode: "",
      partName: "",
      partNumber: "",
      supplierName: "",
      cavities: "1",
      unit: "NOS",
      reorderLevel: "0",
    });

    setImages([null, null]);
    setPreviews(["", ""]);

    [0, 1].forEach((index) => {
      const input = document.getElementById(`part-image-${index}`);
      if (input) input.value = "";
    });
  }

  // Upload image to Cloudinary
  async function uploadImage(file) {
    const imageData = new FormData();
    imageData.append("image", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: imageData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Image upload failed");
    }

    return {
      imageUrl: result.imageUrl,
      publicId: result.publicId,
    };
  }

  // Save part
  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    const cavityCount = Number(form.cavities);
    const reorderCount = Number(form.reorderLevel);

    if (
      !Number.isSafeInteger(cavityCount) ||
      cavityCount < 1
    ) {
      setMessage("Cavities must be a whole number greater than 0.");
      setMessageType("error");
      return;
    }

    if (
      !Number.isFinite(reorderCount) ||
      reorderCount < 0
    ) {
      setMessage("Reorder level must be zero or greater.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      // STEP 1: Upload selected images
      const uploadedImages = [];

      for (const file of images) {
        if (file) {
          const uploaded = await uploadImage(file);
          uploadedImages.push(uploaded);
        }
      }

      // STEP 2: Save part in MongoDB
      const response = await fetch("/api/parts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          sapCode: form.sapCode.trim(),
          cavities: cavityCount,
          reorderLevel: reorderCount,

          partImages: uploadedImages.map(
            (item) => item.imageUrl
          ),

          partImagePublicIds: uploadedImages.map(
            (item) => item.publicId
          ),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Part creation failed");
      }

      setMessage("Part saved successfully!");
      setMessageType("success");

      resetForm();
    } catch (error) {
      console.error("Add Part Error:", error);

      setMessage(
        error.message || "Something went wrong. Please try again."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080d1b] px-4 py-7 pb-32 text-white sm:px-6 sm:py-10">

      {/* Background glow */}
      <div className="pointer-events-none fixed -left-32 top-10 h-80 w-80 rounded-full bg-blue-600/20 blur-[110px]" />

      <div className="pointer-events-none fixed -right-32 top-64 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />

      <div className="pointer-events-none fixed bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />

      <div className="relative mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/stock"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to Stock
          </Link>

          <div className="mt-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold tracking-wider text-blue-300 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />
              NPD INVENTORY SYSTEM
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Add New <span className="text-blue-400">Part</span>
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Register a moulding component with its images and
              identification details.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Part Images */}
          <section className={sectionClass}>
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Part Images
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Upload images or capture them directly using your camera.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* Front View */}
              <ImageUploadCard
                title="Image 1 · Front View"
                description="Upload or capture the front view of the part."
                preview={previews[0]}
                file={images[0]}
                inputId="part-image-0"
                onChange={(e) => handleImage(0, e)}
                onRemove={() => removeImage(0)}
                onCamera={() => setActiveCamera(0)}
              />

              {/* Back / Side View */}
              <ImageUploadCard
                title="Image 2 · Back / Side View"
                description="Upload or capture the rear or side view."
                preview={previews[1]}
                file={images[1]}
                inputId="part-image-1"
                onChange={(e) => handleImage(1, e)}
                onRemove={() => removeImage(1)}
                onCamera={() => setActiveCamera(1)}
              />

            </div>

            <p className="mt-4 text-xs text-slate-500">
              You can upload or capture one or two images. Both are optional.
              Maximum 5 MB per image.
            </p>
          </section>

          {/* Part Information */}
          <section className={sectionClass}>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-xl text-blue-300">
                ◈
              </div>

              <div>
                <h2 className="font-semibold">
                  Part Information
                </h2>

                <p className="text-xs text-slate-400">
                  Identification and moulding details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              <Field
                label="Part Name"
                name="partName"
                placeholder="e.g. Front Cover"
                required
                value={form.partName}
                onChange={handleChange}
              />

              <Field
                label="Part Number"
                name="partNumber"
                placeholder="e.g. FC-001"
                required
                value={form.partNumber}
                onChange={handleChange}
              />

              <Field
                label="SAP Code (Optional)"
                name="sapCode"
                placeholder="Enter SAP Code if available"
                value={form.sapCode}
                onChange={handleChange}
              />

              <Field
                label="Cavities"
                name="cavities"
                placeholder="e.g. 1, 2, 4, 8"
                type="number"
                min="1"
                step="1"
                required
                value={form.cavities}
                onChange={handleChange}
              />

              <Field
                label="Customer Name"
                name="customerName"
                placeholder="e.g. Tata Motors"
                required
                value={form.customerName}
                onChange={handleChange}
              />

              <Field
                label="Project Name"
                name="projectName"
                placeholder="e.g. Project X"
                required
                value={form.projectName}
                onChange={handleChange}
              />

              <Field
                label="Supplier Name"
                name="supplierName"
                placeholder="Enter supplier name"
                value={form.supplierName}
                onChange={handleChange}
              />

            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Cavities must be a whole number. SAP Code can be left
              blank if it is not available.
            </p>
          </section>

          {/* Stock Settings */}
          <section className={sectionClass}>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/10 text-xl text-purple-300">
                ◉
              </div>

              <div>
                <h2 className="font-semibold">
                  Stock Settings
                </h2>

                <p className="text-xs text-slate-400">
                  Measurement and low-stock alert
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div>
                <label className={labelClass} htmlFor="unit">
                  Unit
                </label>

                <select
                  id="unit"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option className="bg-slate-900" value="NOS">
                    NOS
                  </option>

                  <option className="bg-slate-900" value="SET">
                    SET
                  </option>

                  <option className="bg-slate-900" value="PCS">
                    PCS
                  </option>
                </select>
              </div>

              <Field
                label="Reorder Level"
                name="reorderLevel"
                placeholder="e.g. 10"
                type="number"
                min="0"
                step="1"
                value={form.reorderLevel}
                onChange={handleChange}
              />

            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              A low-stock alert will appear when available quantity
              reaches this level.
            </p>
          </section>

          {/* Success / Error Message */}
          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border p-4 text-sm backdrop-blur-xl ${
                messageType === "success"
                  ? "border-green-400/20 bg-green-500/10 text-green-300"
                  : "border-red-400/20 bg-red-500/10 text-red-300"
              }`}
            >
              {messageType === "success" ? "✓ " : "⚠ "}
              {message}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link
              href="/stock"
              className="rounded-xl border border-white/10 bg-white/[0.05] px-7 py-3.5 text-center text-sm font-semibold text-slate-300 backdrop-blur-xl transition hover:bg-white/10"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl border border-blue-400/30 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Uploading & Saving..." : "Save Part →"}
            </button>

          </div>
        </form>
      </div>

      {/* Camera Popup */}
      {activeCamera !== null && (
        <PartCamera
          onCapture={(file) => {
            handleImageFile(activeCamera, file);
            setActiveCamera(null);
          }}
          onClose={() => setActiveCamera(null)}
        />
      )}

    </main>
  );
}
