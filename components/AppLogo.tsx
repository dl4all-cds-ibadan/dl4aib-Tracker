// Shared logo mark — "DL" initials in a green gradient box, no placeholder SVGs
interface LogoMarkProps { size?: number; }

export const LogoMark = ({ size = 32 }: LogoMarkProps) => (
  <div style={{
    width: size, height: size,
    background: "linear-gradient(135deg, #16a34a, #059669)",
    borderRadius: Math.round(size * 0.28),
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(22,163,74,0.35)",
  }}>
    <span style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 800,
      fontSize: Math.round(size * 0.38),
      color: "white",
      letterSpacing: "-0.03em",
      lineHeight: 1,
    }}>
      DL
    </span>
  </div>
);

/** Full brand lockup: logo + name lines */
export const AppBrand = ({ dark = false }: { dark?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
    <LogoMark size={32} />
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
      <span style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 700, fontSize: "0.9375rem",
        color: dark ? "#0f172a" : "white",
        letterSpacing: "-0.02em",
      }}>
        DL4AIB
      </span>
      <span style={{ fontSize: "0.6875rem", color: dark ? "#64748b" : "rgba(255,255,255,0.4)" }}>
        Digital Literacy for All Ibadan
      </span>
    </div>
  </div>
);
