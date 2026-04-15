"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { IcDownload, IcShare } from "./Icons";

interface Props { url: string; eventName: string; size?: number; }

const CAPTION = "Scan the QR code or Click the Link to mark your attendance";

export default function QRCodeDisplay({ url, eventName, size = 260 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady]   = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Render QR + logo overlay ────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, url, {
      width: size,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "H",   // 30% recovery — safe for centre logo
    }).then(() => {
      const ctx = canvas.getContext("2d")!;
      const cx = canvas.width  / 2;
      const cy = canvas.height / 2;
      const R  = Math.round(canvas.width * 0.11);   // badge radius
      const r2 = Math.round(R * 0.72);              // green circle

      // White border ring
      ctx.beginPath();
      ctx.arc(cx, cy, R + 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Green gradient circle
      const g = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, 0, cx, cy, r2);
      g.addColorStop(0, "#22c55e");
      g.addColorStop(1, "#059669");
      ctx.beginPath();
      ctx.arc(cx, cy, r2, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      // White pin icon
      const s = r2 * 0.55;
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.18, s * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.18, s * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.72);
      ctx.lineTo(cx - s * 0.38, cy - s * 0.05);
      ctx.lineTo(cx + s * 0.38, cy - s * 0.05);
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      setReady(true);
    });
  }, [url, size]);

  // ── Download QR as PNG ──────────────────────────────────────────────────
  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href     = canvas.toDataURL("image/png");
    a.download = `${eventName.replace(/\s+/g, "_")}_QR.png`;
    a.click();
  };

  // ── Share QR image + link + caption ────────────────────────────────────
  const share = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert QR canvas → File
    const file: File | null = await new Promise((resolve) =>
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], `${eventName.replace(/\s+/g, "_")}_QR.png`, { type: "image/png" }) : null),
        "image/png"
      )
    );

    // Share with image file (works on Android Chrome, iOS Safari 16.4+, etc.)
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title:  `${eventName} — DL4AIB Tracker`,
          text:   CAPTION,
          url,
          files:  [file],
        });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;  // user cancelled — do nothing
      }
    }

    // Fallback: share URL only (desktop browsers)
    if (navigator.share) {
      try {
        await navigator.share({ title: eventName, text: CAPTION, url });
        return;
      } catch { /* AbortError */ }
    }

    // Last resort: copy URL to clipboard
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="qr-container" style={{ maxWidth: "100%" }}>

      {/* Header label */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "0.875rem", color: "var(--gray-900)", letterSpacing: "-0.02em" }}>
          DL4AIB Tracker
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: "0.125rem" }}>
          Scan to record attendance
        </div>
      </div>

      {/* QR Code canvas */}
      <div style={{ border: "1.5px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", lineHeight: 0 }}>
        <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} />
      </div>

      {/* Event name + URL */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, color: "var(--gray-900)", fontSize: "0.9rem", letterSpacing: "-0.01em" }}>
          {eventName}
        </div>
        <div style={{ fontSize: "0.6875rem", color: "var(--gray-400)", marginTop: "0.25rem", maxWidth: "260px", wordBreak: "break-all", lineHeight: 1.5 }}>
          {url}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={download} className="btn btn-primary btn-sm" disabled={!ready}>
          <IcDownload size={14} />
          Download QR
        </button>
        <button onClick={share} className="btn btn-secondary btn-sm" disabled={!ready}>
          <IcShare size={14} />
          {copied ? "Link Copied!" : "Share QR + Link"}
        </button>
      </div>

    </div>
  );
}
