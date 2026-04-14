"use client";
import Link from "next/link";
import { IcQr, IcPin, IcCamera, IcChart, IcZap, IcExport, IcCalendar } from "@/components/Icons";
import { LogoMark } from "@/components/AppLogo";

const features = [
  { Icon: IcQr,     title: "QR Code Access",     desc: "Volunteers scan a QR code to instantly open the attendance form — no app download or login needed." },
  { Icon: IcPin,    title: "GPS Verification",    desc: "Submissions are validated against the event location to prevent fraudulent or remote entries." },
  { Icon: IcCamera, title: "Photo Evidence",      desc: "Camera capture ensures each attendee has a live photo recorded at the time of submission." },
  { Icon: IcChart,  title: "Admin Analytics",     desc: "View maps, tables, and exportable reports of every participant across all outreach events." },
  { Icon: IcZap,    title: "Real-time Records",   desc: "Submissions are saved instantly — participant counts update live on the admin dashboard." },
  { Icon: IcExport, title: "CSV & Excel Export",  desc: "Download full participant data in CSV or Excel format for reporting and impact measurement." },
];

const steps = [
  { num: "1", Icon: IcCalendar, title: "Admin Creates Event",  desc: "Set location, radius, and date — get a unique QR code instantly" },
  { num: "2", Icon: IcQr,       title: "Volunteers Scan QR",   desc: "Opens the submission form with event details pre-filled" },
  { num: "3", Icon: IcCamera,   title: "Capture & Submit",     desc: "Selfie, GPS auto-captures, tap submit — done in 30 seconds" },
  { num: "4", Icon: IcChart,    title: "Analyse Results",      desc: "Admin views the map, table, and downloads the full report" },
];


export default function LandingPage() {
  const GREEN = "rgba(34,197,94,";

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <header style={{
        background: "#052e16",
        padding: "0 1.5rem", height: "56px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <LogoMark size={32} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "white", letterSpacing: "-0.02em" }}>
              DL4AIB Tracker
            </span>
            <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)" }}>
              Digital Literacy for All Ibadan
            </span>
          </div>
        </div>
        <Link href="/admin/login" style={{
          display: "inline-flex", alignItems: "center", gap: "0.375rem",
          background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px",
          padding: "0.4375rem 0.875rem", fontSize: "0.8125rem", fontWeight: 600,
          textDecoration: "none", cursor: "pointer", transition: "background 0.15s",
        }}>
          Admin Login
        </Link>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: "#052e16", padding: "5rem 1.5rem 4rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 50% at 50% -10%, ${GREEN}0.22) 0%, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: `${GREEN}0.12)`, border: `1px solid ${GREEN}0.25)`,
            borderRadius: "9999px", padding: "0.35rem 1rem", marginBottom: "1.75rem",
            color: "#4ade80", fontSize: "0.8125rem", fontWeight: 600,
          }}>
            Outreach Made Simple
          </div>

          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "clamp(2rem,5vw,3.25rem)", fontWeight: 800, color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.04em", marginBottom: "1.25rem" }}>
            Track Every Participants,{" "}
            <span style={{ background: "linear-gradient(90deg, #4ade80, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Every Time.
            </span>
          </h1>

          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.0625rem", lineHeight: 1.75, maxWidth: "540px", margin: "0 auto 2.5rem" }}>
            Digital Literacy for All Ibadan — a tool to record outreach attendance with photo evidence, GPS validation, and real-time analytics, right from any smartphone.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/admin/login" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "#16a34a", color: "white", borderRadius: "10px",
              padding: "0.75rem 1.75rem", fontWeight: 700, fontSize: "0.9375rem",
              textDecoration: "none", boxShadow: "0 4px 16px rgba(22,163,74,0.4)",
              transition: "background 0.15s, transform 0.15s",
            }}>
              Get Started
            </Link>
            <a href="#features" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px",
              padding: "0.75rem 1.5rem", fontWeight: 600, fontSize: "0.9375rem",
              textDecoration: "none",
            }}>
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section style={{ background: "#052e16", borderTop: `1px solid ${GREEN}0.12)`, borderBottom: "3px solid #16a34a" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", textAlign: "center" }}>
          {[
            { v: "100%",  l: "Mobile-Friendly" },
            { v: "GPS",   l: "Location-Verified" },
            { v: "0 min", l: "Setup Required" },
          ].map((s, i) => (
            <div key={s.l} style={{ padding: "1.5rem 1rem", borderRight: i < 2 ? `1px solid ${GREEN}0.12)` : "none" }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "1.5rem", fontWeight: 800, background: "linear-gradient(135deg,#4ade80,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em" }}>
                {s.v}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "5rem 1.5rem", background: "#f8fafc" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "1.875rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.035em", marginBottom: "0.5rem" }}>
              Everything You Need in the Field
            </h2>
            <p style={{ color: "#64748b", fontSize: "1rem" }}>
              Designed for NGO teams working in low-connectivity environments
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1rem" }}>
            {features.map(({ Icon, title, desc }) => (
              <div key={title} style={{
                background: "white", borderRadius: "16px",
                boxShadow: "0 1px 4px rgba(15,23,42,0.06), 0 2px 6px rgba(15,23,42,0.04)",
                border: "1px solid #e2e8f0", padding: "1.5rem",
                display: "flex", gap: "1rem", alignItems: "flex-start",
              }}>
                <div style={{ width: "40px", height: "40px", flexShrink: 0, background: "#f0fdf4", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.375rem", fontSize: "0.9375rem", letterSpacing: "-0.015em" }}>{title}</h3>
                  <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.65 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ background: "white", padding: "5rem 1.5rem", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "1.875rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.035em", marginBottom: "3rem" }}>
            How It Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: "2rem" }}>
            {steps.map(({ num, Icon, title, desc }) => (
              <div key={num} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: "56px", height: "56px", background: "#052e16", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 16px rgba(5,46,22,0.3)" }}>
                    <Icon size={22} />
                  </div>
                  <div style={{ position: "absolute", top: "-8px", right: "-8px", width: "22px", height: "22px", background: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 800, color: "white", boxShadow: "0 2px 6px rgba(22,163,74,0.4)" }}>
                    {num}
                  </div>
                </div>
                <h3 style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9375rem", letterSpacing: "-0.015em" }}>{title}</h3>
                <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.65, textAlign: "center" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "#052e16", padding: "5rem 1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 70% at 50% 100%, ${GREEN}0.14) 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "520px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "1.875rem", fontWeight: 800, color: "white", letterSpacing: "-0.035em", marginBottom: "1rem" }}>
            Ready to track your first event?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem", lineHeight: 1.7 }}>
            Log in as admin, create an event, and share the QR code in seconds.
          </p>
          <Link href="/admin/login" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: "#16a34a", color: "white", borderRadius: "10px",
            padding: "0.875rem 2rem", fontWeight: 700, fontSize: "1rem",
            textDecoration: "none", boxShadow: "0 4px 20px rgba(22,163,74,0.45)",
          }}>
            Open Admin Dashboard
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#052e16", borderTop: `1px solid ${GREEN}0.08)`, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "1.5rem", fontSize: "0.8125rem" }}>
        <p>© {new Date().getFullYear()} Digital Literacy for All Ibadan — Outreach Tracker</p>
      </footer>
    </div>
  );
}
