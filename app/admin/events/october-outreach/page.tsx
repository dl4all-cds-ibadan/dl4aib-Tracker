"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import { getEvents, saveEvent } from "@/lib/actions";
import { Event } from "@/lib/types";
import { IcArrowLeft, IcCalendar, IcCheck, IcCopy, IcLink, IcMenu, IcShare } from "@/components/Icons";
import { LogoMark } from "@/components/AppLogo";

const EVENT_DATE = "2026-10-22";
const EVENT_RADIUS_METRES = 200;

const OCTOBER_LOCATIONS = [
  {
    id: "oct-2026-akinyele-old-oyo-road",
    name: "October Informal Sector Outreach - Akinyele LGA (Old Oyo Road)",
    locationName: "Akinyele LGA - Old Oyo Road",
    latitude: 7.530032,
    longitude: 3.911439,
  },
  {
    id: "oct-2026-ibadan-north-east-iwo-road",
    name: "October Informal Sector Outreach - Ibadan North-East (Iwo Road Market)",
    locationName: "Ibadan North-East - Iwo Road Market",
    latitude: 7.404173,
    longitude: 3.945219,
  },
  {
    id: "oct-2026-egbeda-monatan-market",
    name: "October Informal Sector Outreach - Egbeda LGA (Monatan Market)",
    locationName: "Egbeda LGA - Monatan Market",
    latitude: 7.41327,
    longitude: 3.95567,
  },
  {
    id: "oct-2026-oluyole-adelabu-market",
    name: "October Informal Sector Outreach - Oluyole LGA (Adelabu Market, Orita Challenge)",
    locationName: "Oluyole LGA - Adelabu Market (Orita Challenge)",
    latitude: 7.3389247,
    longitude: 3.8708789,
  },
  {
    id: "oct-2026-ibadan-north-west-eleyele-market",
    name: "October Informal Sector Outreach - Ibadan North-West (Eleyele Market)",
    locationName: "Ibadan North-West - Eleyele Market",
    latitude: 7.4191,
    longitude: 3.85976,
  },
  {
    id: "oct-2026-ibadan-north-ashi-market",
    name: "October Informal Sector Outreach - Ibadan North (Ashi Market)",
    locationName: "Ibadan North - Ashi Market",
    latitude: 7.430551,
    longitude: 3.913116,
  },
  {
    id: "oct-2026-ido-ologuneru-market",
    name: "October Informal Sector Outreach - Ido LGA (Ologuneru Market)",
    locationName: "Ido Local Government - Ologuneru Market",
    latitude: 7.4352677,
    longitude: 3.8314397,
  },
  {
    id: "oct-2026-ibadan-south-west-molete-market",
    name: "October Informal Sector Outreach - Ibadan South-West (Molete Market)",
    locationName: "Ibadan South-West - Molete Market",
    latitude: 7.358605,
    longitude: 3.888971,
  },
  {
    id: "oct-2026-ibadan-south-east-oja-oba-ileapo",
    name: "October Informal Sector Outreach - Ibadan South-East (Oja Oba Ileapo)",
    locationName: "Ibadan South-East - Oja Oba Ileapo",
    latitude: 7.3729907,
    longitude: 3.8956887,
  },
] as const;

function toEvent(location: (typeof OCTOBER_LOCATIONS)[number]): Event {
  return {
    ...location,
    slug: location.id,
    allowedRadius: EVENT_RADIUS_METRES,
    date: EVENT_DATE,
    isOpen: true,
    preOutreachOpen: false,
    postOutreachOpen: false,
    createdAt: new Date().toISOString(),
  };
}

