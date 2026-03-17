"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import { getEvents, getSubmissions, deleteEvent, updateEvent } from "@/lib/actions";
import { Submission, Event } from "@/lib/types";
import { IcMenu, IcPlus, IcQr, IcLink, IcCalendar, IcPin, IcRadar, IcUsers, IcTrash, IcEdit, IcCheck, IcX } from "@/components/Icons";
import { LogoMark } from "@/components/AppLogo";

/* ── Inline Edit Modal ─────────────────────────────────────────────────── */
function EditModal({ event, onClose, onSaved }: {
  event: Event;
  onClose: () => void;
  onSaved: (updated: Partial<Event>) => void;
}) {
  const [name,          setName]          = useState(event.name);
  const [locationName,  setLocationName]  = useState(event.locationName);
  const [allowedRadius, setAllowedRadius] = useState(String(event.allowedRadius));
  const [date,          setDate]          = useState(event.date);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Event name is required."); return; }
    const radius = parseInt(allowedRadius);
    if (isNaN(radius) || radius < 50) { setError("Radius must be at least 50 metres."); return; }
    setSaving(true);
    try {
      await updateEvent(event.id, {
        name: name.trim(),
        locationName: locationName.trim(),
        allowedRadius: radius,
        date,
      });
      onSaved({ name: name.trim(), locationName: locationName.trim(), allowedRadius: radius, date });
      onClose();
    } catch {
      setError("Failed to save changes. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      {/* Modal box — stop click propagation so it doesn't close when clicking inside */}
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{ width: "100%", maxWidth: "440px", animation: "fadeIn 0.15s ease" }}
      >
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div className="section-title">Edit Event</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--gray-400)", marginTop: "0.1rem" }}>
              Update event details below
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: "0.25rem 0.5rem" }}>
            <IcX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {error && (
            <div className="alert alert-error" style={{ padding: "0.625rem 0.875rem", fontSize: "0.8125rem" }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="edit-name">Event Name</label>
            <input id="edit-name" className="form-input" value={name}
              onChange={e => { setName(e.target.value); setError(""); }} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="edit-loc">Location Name</label>
            <input id="edit-loc" className="form-input" value={locationName}
              onChange={e => setLocationName(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="edit-radius">
                Allowed Radius (m)
              </label>
              <input id="edit-radius" className="form-input" type="number" min={50} max={5000}
                value={allowedRadius}
                onChange={e => { setAllowedRadius(e.target.value); setError(""); }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="edit-date">Event Date</label>
              <input id="edit-date" className="form-input" type="date" value={date}
                onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.25rem" }}>
            <button onClick={onClose} className="btn btn-secondary btn-sm" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary btn-sm" disabled={saving}>
              {saving
                ? <><span className="spinner" style={{ width: "0.875rem", height: "0.875rem", borderTopColor: "white" }} />Saving…</>
                : <><IcCheck size={13} />Save Changes</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */
function AllEvents() {
  const { isAdmin, initialized } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events,      setEvents]      = useState<Event[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!isAdmin) { router.push("/admin/login"); return; }
    async function load() {
      const [dbEvents, dbSubmissions] = await Promise.all([getEvents(), getSubmissions()]);
      setEvents(dbEvents);
      setSubmissions(dbSubmissions);
    }
    load();
  }, [isAdmin, initialized, router]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to completely delete the event "${name}" and all its participant data?\n\nThis cannot be undone.`)) return;
    try {
      await deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      setSubmissions(prev => prev.filter(s => s.eventId !== id));
    } catch {
      alert("Failed to delete event. Please check your connection.");
    }
  };

  const handleSaved = (id: string, updated: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
  };

  if (!initialized || !isAdmin) return null;

  return (
    <div>
      {/* Edit modal */}
      {editingEvent && (
        <EditModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={(updated) => { handleSaved(editingEvent.id, updated); setEditingEvent(null); }}
        />
      )}

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
                  <IcPlus size={14} /> Create First Event
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {events.map((ev, i) => {
                const count  = submissions.filter(s => s.eventId === ev.id).length;
                const isPast = new Date(ev.date) < new Date(new Date().setHours(0,0,0,0));
                return (
                  <div key={ev.id} className="card fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
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
                              <IcPin size={12} />{ev.locationName}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--gray-400)", fontSize: "0.8125rem" }}>
                              <IcCalendar size={12} />{new Date(ev.date).toLocaleDateString()}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--gray-400)", fontSize: "0.8125rem" }}>
                              <IcRadar size={12} />{ev.allowedRadius}m radius
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--accent-600)", fontSize: "0.8125rem", fontWeight: 600 }}>
                              <IcUsers size={12} />{count} participant{count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" }}>
                          <Link href={`/admin/events/${ev.id}/qr`} className="btn btn-primary btn-sm">
                            <IcQr size={14} /> QR Code
                          </Link>
                          <Link href={`/event/${ev.slug}`} className="btn btn-secondary btn-sm" target="_blank">
                            <IcLink size={14} /> Open
                          </Link>
                          <button
                            onClick={() => setEditingEvent(ev)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: "var(--blue-600)", background: "var(--blue-50)", border: "1px solid var(--blue-200)" }}
                            title="Edit event"
                          >
                            <IcEdit size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id, ev.name)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: "var(--red-600)", background: "var(--red-50)", border: "1px solid var(--red-200)" }}
                            title="Delete event"
                          >
                            <IcTrash size={14} /> Delete
                          </button>
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
