"use client";
import { useEffect, useRef } from "react";
import { Submission } from "@/lib/types";

interface Props {
  submissions: Submission[];
  centerLat?: number;
  centerLon?: number;
}

export default function MapView({ submissions, centerLat, centerLon }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Dynamically import Leaflet (client-side only)
    import("leaflet").then((L) => {
      const defaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      const lat = centerLat ?? (submissions[0]?.latitude ?? 9.082);
      const lon = centerLon ?? (submissions[0]?.longitude ?? 8.6753);

      const map = L.map(mapRef.current!).setView([lat, lon], submissions.length ? 14 : 6);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Event centre marker
      if (centerLat !== undefined && centerLon !== undefined) {
        L.circle([centerLat, centerLon], {
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          radius: 300,
        }).addTo(map);
      }

      submissions.forEach((s) => {
        const m = L.marker([s.latitude, s.longitude], { icon: defaultIcon }).addTo(map);
        m.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:180px">
            ${s.photoBase64 ? `<img src="${s.photoBase64}" style="width:100%;border-radius:6px;margin-bottom:8px;max-height:120px;object-fit:cover"/>` : ""}
            <strong style="font-size:14px">${s.fullName}</strong><br/>
            <span style="color:#6b7280;font-size:12px">${s.gender} · ${s.stateCode}</span><br/>
            <span style="color:#6b7280;font-size:11px">${new Date(s.timestamp).toLocaleString()}</span>
          </div>
        `);
      });

      if (submissions.length > 0) {
        const bounds = L.latLngBounds(submissions.map((s) => [s.latitude, s.longitude]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [submissions, centerLat, centerLon]);

  return (
    <div
      ref={mapRef}
      style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
    />
  );
}
