"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import { getEvents, getSubmissions } from "@/lib/actions";
import { Submission } from "@/lib/types";
import { Event } from "@/lib/types";
import { IcMenu, IcPlus, IcQr, IcLink, IcCalendar, IcPin, IcRadar, IcUsers } from "@/components/Icons";
import { LogoMark } from "@/components/AppLogo";

function AllEvents() {
  const { isAdmin, initialized } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (!initialized) return;
    if (!isAdmin) { router.push("/admin/login"); return; }
    
    async function load() {
      const [dbEvents, dbSubmissions] = await Promise.all([
        getEvents(),
        getSubmissions(),
      ]);
      setEvents(dbEvents);
      setSubmissions(dbSubmissions);
    }
    load();
  }, [isAdmin, initialized, router]);

  if (!initialized || !isAdmin) return null;

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
              <p>All Events</p>
            </div>
          </div>
          <Link href="/admin/events/create" className="btn btn-primary btn-sm">
            <IcPlus size={14} />
            New Event
          </Link>
        </header>

        <div className="page-wrapper">
          <div style={{ marginBottom: "1.5rem" }}>
            <div className="page-title">Outreach Events</div>
            <div className="page-subtitle">Manage and monitor all your field events</div>
          </div>

          {events.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><IcCalendar size={22} /></div>
                <h3>No events yet</h3>
                <p>Create your first outreach event to get started collecting participant attendance.</p>
                <Link href="/admin/events/create" className="btn btn-primary btn-sm">
                  <IcPlus size={14} />
                  Create First Event
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {events.map((ev, i) => {
                const count = submissions.filter((s) => s.eventId === ev.id).length;
                const isPast = new Date(ev.date) < new Date(new Date().setHours(0,0,0,0));
                return (
                  <div
                    key={ev.id}
                    className="card fade-in"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div className="card-body" style={{ padding: "1.25rem 1.5rem" }}>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                        {/* Icon */}
                        <div style={{
                          width: "44px", height: "44px", flexShrink: 0,
                          background: isPast ? "var(--gray-100)" : "var(--brand-50)",
                          borderRadius: "var(--r-lg)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: isPast ? "var(--gray-400)" : "var(--brand-600)",
                        }}>
                          <IcCalendar size={20} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.375rem" }}>
                            <span style={{ fontWeight: 700, color: "var(--gray-900)", fontSize: "0.9375rem", letterSpacing: "-0.015em" }}>
                              {ev.name}
                            </span>
                            <span className={`badge ${isPast ? "badge-gray" : "badge-green"}`}>
                              {isPast ? "Past" : "Upcoming"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--gray-500)", fontSize: "0.8125rem" }}>
                              <IcPin size={12} />
                              {ev.locationName}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--gray-400)", fontSize: "0.8125rem" }}>
                              <IcCalendar size={12} />
                              {new Date(ev.date).toLocaleDateString()}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--gray-400)", fontSize: "0.8125rem" }}>
                              <IcRadar size={12} />
                              {ev.allowedRadius}m radius
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--accent-600)", fontSize: "0.8125rem", fontWeight: 600 }}>
                              <IcUsers size={12} />
                              {count} participant{count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                          <Link href={`/admin/events/${ev.id}/qr`} className="btn btn-primary btn-sm">
                            <IcQr size={14} />
                            QR Code
                          </Link>
                          <Link href={`/event/${ev.slug}`} className="btn btn-secondary btn-sm" target="_blank">
                            <IcLink size={14} />
                            Open
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AllEventsPage() {
  return (
    <AuthProvider>
      <AllEvents />
    </AuthProvider>
  );
}
