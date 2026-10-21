"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { generateId, distanceMetres, isRateLimited, saveOfflineSubmission, getOfflineSubmissions, removeOfflineSubmission } from "@/lib/storage";
import { getAttendanceRoute, getEventBySlug, saveSubmission, type AttendanceSnapshot } from "@/lib/actions";
import { AttendancePhase, Event, Submission } from "@/lib/types";
import PhotoCapture from "@/components/PhotoCapture";
import { IcPin, IcCalendar, IcUser, IcCheck, IcRefresh, IcGps, IcLoader, IcLock } from "@/components/Icons";
import { LogoMark } from "@/components/AppLogo";

type Step = "loading"|"not-found"|"event-closed"|"phase-closed"|"already-complete"|"form"|"submitting"|"success"|"offline-success"|"outside-radius"|"rate-limited";

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

function AttendanceSummary({
  pre,
  post,
  preOpen,
  postOpen,
}: {
  pre?: AttendanceSnapshot;
  post?: AttendanceSnapshot;
  preOpen: boolean;
  postOpen: boolean;
}) {
  const rows: { title: string; snapshot?: AttendanceSnapshot; open: boolean }[] = [
    { title: "Pre-Outreach", snapshot: pre, open: preOpen },
    { title: "Post-Outreach", snapshot: post, open: postOpen },
  ];
  const complete = Boolean(pre && post);

  return (
    <div style={{ textAlign: "left", margin: "1.25rem 0", padding: "1rem", background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)" }}>
      <div style={{ fontWeight: 700, color: complete ? "var(--accent-700)" : "var(--gray-800)", marginBottom: "0.75rem" }}>
        {complete ? "Attendance complete — both forms recorded" : "Attendance records"}
      </div>
      {rows.map(({ title, snapshot, open }) => (
        <div key={title} style={{ padding: "0.625rem 0", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", fontWeight: 600, color: "var(--gray-800)" }}>
            <span>{title}</span>
            <span style={{ color: snapshot ? "var(--accent-600)" : "var(--gray-500)" }}>
              {snapshot ? `Complete · Form ${open ? "open" : "closed"}` : `Not recorded · Form ${open ? "open" : "closed"}`}
            </span>
          </div>
          {snapshot && (
            <div style={{ color: "var(--gray-500)", fontSize: "0.78rem", marginTop: "0.25rem", lineHeight: 1.5 }}>
              <div>{new Date(snapshot.timestamp).toLocaleString()}</div>
              <div>{snapshot.address || `${snapshot.latitude.toFixed(5)}, ${snapshot.longitude.toFixed(5)}`}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function EventSubmissionPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event|null>(null);
  const [phase, setPhase] = useState<AttendancePhase>("PRE_OUTREACH");
  const [step, setStep] = useState<Step>("loading");
  const [gpsStatus, setGpsStatus] = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [submittedName, setSubmittedName] = useState("");
  const [preOutreachRecorded, setPreOutreachRecorded] = useState(false);
  const [attendanceSnapshots, setAttendanceSnapshots] = useState<{
    pre?: AttendanceSnapshot;
    post?: AttendanceSnapshot;
  }>({});
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [stageNotice, setStageNotice] = useState("");

  const [form, setForm] = useState<FormState>({
    fullName: "", stateCode: "", gender: "",
    photo: "", latitude: null, longitude: null, address: "",
  });

  const set = (k: keyof FormState, v: string|number|null) =>
    setForm((p) => ({ ...p, [k]: v }));

  const routeForStateCode = useCallback(async (ev: Event, stateCode: string) => {
    const route = await getAttendanceRoute(ev.id, stateCode);
    setAttendanceSnapshots({ pre: route.pre, post: route.post });
    setPreOutreachRecorded(Boolean(route.pre));
    setEvent((current) => current ? {
      ...current,
      preOutreachOpen: route.preOpen,
      postOutreachOpen: route.postOpen,
    } : current);
    if (route.status === "complete") {
      setStep("already-complete");
      return;
    }
    if (route.status === "closed") {
      setStep("phase-closed");
      return;
    }
    if (route.phase !== phase) {
      setPhase(route.phase);
      setForm((previous) => ({ ...previous, photo: "", latitude: null, longitude: null, address: "" }));
      setGpsStatus("idle");
      setStageNotice(route.phase === "POST_OUTREACH"
        ? "Pre-Outreach attendance is already recorded or closed. Continue with Post-Outreach attendance."
        : "");
    }
    setStep("form");
  }, [phase]);

  useEffect(() => {
    async function load() {
      const ev = await getEventBySlug(slug);
      if (!ev) { setStep("not-found"); return; }
      if (!ev.isOpen) { setEvent(ev); setStep("event-closed"); return; }
      setEvent(ev);
      setOfflineCount(getOfflineSubmissions().length);
      const savedStateCode = sessionStorage.getItem(`dl4aib_statecode_${slug}`) ?? "";
      if (savedStateCode) {
        setForm((previous) => ({ ...previous, stateCode: savedStateCode }));
        try {
          await routeForStateCode(ev, savedStateCode);
        } catch (error) {
          console.error("Unable to resolve attendance stage:", error);
          setErrors({ submit: "Could not check existing attendance. Refresh and try again." });
          setPhase(ev.preOutreachOpen ? "PRE_OUTREACH" : "POST_OUTREACH");
          setStep("form");
        }
      } else if (ev.preOutreachOpen) {
        setPhase("PRE_OUTREACH");
        setStep("form");
      } else if (ev.postOutreachOpen) {
        setPhase("POST_OUTREACH");
        setStep("form");
      } else {
        setStep("phase-closed");
      }
    }
    load();
  }, [routeForStateCode, slug]);

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
  useEffect(() => { if (step === "form") fetchGPS(); }, [step, phase, fetchGPS]);

  const handleStateCodeBlur = async () => {
    if (!event || !form.stateCode.trim()) return;
    try {
      await routeForStateCode(event, form.stateCode);
    } catch (error) {
      console.error("Unable to resolve attendance stage:", error);
      setErrors((previous) => ({ ...previous, submit: "Could not check existing attendance. Please try again." }));
    }
  };

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
    if (isRateLimited(event.id, phase)) { setStep("rate-limited"); return; }
    const dist = distanceMetres(event.latitude, event.longitude, form.latitude!, form.longitude!);
    if (dist > event.allowedRadius) { setStep("outside-radius"); return; }

    setStep("submitting");
    const subPayload: Submission = {
      id: generateId(), eventId: event.id, eventName: event.name,
      fullName: form.fullName.trim(), stateCode: form.stateCode.trim().toUpperCase(),
      gender: form.gender as "Male"|"Female"|"Prefer not to say",
      photoBase64: form.photo, latitude: form.latitude!, longitude: form.longitude!,
      address: form.address, timestamp: new Date().toISOString(),
      phase,
    };

    const queueOffline = () => {
      saveOfflineSubmission(subPayload);
      setSubmittedName(form.fullName.trim());
      setOfflineCount((count) => count + 1);
      if (phase === "PRE_OUTREACH" && event.postOutreachOpen) {
        setPhase("POST_OUTREACH");
        setForm((previous) => ({ ...previous, photo: "", latitude: null, longitude: null, address: "" }));
        setGpsStatus("idle");
        setStageNotice("Pre-Outreach attendance is saved offline. Complete Post-Outreach attendance, then sync both records.");
        setStep("form");
      } else {
        setStep("offline-success");
      }
    };

    try {
      const result = await saveSubmission(subPayload);
      if (!result.ok) {
        if (result.reason === "duplicate" && phase === "PRE_OUTREACH" && result.postOutreachOpen) {
          setPreOutreachRecorded(true);
          setPhase("POST_OUTREACH");
          setForm((previous) => ({ ...previous, photo: "", latitude: null, longitude: null, address: "" }));
          setErrors({});
          setGpsStatus("idle");
          setStageNotice("Pre-Outreach attendance was already recorded. Continue with Post-Outreach attendance.");
          setStep("form");
          return;
        }
        if (result.reason === "closed") {
          const refreshedEvent = await getEventBySlug(slug);
          if (refreshedEvent?.isOpen && form.stateCode.trim()) {
            setEvent(refreshedEvent);
            await routeForStateCode(refreshedEvent, form.stateCode);
          } else {
            setStep("phase-closed");
          }
          return;
        }
        if (result.reason === "duplicate") {
          setErrors({ stateCode: `This state code already has ${phase === "PRE_OUTREACH" ? "Pre" : "Post"}-Outreach attendance.` });
          setStep("form");
          return;
        }
        console.error("Attendance submission failed:", result.error);
        queueOffline();
        return;
      }
      setSubmittedName(form.fullName.trim());
      if (phase === "PRE_OUTREACH" && result.postOutreachOpen) {
        setPreOutreachRecorded(true);
        setPhase("POST_OUTREACH");
        setForm((previous) => ({ ...previous, photo: "", latitude: null, longitude: null, address: "" }));
        setErrors({});
        setGpsStatus("idle");
        setStageNotice("Pre-Outreach attendance recorded. Now complete Post-Outreach attendance for this participant.");
        setStep("form");
      } else {
        if (phase === "POST_OUTREACH") {
          try {
            const route = await getAttendanceRoute(event.id, form.stateCode);
            setAttendanceSnapshots({ pre: route.pre, post: route.post });
            setPreOutreachRecorded(Boolean(route.pre));
          } catch (error) {
            console.error("Failed to load attendance confirmation details:", error);
          }
        }
        setStep("success");
      }
    } catch (e) {
      console.error("Network error, saving offline:", e);
      queueOffline();
    }
  };

  const resetForm = () => {
    setForm({ fullName: "", stateCode: "", gender: "", photo: "", latitude: null, longitude: null, address: "" });
    sessionStorage.removeItem(`dl4aib_statecode_${slug}`);
    setPreOutreachRecorded(false);
    setAttendanceSnapshots({});
    setErrors({}); setGpsStatus("idle"); setStep("form");
    setOfflineCount(getOfflineSubmissions().length);
    setTimeout(fetchGPS, 200);
  };

  const handleSync = async () => {
    const q = getOfflineSubmissions();
    if (q.length === 0) return;
    setSyncing(true);
    let success = 0;
    let closedForm = false;
    for (const sub of q) {
      try {
        const result = await saveSubmission({ ...sub, phase: sub.phase ?? "PRE_OUTREACH" });
        if (result.ok || result.reason === "duplicate") {
          removeOfflineSubmission(sub.id);
          if (result.ok) success++;
        } else if (result.reason === "closed") {
          closedForm = true;
          break;
        } else {
          break;
        }
      } catch {
        break; // Network still bad
      }
    }
    setOfflineCount(getOfflineSubmissions().length);
    setSyncing(false);
    if (closedForm) alert(`Synced ${success} submission(s). Some attendance remains pending because its form is closed. Ask the admin to reopen it, then sync again.`);
    else if (success > 0) alert(`Successfully synced ${success} submission(s). Offline remaining: ${q.length - success}`);
    else alert("Network is still unreachable. Please try syncing again later.");
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

  if (step === "event-closed") return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
      {header}
      <div style={{ maxWidth: "420px", margin: "5rem auto", padding: "0 1rem", textAlign: "center" }}>
        <div style={{ width: "4rem", height: "4rem", background: "var(--yellow-50)", borderRadius: "var(--r-xl)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", color: "var(--yellow-600)" }}>
          <IcLock size={26} />
        </div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "var(--gray-900)", fontSize: "1.25rem", marginBottom: "0.5rem", letterSpacing: "-0.025em" }}>
          Event Closed
        </h2>
        <p style={{ color: "var(--gray-500)", marginBottom: "0.25rem", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--gray-800)" }}>{event?.name}</strong>
        </p>
        <p style={{ color: "var(--gray-400)", fontSize: "0.875rem", lineHeight: 1.6 }}>
          This event is no longer accepting submissions. Contact your event organiser if you think this is a mistake.
        </p>
      </div>
    </div>
  );

  if (step === "phase-closed") return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
      {header}
      <div style={{ maxWidth: "420px", margin: "5rem auto", padding: "0 1rem", textAlign: "center" }}>
        <div style={{ width: "4rem", height: "4rem", background: "var(--yellow-50)", borderRadius: "var(--r-xl)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", color: "var(--yellow-600)" }}>
          <IcLock size={26} />
        </div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "var(--gray-900)", fontSize: "1.25rem", marginBottom: "0.5rem" }}>
          Attendance Forms Closed
        </h2>
        <p style={{ color: "var(--gray-500)", lineHeight: 1.6 }}>
          Both Pre-Outreach and Post-Outreach attendance are currently closed for {event?.name}. Contact the event organiser.
        </p>
      </div>
    </div>
  );

  if (step === "already-complete") return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
      {header}
      <div style={{ maxWidth: "420px", margin: "5rem auto", padding: "0 1rem", textAlign: "center" }}>
        <div className="success-check" style={{ margin: "0 auto 1.25rem" }}>
          <IcCheck size={26} color="white" />
        </div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "var(--gray-900)", fontSize: "1.25rem", marginBottom: "0.5rem" }}>
          Attendance Already Complete
        </h2>
        <p style={{ color: "var(--gray-500)", lineHeight: 1.6 }}>
          Both Pre-Outreach and Post-Outreach attendance have already been recorded for this state code at {event?.name}.
        </p>
        <AttendanceSummary
          pre={attendanceSnapshots.pre}
          post={attendanceSnapshots.post}
          preOpen={event?.preOutreachOpen ?? false}
          postOpen={event?.postOutreachOpen ?? false}
        />
        <button onClick={resetForm} className="btn btn-primary" style={{ marginTop: "1.25rem" }}>
          <IcUser size={14} /> Add Another Participant
        </button>
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
              {phase === "POST_OUTREACH" && preOutreachRecorded ? "Attendance Complete" : "Attendance Recorded"}
            </h2>
            <p style={{ color: "var(--gray-500)", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              <strong style={{ color: "var(--gray-800)" }}>{submittedName}</strong> has recorded {phase === "POST_OUTREACH" && preOutreachRecorded ? "both attendance forms" : `${phase === "PRE_OUTREACH" ? "Pre-Outreach" : "Post-Outreach"} attendance`} for:
            </p>
            <div style={{
              background: "var(--accent-50)", border: "1.5px solid var(--accent-100)",
              borderRadius: "var(--r-md)", padding: "0.625rem 1rem",
              margin: "1rem 0 1.5rem", color: "var(--accent-700)", fontWeight: 600, fontSize: "0.9rem",
            }}>
              {event?.name}
            </div>
            {phase === "POST_OUTREACH" && (
              <AttendanceSummary
                pre={attendanceSnapshots.pre}
                post={attendanceSnapshots.post}
                preOpen={event?.preOutreachOpen ?? false}
                postOpen={event?.postOutreachOpen ?? false}
              />
            )}
            {phase === "PRE_OUTREACH" && !event?.postOutreachOpen && (
              <p style={{ color: "var(--yellow-600)", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                Post-Outreach attendance is currently closed. This participant is not yet marked present.
              </p>
            )}
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

  if (step === "offline-success") return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)" }}>
      {header}
      <div style={{ maxWidth: "420px", margin: "3rem auto", padding: "0 1rem" }}>
        <div className="card fade-in">
          <div style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
            <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "50%", background: "var(--yellow-100)", color: "var(--yellow-600)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--gray-900)", letterSpacing: "-0.025em", marginBottom: "0.5rem" }}>
              Saved Offline
            </h2>
            <p style={{ color: "var(--gray-500)", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              <strong style={{ color: "var(--gray-800)" }}>{submittedName}</strong> could not be uploaded due to a poor connection. It has been saved securely on this device.
            </p>
            <div style={{
              background: "var(--yellow-50)", border: "1.5px solid var(--yellow-200)",
              borderRadius: "var(--r-md)", padding: "0.625rem 1rem",
              margin: "1rem 0 1.5rem", color: "var(--yellow-800)", fontWeight: 600, fontSize: "0.85rem",
            }}>
              Don&apos;t forget to push &quot;Sync Data&quot; when you get back online.
            </div>
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
        {/* Offline Sync Banner */}
        {offlineCount > 0 && (
          <div style={{ 
            marginBottom: "1.25rem", padding: "1rem", background: "white", 
            border: "1.5px solid var(--yellow-400)", borderRadius: "var(--r-lg)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
            boxShadow: "0 4px 12px rgba(234, 179, 8, 0.1)"
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--gray-900)" }}>Offline Submissions</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--gray-500)", marginTop: "0.125rem" }}>
                You have <strong>{offlineCount}</strong> pending records.
              </div>
            </div>
            <button 
              onClick={handleSync} 
              disabled={syncing}
              className="btn btn-primary btn-sm"
              style={{ background: "var(--yellow-500)", color: "white", boxShadow: "none" }}
            >
              {syncing ? <><span className="spinner" style={{ width: "14px", height: "14px", borderTopColor: "white" }} />Syncing</> : <><IcRefresh size={14} /> Sync Now</>}
            </button>
          </div>
        )}

        {/* GPS status */}
        {stageNotice && (
          <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>
            {stageNotice}
          </div>
        )}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <span className={`badge ${event?.preOutreachOpen ? "badge-green" : "badge-gray"}`}>
            Pre-Outreach: {event?.preOutreachOpen ? "Open" : "Closed"}
          </span>
          <span className={`badge ${event?.postOutreachOpen ? "badge-green" : "badge-gray"}`}>
            Post-Outreach: {event?.postOutreachOpen ? "Open" : "Closed"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <span className={`badge ${phase === "PRE_OUTREACH" ? "badge-blue" : "badge-green"}`}>
            {phase === "PRE_OUTREACH" ? "Pre-Outreach" : "Post-Outreach"} · {phase === "PRE_OUTREACH" ? "1" : "2"} of 2
          </span>
        </div>
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
            <div className="section-title">{phase === "PRE_OUTREACH" ? "Pre-Outreach Attendance" : "Post-Outreach Attendance"}</div>
            <p style={{ color: "var(--gray-500)", fontSize: "0.875rem", marginTop: "0.2rem" }}>
              You are filling the {phase === "PRE_OUTREACH" ? "Pre-Outreach" : "Post-Outreach"} attendance form, which is currently open. Pre-Outreach is {event?.preOutreachOpen ? "open" : "closed"} and Post-Outreach is {event?.postOutreachOpen ? "open" : "closed"}. Capture the participant&apos;s attendance at the {phase === "PRE_OUTREACH" ? "start" : "end"} of the outreach.
            </p>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              {errors.submit && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{errors.submit}</div>}
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
                  onChange={(e) => {
                    const stateCode = e.target.value;
                    set("stateCode", stateCode);
                    setErrors((p) => ({ ...p, stateCode: "" }));
                    if (stateCode.trim()) sessionStorage.setItem(`dl4aib_statecode_${slug}`, stateCode);
                    else sessionStorage.removeItem(`dl4aib_statecode_${slug}`);
                  }}
                  onBlur={handleStateCodeBlur}
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
