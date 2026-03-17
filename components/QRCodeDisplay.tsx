"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { IcDownload, IcShare } from "./Icons";

interface Props { url: string; eventName: string; size?: number; }

export default function QRCodeDisplay({ url, eventName, size = 260 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(() => {
      setDataUrl(canvasRef.current!.toDataURL());
    });
  }, [url, size]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${eventName.replace(/\s+/g, "_")}_QR.png`;
    a.click();
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: eventName, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="qr-container" style={{ maxWidth: "100%" }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: "0.875rem",
          color: "var(--gray-900)",
          letterSpacing: "-0.02em",
        }}>
          DL4AIB Tracker
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: "0.125rem" }}>
          Scan to record attendance
        </div>
      </div>

      {/* QR Canvas */}
      <div style={{
        border: "1.5px solid var(--border)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        lineHeight: 0,
      }}>
        <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} />
      </div>

      {/* Event name */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, color: "var(--gray-900)", fontSize: "0.9rem", letterSpacing: "-0.01em" }}>
          {eventName}
        </div>
        <div style={{
          fontSize: "0.6875rem",
          color: "var(--gray-400)",
          marginTop: "0.25rem",
          maxWidth: "260px",
          wordBreak: "break-all",
          lineHeight: 1.5,
        }}>
          {url}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={download} className="btn btn-primary btn-sm">
          <IcDownload size={14} />
          Download
        </button>
        <button onClick={share} className="btn btn-secondary btn-sm">
          <IcShare size={14} />
          {copied ? "Copied!" : "Share Link"}
        </button>
      </div>
    </div>
  );
}
