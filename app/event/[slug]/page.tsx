"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { generateId, distanceMetres, isRateLimited } from "@/lib/storage";
import { getEventBySlug, saveSubmission } from "@/lib/actions";
import { Event } from "@/lib/types";
import PhotoCapture from "@/components/PhotoCapture";
import { IcPin, IcCalendar, IcUser, IcCheck, IcRefresh, IcGps, IcLoader } from "@/components/Icons";
import { LogoMark } from "@/components/AppLogo";

type Step = "loading"|"not-found"|"form"|"submitting"|"success"|"outside-radius"|"rate-limited";

interface FormState {
  fullName: string; stateCode: string;
  gender: ""|"Male"|"Female"|"Prefer not to say";
  photo: string; latitude: number|null; longitude: number|null; address: string;
}

const AppLogo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
    <LogoMark size={32} />
    <div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "0.9375rem", letterSpacing: "-0.02em", color: "white", lineHeight: 1.2 }}>
        DL4AIB
      </div>
      <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.2 }}>
        Digital Literacy for All Ibadan
      </div>
    </div>
  </div>
);

export default function EventSubmissionPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event|null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [gpsStatus, setGpsStatus] = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [submittedName, setSubmittedName] = useState("");

  const [form, setForm] = useState<FormState>({
    fullName: "", stateCode: "", gender: "",
    photo: "", latitude: null, longitude: null, address: "",
  });

  const set = (k: keyof FormState, v: string|number|null) =>
    setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    async function load() {
      const ev = await getEventBySlug(slug);
      if (!ev) { setStep("not-found"); return; }
      setEvent(ev);
      setStep("form");
    }
    load();
  }, [slug]);

  const fetchGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsStatus("error"); return; }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        set("latitude", lat); set("longitude", lon);
        setGpsStatus("ok");
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data.display_name) set("address", data.display_name);
        } catch { /* ignore */ }
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (step === "form") fetchGPS(); }, [step, fetchGPS]);

  const validate = () => {
    const errs: Record<string,string> = {};
    if (!form.fullName.trim())  errs.fullName  = "Full name is required";
    if (!form.stateCode.trim()) errs.stateCode = "State code is required";
    if (!form.gender)           errs.gender    = "Please select your gender";
    if (!form.photo)            errs.photo     = "Please capture a photo";
    if (form.latitude === null || form.longitude === null)
      errs.gps = "Location is required — please allow GPS access";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !validate()) return;
    if (isRateLimited(event.id)) { setStep("rate-limited"); return; }
    const dist = distanceMetres(event.latitude, event.longitude, form.latitude!, form.longitude!);
    if (dist > event.allowedRadius) { setStep("outside-radius"); return; }

    setStep("submitting");
    try {
      await saveSubmission({
        id: generateId(), eventId: event.id, eventName: event.name,
        fullName: form.fullName.trim(), stateCode: form.stateCode.trim().toUpperCase(),
        gender: form.gender as "Male"|"Female"|"Prefer not to say",
        photoBase64: form.photo, latitude: form.latitude!, longitude: form.longitude!,
        address: form.address, timestamp: new Date().toISOString(),
      });
      setSubmittedName(form.fullName.trim());
      setStep("success");
    } catch (e) {
      console.error(e);
      setStep("form");
      alert("Submission failed. Please check your connection and try again.");
    }
  };

  const resetForm = () => {
    setForm({ fullName: "", stateCode: "", gender: "", photo: "", latitude: null, longitude: null, address: "" });
    setErrors({}); setGpsStatus("idle"); setStep("form");
    setTimeout(fetchGPS, 200);
  };

  // Shared header
  const header = (
    <header className="app-header">
      <AppLogo />
    </header>
  );

  if (step === "loading") return (
    <div style={{ minHeight: "100vh", background: "var(--gray-950)" }}>
      {header}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 1rem", gap: "1rem" }}>
        <span className="spinner" style={{ width: "2rem", height: "2rem", borderTopColor: "var(--brand-500)" }} />
        <p style={{ color: "var(--gray-500)", fontSize: "0.875rem" }}>Loading event…</p>
      </div>
    </div>
  );

  if (step === "not-found") return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
      {header}
      <div style={{ maxWidth: "400px", margin: "5rem auto", padding: "0 1rem", textAlign: "center" }}>
        <div style={{ width: "4rem", height: "4rem", background: "var(--gray-100)", borderRadius: "var(--r-xl)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", color: "var(--gray-400)" }}>
          <IcLoader size={28} />
        </div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "var(--gray-900)", fontSize: "1.25rem", marginBottom: "0.5rem", letterSpacing: "-0.025em" }}>
          Event Not Found
        </h2>
        <p style={{ color: "var(--gray-500)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          This event link is invalid or has expired. Please scan the correct QR code.
        </p>
        <Link href="/" className="btn btn-secondary btn-sm">
          <IcRefresh size={14} />
          Go Home
        </Link>
      </div>
    </div>
  );

  if (step === "outside-radius") return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
      {header}
      <div style={{ maxWidth: "420px", margin: "4rem auto", padding: "0 1rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{ width: "4rem", height: "4rem", background: "var(--red-50)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", color: "var(--red-500)" }}>
            <IcPin size={26} />
          </div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "var(--gray-900)", fontSize: "1.125rem", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
            Outside Event Location
          </h2>
          <div className="alert alert-error" style={{ textAlign: "left", marginBottom: "1.5rem" }}>
            You are not within the event boundary. Please move closer to <strong>{event?.locationName}</strong> and try again.
            <br /><span style={{ marginTop: "0.375rem", display: "block" }}>Required within <strong>{event?.allowedRadius}m</strong></span>
          </div>
          <button onClick={resetForm} className="btn btn-primary btn-full">
            <IcRefresh size={14} />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  if (step === "rate-limited") return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
      {header}
      <div style={{ maxWidth: "420px", margin: "4rem auto", padding: "0 1rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{ width: "4rem", height: "4rem", background: "var(--yellow-50)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", color: "var(--yellow-600)" }}>
            <IcLoader size={26} />
          </div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "var(--gray-900)", fontSize: "1.125rem", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
            Please Wait
          </h2>
          <p style={{ color: "var(--gray-500)", marginBottom: "1.5rem", lineHeight: 1.6, fontSize: "0.875rem" }}>
            You submitted recently. Please wait 60 seconds before adding another participant.
          </p>
          <button onClick={resetForm} className="btn btn-primary btn-full">
            <IcRefresh size={14} />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  if (step === "success") return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
      {header}
      <div style={{ maxWidth: "420px", margin: "3rem auto", padding: "0 1rem" }}>
        <div className="card fade-in">
          <div style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
            <div className="success-check" style={{ marginBottom: "1.5rem" }}>
              <IcCheck size={28} color="white" />
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--gray-900)", letterSpacing: "-0.025em", marginBottom: "0.5rem" }}>
              Attendance Recorded
            </h2>
            <p style={{ color: "var(--gray-500)", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              <strong style={{ color: "var(--gray-800)" }}>{submittedName}</strong> has been successfully registered for:
            </p>
            <div style={{
              background: "var(--accent-50)", border: "1.5px solid var(--accent-100)",
              borderRadius: "var(--r-md)", padding: "0.625rem 1rem",
              margin: "1rem 0 1.5rem", color: "var(--accent-700)", fontWeight: 600, fontSize: "0.9rem",
            }}>
              {event?.name}
            </div>
            <p style={{ color: "var(--gray-400)", fontSize: "0.75rem", marginBottom: "1.75rem" }}>
              {new Date().toLocaleString()}
            </p>
            <button onClick={resetForm} className="btn btn-primary btn-full">
              <IcUser size={14} />
              Add Another Participant
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Main form
  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
      {header}

      {/* Event banner */}
      <div style={{ background: "var(--gray-900)", padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "540px", margin: "0 auto" }}>
          <p style={{ fontSize: "0.675rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
            Outreach Event
          </p>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "white", letterSpacing: "-0.02em", marginBottom: "0.375rem" }}>
            {event?.name}
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "rgba(255,255,255,0.45)", fontSize: "0.8125rem" }}>
              <IcPin size={12} />{event?.locationName}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "rgba(255,255,255,0.35)", fontSize: "0.8125rem" }}>
              <IcCalendar size={12} />{event && new Date(event.date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "540px", margin: "0 auto", padding: "1.25rem 1rem" }}>
        {/* GPS status */}
        <div className={`alert ${gpsStatus === "ok" ? "alert-success" : gpsStatus === "error" ? "alert-error" : "alert-info"}`} style={{ marginBottom: "1.25rem" }}>
          {gpsStatus === "loading" && (
            <><span className="spinner" style={{ width: "1rem", height: "1rem" }} />Detecting your location…</>
          )}
          {gpsStatus === "ok" && (
            <><IcGps size={15} />Location captured: {form.latitude?.toFixed(5)}, {form.longitude?.toFixed(5)}</>
          )}
          {gpsStatus === "error" && (
            <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Could not get GPS.
              <button onClick={fetchGPS} style={{ marginLeft: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700, textDecoration: "underline", padding: 0 }}>
                Retry
              </button>
            </>
          )}
          {gpsStatus === "idle" && <><IcGps size={15} />Waiting for GPS…</>}
        </div>

        <div className="card">
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
            <div className="section-title">Attendance Form</div>
            <p style={{ color: "var(--gray-500)", fontSize: "0.875rem", marginTop: "0.2rem" }}>
              Fill in participant details and capture a live photo.
            </p>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="fullName"
                  className="form-input"
                  type="text"
                  placeholder="Enter participant's full name"
                  value={form.fullName}
                  onChange={(e) => { set("fullName", e.target.value); setErrors((p) => ({ ...p, fullName: "" })); }}
                  autoComplete="name"
                />
                {errors.fullName && <p style={{ color: "var(--red-500)", fontSize: "0.78rem", marginTop: "0.25rem" }}>{errors.fullName}</p>}
              </div>

              {/* State Code */}
              <div className="form-group">
                <label className="form-label" htmlFor="stateCode">
                  State Code <span className="required">*</span>
                </label>
                <input
                  id="stateCode"
                  className="form-input"
                  type="text"
                  placeholder="e.g. OY/25C/1300"
                  maxLength={15}
                  value={form.stateCode}
                  onChange={(e) => { set("stateCode", e.target.value); setErrors((p) => ({ ...p, stateCode: "" })); }}
                  style={{ textTransform: "uppercase" }}
                />
                {errors.stateCode && <p style={{ color: "var(--red-500)", fontSize: "0.78rem", marginTop: "0.25rem" }}>{errors.stateCode}</p>}
              </div>

              {/* Gender */}
              <div className="form-group">
                <label className="form-label" htmlFor="gender">
                  Gender <span className="required">*</span>
                </label>
                <select
                  id="gender"
                  className="form-input form-select"
                  value={form.gender}
                  onChange={(e) => { set("gender", e.target.value); setErrors((p) => ({ ...p, gender: "" })); }}
                >
                  <option value="">— Select gender —</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender && <p style={{ color: "var(--red-500)", fontSize: "0.78rem", marginTop: "0.25rem" }}>{errors.gender}</p>}
              </div>

              {/* Photo */}
              <div className="form-group">
                <label className="form-label">
                  Photo <span className="required">*</span>
                </label>
                <p style={{ fontSize: "0.78rem", color: "var(--gray-400)", marginBottom: "0.75rem" }}>
                  Use your device camera for a live photo. Gallery uploads are not permitted.
                </p>
                <PhotoCapture
                  onCapture={(b64) => { set("photo", b64); setErrors((p) => ({ ...p, photo: "" })); }}
                  captured={form.photo || null}
                  eventName={event?.name}
                />
                {errors.photo && <p style={{ color: "var(--red-500)", fontSize: "0.78rem", marginTop: "0.375rem" }}>{errors.photo}</p>}
              </div>

              {/* GPS error */}
              {errors.gps && (
                <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {errors.gps}
                </div>
              )}

              {/* Detected address */}
              {form.address && (
                <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "var(--accent-50)", borderRadius: "var(--r-md)", border: "1.5px solid var(--accent-100)" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--accent-600)", fontWeight: 600, marginBottom: "0.2rem" }}>Detected address</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--accent-700)", lineHeight: 1.5 }}>{form.address}</p>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={step === "submitting"}
                style={{ height: "44px", fontSize: "0.9375rem", marginTop: "0.5rem" }}
              >
                {step === "submitting" ? (
                  <><span className="spinner" style={{ width: "1rem", height: "1rem", borderTopColor: "white" }} />Submitting…</>
                ) : (
                  <><IcCheck size={15} />Submit Attendance</>
                )}
              </button>

              <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--gray-400)", marginTop: "0.875rem", lineHeight: 1.5 }}>
                By submitting, your location and photo will be recorded for this outreach event.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