function OctoberOutreachContent() {
  const { isAdmin, initialized } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialized && !isAdmin) router.push("/admin/login");
  }, [initialized, isAdmin, router]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const createEvents = async () => {
    if (!initialized || !isAdmin || working) return;
    setWorking(true);
    setError("");
    try {
      const existingEvents = await getEvents();
      const existingById = new Map(existingEvents.map((event) => [event.id, event]));
      const generatedEvents = OCTOBER_LOCATIONS.map((location) => {
        const existing = existingById.get(location.id);
        return existing ?? toEvent(location);
      });

      for (const event of generatedEvents) {
        if (!existingById.has(event.id)) await saveEvent(event);
      }
      setEvents(generatedEvents);
    } catch (createError) {
      console.error("Failed to create October outreach events:", createError);
      setError("Some events may not have been created. Click the button again to safely finish; existing events will be reused.");
    } finally {
      setWorking(false);
    }
  };

  const message = events.length
    ? [
        "📍 October Informal Sector Outreach — 22 October 2026",
        "",
        ...events.flatMap((event, index) => [
          `${index + 1}. ${event.name}`,
          `${origin}/event/${event.slug}`,
          "",
        ]),
        "Please use the link for the correct outreach location and complete attendance at the event site. Each participant must submit Pre-Outreach attendance when it is opened and Post-Outreach attendance when it is opened; both are required for a complete attendance record. Please allow location access and complete the form at the named location. Thank you.",
      ].join("\n")
    : "";

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      console.error("Failed to copy outreach message:", copyError);
      setError("Could not copy the message. Select and copy it from the message box below.");
    }
  };

  if (!initialized || !isAdmin) return null;

  return (
    <div className="admin-layout">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-content">
        <header className="app-header">
          <div className="logo-area">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
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
              <p>October Outreach</p>
            </div>
          </div>
        </header>

        <main className="page-wrapper">
          <Link href="/admin/events" className="btn btn-ghost btn-sm" style={{ marginBottom: "1rem" }}>
            <IcArrowLeft size={14} />Back to events
          </Link>

          <div style={{ marginBottom: "1.25rem" }}>
            <div className="page-title">October Informal Sector Outreach</div>
            <div className="page-subtitle">
              Create the nine location events for 22 October 2026 and prepare a shareable WhatsApp message.
            </div>
          </div>

          <section className="card" style={{ marginBottom: "1rem" }}>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", color: "var(--gray-600)", fontSize: "0.875rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  <IcCalendar size={15} />22 October 2026
                </span>
                <span>·</span>
                <span>9 locations</span>
                <span>·</span>
                <span>200m attendance radius</span>
              </div>
              <p style={{ color: "var(--gray-500)", fontSize: "0.8125rem", lineHeight: 1.6, margin: 0 }}>
                Events will be created as open, but both attendance stages will start closed. You can open Pre-Outreach and Post-Outreach separately from the events dashboard.
              </p>
              <div>
                <button className="btn btn-primary" onClick={createEvents} disabled={working}>
                  {working
                    ? <><span className="spinner" style={{ width: "0.875rem", height: "0.875rem", borderTopColor: "white" }} />Creating events…</>
                    : <><IcCheck size={15} />{events.length ? "Refresh event links" : "Create all 9 events and generate links"}</>
                  }
                </button>
              </div>
              {error && <div className="alert alert-error" role="alert">{error}</div>}
            </div>
          </section>

          {events.length > 0 && (
            <>
              <section className="card" style={{ marginBottom: "1rem" }}>
                <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Event links</h2>
                  {events.map((event, index) => (
                    <div key={event.id} style={{
                      display: "grid", gridTemplateColumns: "2rem minmax(0, 1fr)", gap: "0.625rem",
                      padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                    }}>
                      <strong style={{ color: "var(--brand-600)" }}>{index + 1}.</strong>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "var(--gray-800)", marginBottom: "0.25rem" }}>{event.name}</div>
                        <a href={`${origin}/event/${event.slug}`} target="_blank" rel="noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", overflowWrap: "anywhere", fontSize: "0.8125rem" }}>
                          <IcLink size={13} />{origin}/event/{event.slug}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card">
                <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <h2 className="section-title" style={{ margin: 0 }}>WhatsApp message</h2>
                  <textarea
                    className="form-input"
                    aria-label="Prepared WhatsApp message"
                    value={message}
                    readOnly
                    rows={Math.min(24, events.length * 3 + 7)}
                    style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button className="btn btn-secondary" onClick={copyMessage}>
                      {copied ? <><IcCheck size={14} />Copied</> : <><IcCopy size={14} />Copy message</>}
                    </button>
                    <a
                      className="btn btn-primary"
                      href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <IcShare size={14} />Open in WhatsApp
                    </a>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function OctoberOutreachPage() {
  return (
    <AuthProvider>
      <OctoberOutreachContent />
    </AuthProvider>
  );
}
