"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import { getEvents, getSubmissions, deleteEvent, updateEvent, deleteSubmission } from "@/lib/actions";
import { Event, Submission } from "@/lib/types";
import dynamic from "next/dynamic";
import * as XLSX from "xlsx";
import {
  IcMenu, IcChart, IcUsers, IcCamera, IcCalendar,
  IcMap, IcPlus, IcLogOut, IcUser, IcFilter, IcExport, IcTrash, IcEdit, IcCheck, IcX
} from "@/components/Icons";
import { LogoMark } from "@/components/AppLogo";


const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

function Dashboard() {
  const { isAdmin, initialized, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "submissions" | "map">("overview");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [photoModal, setPhotoModal] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState({ name: "", locationName: "", allowedRadius: "", date: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);
  const [confirmSub, setConfirmSub] = useState<Submission | null>(null);

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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the event "${name}" and all its participant data? This cannot be undone.`)) return;
    try {
      await deleteEvent(id);
      setEvents(e => e.filter(x => x.id !== id));
      setSubmissions(s => s.filter(x => x.eventId !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete event. Please check your network.");
    }
  };

  const handleDeleteSubmission = async (sub: Submission) => {
    setDeletingSubId(sub.id);
    try {
      await deleteSubmission(sub.id);
      setSubmissions(s => s.filter(x => x.id !== sub.id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete submission. Please check your network.");
    } finally {
      setDeletingSubId(null);
      setConfirmSub(null);
    }
  };

  const openEdit = (ev: Event) => {
    setEditingEvent(ev);
    setEditForm({ name: ev.name, locationName: ev.locationName, allowedRadius: String(ev.allowedRadius), date: ev.date });
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editingEvent) return;
    const radius = parseInt(editForm.allowedRadius);
    if (!editForm.name.trim()) { setEditError("Event name is required."); return; }
    if (isNaN(radius) || radius < 50) { setEditError("Radius must be at least 50m."); return; }
    setEditSaving(true);
    try {
      await updateEvent(editingEvent.id, { name: editForm.name.trim(), locationName: editForm.locationName.trim(), allowedRadius: radius, date: editForm.date });
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, name: editForm.name.trim(), locationName: editForm.locationName.trim(), allowedRadius: radius, date: editForm.date } : e));
      setEditingEvent(null);
    } catch { setEditError("Failed to save. Check your connection."); }
    finally { setEditSaving(false); }
  };

  const filtered = filterEvent === "all" ? submissions : submissions.filter((s) => s.eventId === filterEvent);

  const exportCSV = () => {
    const rows = filtered.map((s) => ({
      Name: s.fullName, "State Code": s.stateCode, Gender: s.gender,
      Event: s.eventName, Timestamp: new Date(s.timestamp).toLocaleString(),
      Latitude: s.latitude, Longitude: s.longitude, Address: s.address ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, "dl4aib_submissions.xlsx");
  };

  const exportCSVOnly = () => {
    if (!filtered.length) return;
    const header = ["Name","State Code","Gender","Event","Timestamp","Latitude","Longitude","Address"];
    const rows = filtered.map((s) =>
      [s.fullName, s.stateCode, s.gender, s.eventName, new Date(s.timestamp).toLocaleString(), s.latitude, s.longitude, s.address ?? ""].join(",")
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "dl4aib_submissions.csv"; a.click();
  };

  if (!initialized || !isAdmin) return null;

  const tabs: { key: "overview"|"submissions"|"map"; label: string; Icon: React.FC<{size?:number}> }[] = [
    { key: "overview",    label: "Overview",    Icon: IcChart  },
    { key: "submissions", label: "Participants", Icon: IcUsers  },
    { key: "map",         label: "Map",          Icon: IcMap    },
  ];

  const stats = [
    { Icon: IcCalendar, label: "Total Events",    value: events.length,      color: "var(--brand-600)",  bg: "var(--brand-50)"  },
    { Icon: IcUsers,    label: "Participants",     value: submissions.length, color: "var(--accent-600)", bg: "var(--accent-50)" },
    { Icon: IcCamera,   label: "Photos Captured",  value: submissions.filter((s) => s.photoBase64).length, color: "var(--yellow-600)", bg: "var(--yellow-50)" },
    { Icon: IcCalendar, label: "Active Events",    value: events.filter((e) => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0))).length, color: "var(--blue-600)", bg: "var(--blue-50)" },
  ];

  return (
    <div>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Edit Event Modal */}
      {editingEvent && (
        <div onClick={() => setEditingEvent(null)} style={{
          position:"fixed", inset:0, zIndex:999,
          background:"rgba(0,0,0,0.55)", backdropFilter:"blur(3px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
        }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width:"100%", maxWidth:"440px" }}>
            <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div className="section-title">Edit Event</div>
                <div style={{ fontSize:"0.8125rem", color:"var(--gray-400)", marginTop:"0.1rem" }}>Update event details</div>
              </div>
              <button onClick={() => setEditingEvent(null)} className="btn btn-ghost btn-sm" style={{ padding:"0.25rem 0.5rem" }}><IcX size={16} /></button>
            </div>
            <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
              {editError && <div className="alert alert-error" style={{ padding:"0.625rem 0.875rem", fontSize:"0.8125rem" }}>{editError}</div>}
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label" htmlFor="dash-edit-name">Event Name</label>
                <input id="dash-edit-name" className="form-input" value={editForm.name} onChange={e => { setEditForm(p => ({...p, name: e.target.value})); setEditError(""); }} />
              </div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label" htmlFor="dash-edit-loc">Location Name</label>
                <input id="dash-edit-loc" className="form-input" value={editForm.locationName} onChange={e => setEditForm(p => ({...p, locationName: e.target.value}))} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label" htmlFor="dash-edit-radius">Allowed Radius (m)</label>
                  <input id="dash-edit-radius" className="form-input" type="number" min={50} max={5000} value={editForm.allowedRadius} onChange={e => { setEditForm(p => ({...p, allowedRadius: e.target.value})); setEditError(""); }} />
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label" htmlFor="dash-edit-date">Event Date</label>
                  <input id="dash-edit-date" className="form-input" type="date" value={editForm.date} onChange={e => setEditForm(p => ({...p, date: e.target.value}))} />
                </div>
              </div>
              <div style={{ display:"flex", gap:"0.5rem", justifyContent:"flex-end", paddingTop:"0.25rem" }}>
                <button onClick={() => setEditingEvent(null)} className="btn btn-secondary btn-sm" disabled={editSaving}>Cancel</button>
                <button onClick={handleEditSave} className="btn btn-primary btn-sm" disabled={editSaving}>
                  {editSaving ? <><span className="spinner" style={{ width:"0.875rem", height:"0.875rem", borderTopColor:"white" }} />Saving…</> : <><IcCheck size={13} />Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-content">

        {/* Header */}
        <header className="app-header">
          <div className="logo-area">
            <button
              onClick={() => setSidebarOpen(true)}
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
            <LogoMark size={32} />
            <div className="logo-text">
              <h1>DL4AIB</h1>
              <p>Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push("/admin/login"); }}
            className="btn btn-ghost btn-sm"
            style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8125rem" }}
          >
            <IcLogOut size={14} />
            Sign out
          </button>
        </header>

        <div className="page-wrapper">
          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
            {stats.map((s) => {
              const Icon = s.Icon;
              return (
                <div key={s.label} className="stat-card">
                  <div className="stat-icon-wrap" style={{ background: s.bg, color: s.color }}>
                    <Icon size={18} />
                  </div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Tab bar + New Event */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", gap: "0.75rem", flexWrap: "wrap" }}>
            <div className="tab-bar">
              {tabs.map((t) => {
                const Icon = t.Icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
                  >
                    <Icon size={13} />
                    {t.label}
                  </button>
                );
              })}
            </div>
            <Link href="/admin/events/create" className="btn btn-primary btn-sm">
              <IcPlus size={14} />
              New Event
            </Link>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="card fade-in">
              <div className="card-body">
                <div className="section-header">
                  <div className="section-title">Events</div>
                </div>

                {events.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <IcCalendar size={22} />
                    </div>
                    <h3>No events yet</h3>
                    <p>Create your first outreach event to start collecting participant data.</p>
                    <Link href="/admin/events/create" className="btn btn-primary btn-sm">
                      <IcPlus size={14} />
                      Create First Event
                    </Link>
                  </div>
                ) : (
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Event Name</th>
                          <th>Location</th>
                          <th>Date</th>
                          <th>Participants</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((ev) => {
                          const count = submissions.filter(s => s.eventId === ev.id).length;
                          const isPast = new Date(ev.date) < new Date(new Date().setHours(0,0,0,0));
                          return (
                            <tr key={ev.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: "var(--gray-900)" }}>{ev.name}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: "0.125rem" }}>
                                  <span className={`badge ${isPast ? "badge-gray" : "badge-green"}`} style={{ fontSize: "0.625rem" }}>
                                    {isPast ? "Past" : "Upcoming"}
                                  </span>
                                </div>
                              </td>
                              <td style={{ color: "var(--gray-500)", fontSize: "0.8125rem" }}>{ev.locationName}</td>
                              <td style={{ color: "var(--gray-500)", fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                                {new Date(ev.date).toLocaleDateString()}
                              </td>
                              <td>
                                <span className="badge badge-blue">{count}</span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                                  <Link href={`/admin/events/${ev.id}/qr`} className="btn btn-secondary btn-xs">
                                    QR Code
                                  </Link>
                                  <Link href={`/event/${ev.slug}`} className="btn btn-ghost btn-xs" target="_blank">
                                    Open
                                  </Link>
                                  <button onClick={() => openEdit(ev)} className="btn btn-ghost btn-xs" style={{ color: "var(--blue-600)" }} title="Edit event">
                                    <IcEdit size={13} />
                                  </button>
                                  <button onClick={() => handleDelete(ev.id, ev.name)} className="btn btn-ghost btn-xs" style={{ color: "var(--red-600)" }}>
                                    <IcTrash size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === "submissions" && (
            <div className="card fade-in">
              <div className="card-body">
                <div className="section-header">
                  <div className="section-title">Participants</div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--gray-400)" }}>
                        <IcFilter size={13} />
                      </div>
                      <select
                        className="form-input form-select"
                        value={filterEvent}
                        onChange={(e) => setFilterEvent(e.target.value)}
                        style={{ paddingLeft: "1.875rem", paddingTop: "0.4375rem", paddingBottom: "0.4375rem", fontSize: "0.8125rem", width: "auto", minWidth: "140px" }}
                      >
                        <option value="all">All Events</option>
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={exportCSVOnly} className="btn btn-secondary btn-xs">
                      <IcExport size={12} />
                      CSV
                    </button>
                    <button onClick={exportCSV} className="btn btn-secondary btn-xs">
                      <IcExport size={12} />
                      Excel
                    </button>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <IcUsers size={22} />
                    </div>
                    <h3>No submissions yet</h3>
                    <p>Participant data will appear here once volunteers start submitting attendance.</p>
                  </div>
                ) : (
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Photo</th>
                          <th>Name</th>
                          <th>State</th>
                          <th>Gender</th>
                          <th>Event</th>
                          <th>Time</th>
                          <th>Coordinates</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((s) => (
                          <tr key={s.id}>
                            <td>
                              {s.photoBase64 ? (
                                <img
                                  src={s.photoBase64}
                                  alt={s.fullName}
                                  className="photo-thumb"
                                  onClick={() => setPhotoModal(s.photoBase64)}
                                />
                              ) : (
                                <div style={{
                                  width: "2.5rem", height: "2.5rem",
                                  borderRadius: "var(--r-sm)",
                                  background: "var(--gray-100)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  color: "var(--gray-400)",
                                }}>
                                  <IcUser size={16} />
                                </div>
                              )}
                            </td>
                            <td><span style={{ fontWeight: 600, color: "var(--gray-900)" }}>{s.fullName}</span></td>
                            <td><span className="badge badge-blue">{s.stateCode}</span></td>
                            <td><span className="badge badge-gray">{s.gender}</span></td>
                            <td style={{ fontSize: "0.8rem", color: "var(--gray-500)", maxWidth: "150px" }} className="truncate">{s.eventName}</td>
                            <td style={{ fontSize: "0.75rem", color: "var(--gray-400)", whiteSpace: "nowrap" }}>
                              {new Date(s.timestamp).toLocaleString()}
                            </td>
                            <td style={{ fontSize: "0.75rem", color: "var(--gray-400)", fontFamily: "monospace" }}>
                              {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
                            </td>
                            <td>
                              <button
                                onClick={() => setConfirmSub(s)}
                                className="btn btn-ghost btn-xs"
                                style={{ color: "var(--red-600)" }}
                                title="Delete fraudulent entry"
                              >
                                <IcTrash size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map Tab */}
          {activeTab === "map" && (
            <div className="card fade-in">
              <div className="card-body">
                <div className="section-title" style={{ marginBottom: "1rem" }}>Submission Map</div>
                {submissions.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><IcMap size={22} /></div>
                    <h3>No data to display</h3>
                    <p>Submission locations will appear on the map once participants start recording attendance.</p>
                  </div>
                ) : (
                  <div className="map-container">
                    <MapView submissions={submissions} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {photoModal && (
        <div className="modal-backdrop" onClick={() => setPhotoModal(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "var(--r-xl)", overflow: "hidden" }}>
            <img src={photoModal} alt="Participant photo" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        </div>
      )}

      {/* Confirm Delete Submission Modal */}
      {confirmSub && (
        <div onClick={() => setConfirmSub(null)} style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: "400px" }}>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ width: "44px", height: "44px", flexShrink: 0, background: "var(--red-50)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red-600)" }}>
                  <IcTrash size={20} />
                </div>
                <div>
                  <div className="section-title" style={{ marginBottom: "0.375rem" }}>Delete Submission?</div>
                  <p style={{ fontSize: "0.875rem", color: "var(--gray-500)", lineHeight: 1.6 }}>
                    Remove <strong style={{ color: "var(--gray-900)" }}>{confirmSub.fullName}</strong> ({confirmSub.stateCode}) from <strong style={{ color: "var(--gray-900)" }}>{confirmSub.eventName}</strong>? This cannot be undone.
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button onClick={() => setConfirmSub(null)} className="btn btn-secondary btn-sm" disabled={deletingSubId === confirmSub.id}>Cancel</button>
                <button
                  onClick={() => handleDeleteSubmission(confirmSub)}
                  className="btn btn-danger btn-sm"
                  disabled={deletingSubId === confirmSub.id}
                >
                  {deletingSubId === confirmSub.id
                    ? <><span className="spinner" style={{ width: "0.875rem", height: "0.875rem", borderTopColor: "white" }} />Deleting…</>
                    : <><IcTrash size={13} />Delete Entry</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
