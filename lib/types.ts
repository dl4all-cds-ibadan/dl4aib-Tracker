export interface Event {
  id: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  allowedRadius: number; // metres
  date: string; // ISO date string
  slug: string;
  createdAt: string;
  isOpen: boolean;
  preOutreachOpen: boolean;
  postOutreachOpen: boolean;
  participantCount?: number;
}

export type AttendancePhase = "PRE_OUTREACH" | "POST_OUTREACH";

export interface Submission {
  id: string;
  eventId: string;
  eventName: string;
  fullName: string;
  stateCode: string;
  gender: "Male" | "Female" | "Prefer not to say";
  photoBase64: string;
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
  phase: AttendancePhase;
}

export interface AdminUser {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "SUPERADMIN" | "ADMIN";
  createdAt: string;
}
