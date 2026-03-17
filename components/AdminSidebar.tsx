"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { IcChart, IcPlus, IcList, IcHome, IcLogOut } from "./Icons";
import { LogoMark } from "./AppLogo";

interface Props { open: boolean; onClose: () => void; }

const navItems = [
  { href: "/admin/dashboard", icon: IcChart, label: "Dashboard" },
  { href: "/admin/events",    icon: IcList,  label: "All Events" },
  { href: "/admin/events/create", icon: IcPlus, label: "Create Event" },
];

export default function AdminSidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <>
      <div className={`sidebar-overlay ${open ? "visible" : ""}`} onClick={onClose} />

      <nav className={`sidebar ${open ? "open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-logo">
          <LogoMark size={34} />
          <div>
            <div className="sidebar-logo-text">DL4AIB</div>
            <div className="sidebar-logo-sub">Digital Literacy for All Ibadan</div>
          </div>
        </div>

        {/* Nav Section */}
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`nav-link ${active ? "active" : ""}`}
            >
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* Bottom */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
          <Link href="/" className="nav-link" onClick={onClose}>
            <IcHome size={15} />
            Home
          </Link>
          <button
            className="nav-link danger"
            onClick={() => { logout(); window.location.href = "/admin/login"; }}
          >
            <IcLogOut size={15} />
            Sign Out
          </button>
        </div>
      </nav>
    </>
  );
}
