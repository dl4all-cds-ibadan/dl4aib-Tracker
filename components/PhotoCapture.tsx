"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { IcCamera, IcFlip, IcCheck, IcRefresh, IcX } from "./Icons";

interface Props { onCapture: (base64: string) => void; captured: string | null; eventName?: string; }

export default function PhotoCapture({ onCapture, captured, eventName = "" }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const [streaming,   setStreaming]   = useState(false);
  const [error,       setError]       = useState("");
  const [facingMode,  setFacingMode]  = useState<"user"|"environment">("environment");

  // Attach the stream to the <video> element — called every time `facingMode` changes
  const startCamera = useCallback(async () => {
    setError("");

    // iOS in-app browser guard (WhatsApp, Instagram, Telegram, etc.)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is blocked. If on iPhone, open this link in Safari. If on Android, open in Chrome or your Stock Browser.");
      return;
    }

    // Stop any already-running tracks
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStreaming(false);

    const constraints: MediaStreamConstraints[] = [
      // 1st attempt: high-res with preferred facing mode
      { video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false },
      // 2nd attempt: just the facing mode, any resolution
      { video: { facingMode }, audio: false },
      // 3rd attempt (last resort): any camera at all
      { video: true, audio: false },
    ];

    let stream: MediaStream | null = null;
    let lastErr: any = null;

    for (const c of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(c);
        break; // success
      } catch (e) {
        lastErr = e;
      }
    }

    if (!stream) {
      console.error("All camera attempts failed:", lastErr);
      setError(`Camera error: ${lastErr?.message || "Permission denied"}. Please allow camera access in your browser settings.`);
      return;
    }

    streamRef.current = stream;

    // Wait for the video ref to be in the DOM, then attach stream
    const attach = () => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // `play()` is required for some Android browsers that won't autoplay
        videoRef.current.play().catch(() => {});
        setStreaming(true);
      } else {
        // retry if DOM not ready yet
        setTimeout(attach, 100);
      }
    };
    attach();
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  }, []);

  // Re-start whenever facingMode changes
  useEffect(() => {
    if (streaming) startCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const capture = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    // ── Watermark bar (bigger, 2-line) ────────────────────────────────────
    const now    = new Date();
    const barH   = 68;                             // taller bar
    const barY   = canvas.height - barH;
    // Semi-transparent dark background
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(0, barY, canvas.width, barH);
    // Scale font relative to canvas width so it looks good on any resolution
    const scale   = canvas.width / 640;
    const titleSz = Math.round(16 * scale);        // event name — bigger
    const subSz   = Math.round(13 * scale);        // timestamp line
    const pad     = Math.round(12 * scale);
    // Line 1 — event name
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${titleSz}px Inter, Arial`;
    ctx.fillText(eventName || "DL4AIB Tracker", pad, barY + titleSz + 8 * scale);
    // Line 2 — app name + timestamp
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `${subSz}px Inter, Arial`;
    ctx.fillText(`DL4AIB Tracker  •  ${now.toLocaleString()}`, pad, barY + titleSz + subSz + 16 * scale);

    const base64 = canvas.toDataURL("image/jpeg", 0.82);
    onCapture(base64);
    stopCamera();
  }, [onCapture, stopCamera, eventName]);

  const retake     = () => { onCapture(""); startCamera(); };
  const flipCamera = () => setFacingMode(p => p === "user" ? "environment" : "user");

  // ── Captured preview ──────────────────────────────────────────────────────
  if (captured) {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", alignItems:"center" }}>
        <div className="camera-wrapper">
          <img src={captured} alt="Captured photo" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        </div>
        <div style={{ display:"flex", gap:"0.625rem" }}>
          <button onClick={retake} className="btn btn-secondary btn-sm">
            <IcRefresh size={14} /> Retake
          </button>
          <div style={{
            background:"var(--accent-50)", color:"var(--accent-600)",
            border:"1.5px solid var(--accent-100)", padding:"0.4375rem 0.875rem",
            borderRadius:"var(--r-sm)", fontSize:"0.8125rem", fontWeight:600,
            display:"flex", alignItems:"center", gap:"0.375rem",
          }}>
            <IcCheck size={14} /> Photo captured
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display:"none" }} />
      </div>
    );
  }

  // ── Camera UI ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", alignItems:"center" }}>
      {error && (
        <div className="alert alert-error" style={{ width:"100%", maxWidth:"360px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Camera viewport — always rendered so videoRef is in the DOM */}
      <div className="camera-wrapper" style={{ display: streaming ? undefined : "flex" }}
           onClick={!streaming ? startCamera : undefined}>

        {/* Always keep video in DOM once started so stream can attach */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width:"100%", height:"100%", objectFit:"cover", display: streaming ? "block" : "none" }}
        />

        {!streaming && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                        width:"100%", height:"100%", background:"var(--gray-900)", gap:"0.875rem", cursor:"pointer" }}>
            <div style={{ width:"4rem", height:"4rem", background:"rgba(255,255,255,0.06)",
                          borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                          color:"rgba(255,255,255,0.5)" }}>
              <IcCamera size={28} />
            </div>
            <div style={{ textAlign:"center", padding:"0 1.5rem" }}>
              <p style={{ color:"rgba(255,255,255,0.8)", fontWeight:600, fontSize:"0.9rem" }}>Tap to open camera</p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.75rem", marginTop:"0.25rem" }}>
                Live photo required — gallery uploads not permitted
              </p>
            </div>
          </div>
        )}

        {streaming && (
          <>
            {/* Flip camera */}
            <button onClick={flipCamera} style={{
              position:"absolute", top:"0.75rem", right:"0.75rem",
              background:"rgba(0,0,0,0.5)", border:"none", color:"white",
              width:"2.25rem", height:"2.25rem", borderRadius:"50%", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)",
            }}>
              <IcFlip size={15} />
            </button>

            {/* Capture shutter */}
            <div style={{
              position:"absolute", bottom:0, left:0, right:0, padding:"1rem",
              background:"linear-gradient(transparent, rgba(0,0,0,0.55))",
              display:"flex", justifyContent:"center",
            }}>
              <button onClick={capture} style={{
                width:"3.75rem", height:"3.75rem", borderRadius:"50%", background:"white",
                border:"4px solid rgba(255,255,255,0.45)", cursor:"pointer",
                boxShadow:"0 4px 16px rgba(0,0,0,0.3)", transition:"transform 0.1s",
              }}
                onMouseDown={e => (e.currentTarget.style.transform="scale(0.9)")}
                onMouseUp={  e => (e.currentTarget.style.transform="scale(1)")}
              />
            </div>
          </>
        )}
      </div>

      {/* Buttons below viewport */}
      {!streaming && (
        <button onClick={startCamera} className="btn btn-primary">
          <IcCamera size={15} /> Open Camera
        </button>
      )}
      {streaming && (
        <button onClick={stopCamera} className="btn btn-ghost btn-sm">
          <IcX size={14} /> Cancel
        </button>
      )}

      <canvas ref={canvasRef} style={{ display:"none" }} />
    </div>
  );
}
