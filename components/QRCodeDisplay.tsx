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
      errorCorrectionLevel: "H",   // H = 30% recovery — safe for logo overlay
    }).then(() => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const cx = canvas.width  / 2;
      const cy = canvas.height / 2;

      // Logo badge radius = ~11% of QR size
      const R  = Math.round(canvas.width * 0.11);
      const r2 = Math.round(R * 0.72);   // inner green circle

      // White ring (border)
      ctx.beginPath();
      ctx.arc(cx, cy, R + 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Outer white circle background
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Green gradient fill
      const grad = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, 0, cx, cy, r2);
      grad.addColorStop(0, "#22c55e");
      grad.addColorStop(1, "#059669");
      ctx.beginPath();
      ctx.arc(cx, cy, r2, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Pin icon drawn in white
      const s = r2 * 0.55;   // scale of pin relative to inner circle
      // Circle head of pin
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.18, s * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      // Hole in pin head
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.18, s * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      // Pin tip (teardrop bottom)
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.72);
      ctx.lineTo(cx - s * 0.38, cy - s * 0.05);
      ctx.lineTo(cx + s * 0.38, cy - s * 0.05);
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Capture final dataUrl (with logo baked in)
      setDataUrl(canvas.toDataURL());
    });
  }, [url, size]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${eventName.replace(/\s+/g, "_")}_QR.png`;
    a.click();
  };

  /** Builds a branded card image: DL4AIB header + QR + event name + URL */
  const buildShareCard = async (): Promise<File | null> => {
    const qrCanvas = canvasRef.current;
    if (!qrCanvas) return null;

    // Load logo image first
    const logo = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "/logo.png";
    });

    const pad     = 32;
    const qrSize  = qrCanvas.width;
    const W       = qrSize + pad * 2;
    const headerH = 64;   // brand bar
    const footerH = 80;   // event name + url
    const H = headerH + pad + qrSize + pad + footerH;

    const card = document.createElement("canvas");
    card.width  = W;
    card.height = H;
    const ctx = card.getContext("2d")!;

    // ── White card background ────────────────────────────────────────
    ctx.fillStyle = "#ffffff";
    ctx.roundRect(0, 0, W, H, 16);
    ctx.fill();

    // ── Dark green header bar ────────────────────────────────────────
    ctx.fillStyle = "#052e16";
    ctx.beginPath();
    ctx.roundRect(0, 0, W, headerH, [16, 16, 0, 0]);
    ctx.fill();

    // Logo image (circular clip) OR fallback green circle
    const logoSize = 36;
    const logoX = 16;
    const logoY = (headerH - logoSize) / 2;
    if (logo) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      ctx.restore();
    } else {
      // Fallback: green gradient circle with "D"
      const ccx = logoX + logoSize / 2, ccy = logoY + logoSize / 2;
      const g = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, logoSize / 2);
      g.addColorStop(0, "#22c55e"); g.addColorStop(1, "#059669");
      ctx.beginPath(); ctx.arc(ccx, ccy, logoSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = `bold ${logoSize * 0.5}px Arial`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("D", ccx, ccy);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    }

    // Brand text
    const textX = logoX + logoSize + 10;
    const cy = headerH / 2;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px 'Plus Jakarta Sans', Inter, Arial, sans-serif";
    ctx.fillText("DL4AIB Tracker", textX, cy - 2);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px Inter, Arial, sans-serif";
    ctx.fillText("Scan to record attendance", textX, cy + 13);

    // ── QR code ─────────────────────────────────────────────────────
    ctx.drawImage(qrCanvas, pad, headerH + pad);

    // ── Footer ───────────────────────────────────────────────────────
    const footerY = headerH + pad + qrSize + pad;

    // Event name
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 15px Inter, Arial, sans-serif";
    let name = eventName;
    while (ctx.measureText(name).width > W - pad * 2 && name.length > 4)
      name = name.slice(0, -4) + "\u2026";
    ctx.fillText(name, pad, footerY + 20);

    // URL
    ctx.fillStyle = "#64748b";
    ctx.font = "11px Inter, Arial, sans-serif";
    let shortUrl = url;
    while (ctx.measureText(shortUrl).width > W - pad * 2 && shortUrl.length > 8)
      shortUrl = shortUrl.slice(0, -4) + "\u2026";
    ctx.fillText(shortUrl, pad, footerY + 42);

    // Instruction line
    ctx.fillStyle = "#16a34a";
    ctx.font = "bold 11px Inter, Arial, sans-serif";
    ctx.fillText("Scan the QR code or click the link to mark your attendance", pad, footerY + 62);

    // Green bottom accent
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(0, H - 4, W, 4);

    return new Promise((resolve) => {
      card.toBlob((blob) => {
        if (!blob) { resolve(null); return; }
        resolve(new File([blob], `${eventName.replace(/\s+/g, "_")}_QR.png`, { type: "image/png" }));
      }, "image/png");
    });
  };

  const share = async () => {
    const file = await buildShareCard();

    // Try sharing with the QR image attached (mobile browsers / PWA)
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: eventName,
          text: `Scan the QR code or click the link to mark your attendance`,
          url,
          files: [file],
        });
        return;
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.warn("Share with file failed, falling back:", e);
      }
    }

    // Fallback: share URL only (desktop)
    if (navigator.share) {
      try { await navigator.share({ title: eventName, url }); return; }
      catch { /* AbortError is fine */ }
    }

    // Last resort: copy URL to clipboard
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="qr-container" style={{ maxWidth: "100%" }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700, fontSize: "0.875rem",
          color: "var(--gray-900)", letterSpacing: "-0.02em",
        }}>
          DL4AIB Tracker
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: "0.125rem" }}>
          Scan to record attendance
        </div>
      </div>

      {/* QR Canvas */}
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

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={download} className="btn btn-primary btn-sm">
          <IcDownload size={14} />
          Download
        </button>
        <button onClick={share} className="btn btn-secondary btn-sm">
          <IcShare size={14} />
          {copied ? "Link Copied!" : "Share QR + Link"}
        </button>
      </div>
    </div>
  );
}
