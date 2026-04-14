// Shared logo mark — using the uploaded DL4ALL logo
interface LogoMarkProps { size?: number; }

export const LogoMark = ({ size = 32 }: LogoMarkProps) => (
  <div style={{
    height: size,
    background: "white", // ensures the black text is visible even on dark admin backgrounds
    padding: Math.max(2, Math.round(size * 0.1)),
    borderRadius: Math.round(size * 0.15),
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  }}>
    <img 
      src="/logo.png" 
      alt="DL4ALL Logo" 
      style={{ 
        height: "100%", 
        width: "auto", 
        objectFit: "contain" 
      }} 
      onError={(e) => {
        // Fallback UI if they haven't uploaded it to public/logo.png yet
        e.currentTarget.style.display = "none";
        if (e.currentTarget.parentElement) {
          e.currentTarget.parentElement.innerHTML = `<span style="font-weight: 800; font-size: ${Math.round(size*0.4)}px; color: #16a34a;">DL4ALL</span>`;
        }
      }}
    />
  </div>
);

/** Full brand lockup: Just the logo now, since the image contains all the text ("Digital Literacy for All, Ibadan") */
export const AppBrand = ({}: { dark?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    <LogoMark size={44} />
  </div>
);
