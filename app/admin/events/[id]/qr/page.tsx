"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import { getEventById, getSubmissionsByEvent } from "@/lib/actions";
import { Event } from "@/lib/types";
import dynamic from "next/dynamic";
import { IcMenu, IcArrowLeft, IcPin, IcCalendar, IcRadar, IcLink, IcPlus, IcUsers, IcCopy, IcCheck } from "@/components/Icons";
import { LogoMark } from "@/components/AppLogo";

const QRCodeDisplay = dynamic(() => import("@/components/QRCodeDisplay"), { ssr: false });

function QRPage() {
  const { isAdmin, initialized } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [origin, setOrigin] = useState("");
  const [participantCount, setParticipantCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!initialized) return;
    if (!isAdmin) { router.push("/admin/login"); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    
    async function load() {
      const ev = await getEventById(params.id as string);
      if (!ev) { router.push("/admin/events"); return; }
      setEvent(ev);
      const subs = await getSubmissionsByEvent(ev.id);
      setParticipantCount(subs.length);
    }
    load();
  }, [isAdmin, initialized, params.id, router]);

  if (!initialized || !isAdmin || !event) return null;

  const eventUrl = `${origin}/event/${event.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const details = [
    { Icon: IcRadar,    label: "Allowed Radius", value: `${event.allowedRadius} m` },
    { Icon: IcPin,      label: "Coordinates",    value: `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}` },
    { Icon: IcLink,     label: "Event Slug",     value: `/event/${event.slug}` },
  ];

  return (
    <div>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-content">
        <header className="app-header">
          <div className="logo-area">
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "rgba(255,255,255,0.07)", border: "none", color: "white",
                width: "34px", height: "34px", borderRadius: "var(--r-md)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <IcMenu size={16} />
            </button>
            <LogoMark size={32} />
            <div className="logo-text">
              <h1>DL4AIB</h1>
              <p>Event QR Code</p>
            </div>
          </div>
          <Link href="/admin/dashboard" className="btn btn-ghost btn-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            <IcArrowLeft size={14} />
            Dashboard
          </Link>
        </header>

        <div className="page-wrapper">
          <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Event info card */}
            <div className="card fade-in">
              <div style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                flexWrap: "wrap",
              }}>
                <div style={{
                  width: "44px", height: "44px", flexShrink: 0,
                  background: "var(--brand-50)", borderRadius: "var(--r-lg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--brand-600)",
                }}>
                  <IcCalendar size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "var(--gray-900)", letterSpacing: "-0.02em" }}>
                    {event.name}
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.375rem", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--gray-500)", fontSize: "0.8125rem" }}>
                      <IcPin size={12} />{event.locationName}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--gray-400)", fontSize: "0.8125rem" }}>
                      <IcCalendar size={12} />{new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  background: "var(--accent-50)", color: "var(--accent-600)",
                  border: "1.5px solid var(--accent-100)",
                  borderRadius: "var(--r-lg)", padding: "0.625rem 1rem", flexShrink: 0,
                }}>
                  <IcUsers size={16} />
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.04em", lineHeight: 1 }}>{participantCount}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>participants</span>
                </div>
              </div>

              {/* Detail row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                gap: "0",
                borderTop: "none",
              }}>
                {details.map((d, i) => {
                  const Icon = d.Icon;
                  return (
                    <div key={d.label} style={{
                      padding: "0.875rem 1.5rem",
                      borderRight: i < details.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--gray-400)", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        <Icon size={12} />{d.label}
                      </div>
                      <div style={{ fontWeight: 600, color: "var(--gray-700)", fontSize: "0.875rem" }}>{d.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QR code card */}
            <div className="card fade-in" style={{ animationDelay: "0.06s" }}>
              <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
                <div className="section-title">Volunteer QR Code</div>
                <p style={{ color: "var(--gray-500)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  Share this code with field volunteers. Scanning it instantly opens the attendance form.
                </p>
              </div>
              <div style={{
                padding: "2rem",
                display: "flex",
                justifyContent: "center",
                background: "var(--gray-25)",
              }}>
                <QRCodeDisplay url={eventUrl} eventName={event.name} size={280} />
              </div>
            </div>

            {/* Link card */}
            <div className="card fade-in" style={{ animationDelay: "0.12s" }}>
              <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
                <div className="section-title">Shareable Link</div>
                <p style={{ color: "var(--gray-500)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  Send this link directly to volunteers if they cannot scan the QR code.
                </p>
              </div>
              <div style={{ padding: "1.25rem 1.5rem" }}>
                <div style={{
                  display: "flex", gap: "0.75rem", alignItems: "center",
                  background: "var(--gray-50)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  padding: "0.75rem 1rem",
                  flexWrap: "wrap",
                  marginBottom: "1rem",
                }}>
                  <code style={{ flex: 1, fontSize: "0.8125rem", color: "var(--brand-600)", wordBreak: "break-all", fontFamily: "monospace" }}>
                    {eventUrl}
                  </code>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={copyLink}
                  >
                    {copied ? <IcCheck size={14} /> : <IcCopy size={14} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <Link href={`/event/${event.slug}`} className="btn btn-secondary btn-sm" target="_blank">
                    <IcLink size={14} />
                    Preview Form
                  </Link>
                  <Link href="/admin/events/create" className="btn btn-primary btn-sm">
                    <IcPlus size={14} />
                    Create Another Event
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventQRPage() {
  return (
    <AuthProvider>
      <QRPage />
    </AuthProvider>
  );
}
