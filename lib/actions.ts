"use server";

import { prisma } from "./prisma";
import { Event, Submission } from "./types";

export async function getEvents(): Promise<Event[]> {
  try {
    const rawEvents = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rawEvents.map((r: any) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (e) {
    console.error("Failed to fetch events:", e);
    return [];
  }
}

export async function saveEvent(event: Event): Promise<void> {
  try {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {
        slug: event.slug,
        name: event.name,
        locationName: event.locationName,
        latitude: event.latitude,
        longitude: event.longitude,
        allowedRadius: event.allowedRadius,
        date: event.date,
      },
      create: {
        id: event.id,
        slug: event.slug,
        name: event.name,
        locationName: event.locationName,
        latitude: event.latitude,
        longitude: event.longitude,
        allowedRadius: event.allowedRadius,
        date: event.date,
        createdAt: new Date(event.createdAt),
      },
    });
  } catch (e) {
    console.error("Failed to save event:", e);
    throw e;
  }
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    const r = await prisma.event.findUnique({
      where: { slug },
    });
    if (!r) return null;
    return { ...r, createdAt: r.createdAt.toISOString() };
  } catch (e) {
    console.error("Failed to fetch event by slug:", e);
    return null;
  }
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    const r = await prisma.event.findUnique({
      where: { id },
    });
    if (!r) return null;
    return { ...r, createdAt: r.createdAt.toISOString() };
  } catch (e) {
    console.error("Failed to fetch event by id:", e);
    return null;
  }
}

export async function getSubmissions(): Promise<Submission[]> {
  try {
    const raw = await prisma.submission.findMany({
      orderBy: { timestamp: "desc" },
    });
    return raw.map((r: any) => ({
      id: r.id,
      eventId: r.eventId,
      eventName: r.eventName,
      fullName: r.fullName,
      stateCode: r.stateCode,
      gender: r.gender as any,
      latitude: r.latitude,
      longitude: r.longitude,
      address: r.address || undefined,
      photoBase64: r.photoBase64,
      timestamp: r.timestamp,
    }));
  } catch (e) {
    console.error("Failed to fetch submissions:", e);
    return [];
  }
}

export async function getSubmissionsByEvent(eventId: string): Promise<Submission[]> {
  try {
    const raw = await prisma.submission.findMany({
      where: { eventId },
      orderBy: { timestamp: "desc" },
    });
    return raw.map((r: any) => ({
      id: r.id,
      eventId: r.eventId,
      eventName: r.eventName,
      fullName: r.fullName,
      stateCode: r.stateCode,
      gender: r.gender as any,
      latitude: r.latitude,
      longitude: r.longitude,
      address: r.address || undefined,
      photoBase64: r.photoBase64,
      timestamp: r.timestamp,
    }));
  } catch (e) {
    console.error("Failed to fetch event submissions:", e);
    return [];
  }
}

export async function saveSubmission(submission: Submission): Promise<void> {
  try {
    await prisma.submission.create({
      data: {
        id: submission.id,
        eventId: submission.eventId,
        eventName: submission.eventName,
        fullName: submission.fullName,
        stateCode: submission.stateCode,
        gender: submission.gender,
        latitude: submission.latitude,
        longitude: submission.longitude,
        address: submission.address,
        photoBase64: submission.photoBase64,
        timestamp: submission.timestamp,
      },
    });
  } catch (e) {
    console.error("Failed to save submission:", e);
    throw e;
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    await prisma.event.delete({
      where: { id },
    });
  } catch (e) {
    console.error("Failed to delete event:", e);
    throw e;
  }
}
