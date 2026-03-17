"use client";
import React, { useRef, useState, useCallback } from "react";
import { IcCamera, IcFlip, IcCheck, IcRefresh, IcX } from "./Icons";

interface Props { onCapture: (base64: string) => void; captured: string | null; }

export default function PhotoCapture({ onCapture, captured }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState<"user"|"environment">("environment");

  const startCamera = useCallback(async () => {
    setError("");
    
    // Apple / iOS in-app browser blocker detection
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera blocked by your app. If you are on an iPhone (like through WhatsApp or Telegram), tap the compass icon or 3 dots to Open in Safari.");
      return;
    }

    try {
      // First try with ideal high-res constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {}); // handle play interrupted exceptions gracefully
        setStreaming(true);
      }
    } catch (e1) {
      try {
        // Fallback: Some mobile devices fully reject requests if they don't support the requested resolution constraints
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setStreaming(true);
        }
      } catch (e2: any) {
        console.error("Camera error:", e2);
        setError(`Camera access failed: ${e2.message || "Permission denied."} Please allow camera access in your browser settings or ensure you are on a secure connection (HTTPS).`);
      }
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const now = new Date();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, canvas.height - 36, canvas.width, 36);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Inter, Arial";
    ctx.fillText(`DL4AIB Tracker  •  ${now.toLocaleString()}`, 10, canvas.height - 12);
    const base64 = canvas.toDataURL("image/jpeg", 0.82);
    onCapture(base64);
    stopCamera();
  }, [onCapture, stopCamera]);

  const retake = () => { onCapture(""); startCamera(); };
  const flipCamera = () => { stopCamera(); setFacingMode((p) => p === "user" ? "environment" : "user"); setTimeout(startCamera, 150); };

  if (captured) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
        <div className="camera-wrapper">
          <img src={captured} alt="Captured photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button onClick={retake} className="btn btn-secondary btn-sm">
            <IcRefresh size={14} />
            Retake
          </button>
          <div style={{
            background: "var(--accent-50)",
            color: "var(--accent-600)",
            border: "1.5px solid var(--accent-100)",
            padding: "0.4375rem 0.875rem",
            borderRadius: "var(--r-sm)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}>
            <IcCheck size={14} />
            Photo captured
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
      {error && (
        <div className="alert alert-error" style={{ width: "100%", maxWidth: "360px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {streaming ? (
        <div className="camera-wrapper">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            webkit-playsinline="true"
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />

          {/* Flip button */}
          <button
            onClick={flipCamera}
            style={{
              position: "absolute", top: "0.75rem", right: "0.75rem",
              background: "rgba(0,0,0,0.5)",
              border: "none", color: "white",
              width: "2.25rem", height: "2.25rem",
              borderRadius: "50%", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            <IcFlip size={15} />
          </button>

          {/* Capture button */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "1rem",
            background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
            display: "flex", justifyContent: "center",
          }}>
            <button
              onClick={capture}
              style={{
                width: "3.75rem", height: "3.75rem",
                borderRadius: "50%",
                background: "white",
                border: "4px solid rgba(255,255,255,0.45)",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                transition: "transform 0.1s",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
          </div>
        </div>
      ) : (
        <div
          className="camera-wrapper"
          style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "var(--gray-900)", gap: "0.875rem",
            cursor: "pointer",
          }}
          onClick={startCamera}
        >
          <div style={{
            width: "4rem", height: "4rem",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.5)",
          }}>
            <IcCamera size={28} />
          </div>
          <div style={{ textAlign: "center", padding: "0 1.5rem" }}>
            <p style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: "0.9rem" }}>
              Tap to open camera
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              Live photo required — gallery uploads are not permitted
            </p>
          </div>
        </div>
      )}

      {!streaming && (
        <button onClick={startCamera} className="btn btn-primary">
          <IcCamera size={15} />
          Open Camera
        </button>
      )}
      {streaming && (
        <button onClick={stopCamera} className="btn btn-ghost btn-sm">
          <IcX size={14} />
          Cancel
        </button>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
