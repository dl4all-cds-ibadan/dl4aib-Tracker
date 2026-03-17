"use client";
import { LogoMark } from "./AppLogo";
import { IcMenu } from "./Icons";

interface AdminHeaderProps {
  subtitle?: string;
  onMenuOpen?: () => void;
  rightSlot?: React.ReactNode;
}

export default function AdminHeader({ subtitle = "Admin Portal", onMenuOpen, rightSlot }: AdminHeaderProps) {
  return (
    <header className="app-header">
      <div className="logo-area">
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            style={{
              background: "rgba(255,255,255,0.07)", border: "none",
              color: "white", width: "34px", height: "34px",
              borderRadius: "var(--r-md)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
          >
            <IcMenu size={16} />
          </button>
        )}
        <LogoMark size={32} />
        <div className="logo-text">
          <h1>DL4AIB</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      {rightSlot}
    </header>
  );
}
