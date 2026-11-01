
"use client";

import { useEffect, useRef, useState } from "react";

export default function PartScanner({
  file,
  onUseImage,
  onClose,
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const dragRef = useRef(null);

  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const zoomIn = () => {
    setZoom((current) => Math.min(current + 0.25, 4));
  };

  const zoomOut = () => {
    setZoom((current) => Math.max(current - 0.25, 0.25));
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setDragging(true);

    dragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging || !dragRef.current) return;

    const dx = e.clientX - dragRef.current.mouseX;
    const dy = e.clientY - dragRef.current.mouseY;

    setPosition({
      x: dragRef.current.startX + dx,
      y: dragRef.current.startY + dy,
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
    dragRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 p-3 backdrop-blur-xl">
      <div className="w-full max-w-4xl rounded-3xl border border-white/15 bg-slate-950 p-4 shadow-2xl sm:p-6">

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Part Image Viewer
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Zoom and inspect your moulding part image
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
          >
            ×
          </button>
        </div>

        <div
          className="relative flex h-[55vh] min-h-[280px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            cursor: dragging ? "grabbing" : "grab",
            touchAction: "none",
          }}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Moulding part"
              draggable={false}
              className="max-h-full max-w-full select-none object-contain"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transformOrigin: "center",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">

          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 0.25}
            className="rounded-xl bg-white/10 px-5 py-3 text-lg font-semibold text-white disabled:opacity-30"
          >
            −
          </button>

          <span className="min-w-16 text-center text-sm font-medium text-white">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 4}
            className="rounded-xl bg-white/10 px-5 py-3 text-lg font-semibold text-white disabled:opacity-30"
          >
            +
          </button>

          <button
            type="button"
            onClick={resetZoom}
            className="rounded-xl bg-white/10 px-5 py-3 text-sm font-medium text-white"
          >
            Reset Zoom
          </button>
        </div>

        <button
          type="button"
          onClick={() => onUseImage(file)}
          className="mt-5 w-full rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-white hover:bg-emerald-400"
        >
          Use This Image
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          Drag image to move • Use + and − to zoom
        </p>
      </div>
    </div>
  );
}
