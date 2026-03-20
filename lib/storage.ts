import { Event, Submission } from "./types";

const EVENTS_KEY = "dl4aib_events";
const SUBMISSIONS_KEY = "dl4aib_submissions";

function isBrowser() {
  return typeof window !== "undefined";
}

// ─── Events ───────────────────────────────────────────────────────────────────
export function getEvents(): Event[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEvent(event: Event): void {
  if (!isBrowser()) return;
  const events = getEvents();
  const idx = events.findIndex((e) => e.id === event.id);
  if (idx >= 0) events[idx] = event;
  else events.push(event);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function getEventBySlug(slug: string): Event | null {
  return getEvents().find((e) => e.slug === slug) ?? null;
}

export function getEventById(id: string): Event | null {
  return getEvents().find((e) => e.id === id) ?? null;
}

// ─── Submissions ──────────────────────────────────────────────────────────────
export function getSubmissions(): Submission[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getSubmissionsByEvent(eventId: string): Submission[] {
  return getSubmissions().filter((s) => s.eventId === eventId);
}

export function saveSubmission(submission: Submission): void {
  if (!isBrowser()) return;
  const submissions = getSubmissions();
  submissions.push(submission);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
}

// ─── Offline Queuing ────────────────────────────────────────────────────────────
const OFFLINE_KEY = "dl4aib_offline_queue";

export function saveOfflineSubmission(submission: Submission): void {
  if (!isBrowser()) return;
  const q = getOfflineSubmissions();
  q.push(submission);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(q));
}

export function getOfflineSubmissions(): Submission[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(OFFLINE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeOfflineSubmission(id: string): void {
  if (!isBrowser()) return;
  const q = getOfflineSubmissions().filter((s) => s.id !== id);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(q));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 60);
}

/** Haversine distance in metres between two lat/lon points */
export function distanceMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const dφ = ((lat2 - lat1) * Math.PI) / 180;
  const dλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Rate-limit: block if same device submitted for same event within 60 s */
export function isRateLimited(eventId: string): boolean {
  if (!isBrowser()) return false;
  const key = `dl4aib_ratelimit_${eventId}`;
  const last = Number(localStorage.getItem(key) ?? 0);
  const now = Date.now();
  if (now - last < 60_000) return true;
  localStorage.setItem(key, String(now));
  return false;
}
