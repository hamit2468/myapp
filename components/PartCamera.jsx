
"use client";

import { useEffect, useRef, useState } from "react";
import PartScanner from "./PartScanner";

export default function PartCamera({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [capturedFile, setCapturedFile] = useState(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsReady(false);
  };

  const startCamera = async () => {
    try {
      setCameraError("");
      setIsStarting(true);
      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera requires HTTPS or a supported browser."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (error) {
      setCameraError(
        error.message || "Unable to access camera."
      );
    } finally {
      setIsStarting(false);
    }
  };

  const switchCamera = () => {
    setFacingMode((current) =>
      current === "environment" ? "user" : "environment"
    );
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (streamRef.current) {
      startCamera();
    }
  }, [facingMode]);

  const capturePhoto = () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Unable to capture photo.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Photo capture failed.");
          return;
        }

        const file = new File(
          [blob],
          `part-scan-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        stopCamera();
        setCapturedFile(file);
      },
      "image/jpeg",
      0.95
    );
  };

  // Scanner open after camera capture
  if (capturedFile) {
    return (
      <PartScanner
        file={capturedFile}
        onUseImage={(scannedFile) => {
          onCapture(scannedFile);
        }}
        onClose={() => {
          setCapturedFile(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 backdrop-blur-xl">
      <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-slate-950/90 p-4 shadow-2xl">

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Part Camera
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Position the moulding part inside the frame
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="h-10 w-10 rounded-full bg-white/10 text-xl text-white"
          >
            ×
          </button>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
          />

          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center p-5 text-center">
              <p className="text-sm text-slate-300">
                {isStarting
                  ? "Starting camera..."
                  : "Camera is not started"}
              </p>
            </div>
          )}

          {isReady && (
            <div className="pointer-events-none absolute inset-5 rounded-xl border border-white/60">
              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-white/40" />
              <div className="absolute bottom-0 left-1/2 top-0 border-l border-dashed border-white/40" />
            </div>
          )}
        </div>

        {cameraError && (
          <p className="mt-3 text-sm text-red-400">
            {cameraError}
          </p>
        )}

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={switchCamera}
            disabled={isStarting}
            className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white disabled:opacity-50"
          >
            Switch Camera
          </button>

          {!isReady ? (
            <button
              type="button"
              onClick={startCamera}
              disabled={isStarting}
              className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white disabled:opacity-50"
            >
              {isStarting ? "Opening..." : "Open Camera"}
            </button>
          ) : (
            <button
              type="button"
              onClick={capturePhoto}
              className="rounded-xl bg-emerald-500 px-7 py-3 font-semibold text-white"
            >
              Capture Photo
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Camera permission is required.
        </p>
      </div>
    </div>
  );
}
