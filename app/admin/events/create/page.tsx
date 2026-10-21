"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import { generateId, slugify } from "@/lib/storage";
import { saveEvent } from "@/lib/actions";
import { IcMenu, IcArrowLeft, IcCheck, IcPin, IcSearch } from "@/components/Icons";
import { LogoMark } from "@/components/AppLogo";

/* ─── Nominatim geocoding ─────────────────────────────────────────────────── */
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

async function geocodeSearch(query: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=0`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  return res.json();
}

/* ─── Map picker with location search ────────────────────────────────────── */
function LocationMapPicker({
  lat, lng, onPick, onNameSuggestion,
}: {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
  onNameSuggestion?: (name: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMap = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iconRef = useRef<any>(null);

  /* search state */
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Init Leaflet map ── */
  useEffect(() => {
    let active = true;

    if (!mapRef.current || leafletMap.current) return;

    const defaultLat = lat ?? 7.3775;
    const defaultLng = lng ?? 3.9470;

    import("leaflet").then((L) => {
      if (!active || !mapRef.current) return;

      // Additional safety check to prevent double-initialization
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)._leaflet_id) {
        return;
      }

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41], iconAnchor: [12, 41],
        popupAnchor: [1, -34], shadowSize: [41, 41],
      });
      iconRef.current = icon;

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      if (lat !== null && lng !== null) {
        markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
      }

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        onPick(clickLat, clickLng);
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          markerRef.current = L.marker([clickLat, clickLng], { icon }).addTo(map);
        }
      });

      leafletMap.current = map;
    });

    return () => {
      active = false;
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Sync external lat/lng (from "Use My Location") ── */
  useEffect(() => {
    if (!leafletMap.current || lat === null || lng === null) return;
    import("leaflet").then((L) => {
      const icon = iconRef.current ?? L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
      });
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon }).addTo(leafletMap.current);
      }
      leafletMap.current.setView([lat, lng], 15);
    });
  }, [lat, lng]);

  /* ── Debounced search-as-you-type ── */
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSearchError("");
    if (!val.trim()) { setResults([]); setShowResults(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await geocodeSearch(val);
        setResults(data);
        setShowResults(true);
        if (data.length === 0) setSearchError("No results found. Try a different name.");
      } catch {
        setSearchError("Search failed. Check your internet connection.");
      } finally {
        setSearching(false);
      }
    }, 450);
  };

  /* ── Fly map to a result ── */
  const flyToResult = (r: NominatimResult) => {
    const rlat = parseFloat(r.lat);
    const rlng = parseFloat(r.lon);
    onPick(rlat, rlng);
    if (onNameSuggestion) {
      // Shorten display_name to first two comma-separated parts
      const short = r.display_name.split(",").slice(0, 2).join(",").trim();
      onNameSuggestion(short);
    }
    setQuery(r.display_name.split(",")[0]);
    setResults([]);
    setShowResults(false);
    if (!leafletMap.current) return;
    import("leaflet").then((L) => {
      const icon = iconRef.current ?? L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
      });
      if (markerRef.current) {
        markerRef.current.setLatLng([rlat, rlng]);
      } else {
        markerRef.current = L.marker([rlat, rlng], { icon }).addTo(leafletMap.current);
      }
      leafletMap.current.flyTo([rlat, rlng], 16, { animate: true, duration: 1 });
    });
  };

  const handleSearchSubmit = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    setSearchError("");
    try {
      const data = await geocodeSearch(query);
      if (data.length > 0) {
        flyToResult(data[0]);
      } else {
        setSearchError("No results found. Try a more specific name.");
        setShowResults(false);
      }
    } catch {
      setSearchError("Search failed. Check your internet connection.");
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent parent form submit
      handleSearchSubmit();
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* ── Search box ── */}
      <div style={{ marginBottom: "0.625rem", position: "relative" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{
              position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)",
              color: "var(--gray-400)", pointerEvents: "none", zIndex: 1,
            }}>
              <IcSearch size={15} />
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="Search for a location, e.g. Moniya Town Hall, Ibadan…"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (results.length > 0) setShowResults(true); }}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              style={{ paddingLeft: "2.25rem", paddingRight: "0.875rem" }}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="btn btn-primary btn-sm"
            disabled={searching || !query.trim()}
            style={{ flexShrink: 0, minWidth: "80px" }}
          >
            {searching
              ? <span className="spinner" style={{ width: "0.875rem", height: "0.875rem", borderTopColor: "white" }} />
              : <><IcSearch size={13} /> Search</>
            }
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {showResults && results.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: "90px",
            background: "white", border: "1.5px solid var(--border)",
            borderRadius: "var(--r-md)", boxShadow: "var(--shadow-md)",
            zIndex: 2000, overflow: "hidden",
          }}>
            {results.map((r) => (
              <button
                key={r.place_id}
                type="button"
                onMouseDown={() => flyToResult(r)}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "0.625rem 0.875rem",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "0.8125rem", color: "var(--gray-700)",
                  borderBottom: "1px solid var(--gray-100)",
                  display: "flex", gap: "0.5rem", alignItems: "flex-start",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-50)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <span style={{ color: "var(--brand-600)", flexShrink: 0, marginTop: "1px" }}>
                  <IcPin size={13} />
                </span>
                <span style={{ lineHeight: 1.4 }}>
                  <strong style={{ color: "var(--gray-900)", display: "block" }}>
                    {r.display_name.split(",")[0]}
                  </strong>
                  <span style={{ color: "var(--gray-400)", fontSize: "0.75rem" }}>
                    {r.display_name.split(",").slice(1, 3).join(",").trim()}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {searchError && (
        <p style={{ fontSize: "0.8rem", color: "var(--red-600)", marginBottom: "0.5rem" }}>
          {searchError}
        </p>
      )}

      {/* ── Map ── */}
      <div
        ref={mapRef}
        style={{
          width: "100%", height: "340px",
          borderRadius: "var(--r-lg)", border: "1.5px solid var(--border)",
          overflow: "hidden", cursor: "crosshair",
        }}
      />
      <p style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: "0.375rem" }}>
        🔍 Search above to jump to a location, or click directly on the map to pin it
      </p>
    </div>
  );
}

/* ── Dynamic import wrapper ── */
import dynamic from "next/dynamic";
const MapPicker = dynamic(() => Promise.resolve(LocationMapPicker), { ssr: false });

/* ── Main Form ── */
function CreateEventForm() {
  const { isAdmin, initialized } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (!initialized) return;
    if (!isAdmin) router.push("/admin/login");
  }, [isAdmin, initialized, router]);

  const [form, setForm] = useState({
    name: "", locationName: "", latitude: "", longitude: "",
    allowedRadius: "200", date: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleMapPick = useCallback((lat: number, lng: number) => {
    set("latitude", lat.toFixed(6));
    set("longitude", lng.toFixed(6));
  }, []);

  /* Auto-fill locationName from map search result — only if field is empty */
  const handleNameSuggestion = useCallback((name: string) => {
    setForm((p) => ({ ...p, locationName: p.locationName.trim() ? p.locationName : name }));
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", pos.coords.latitude.toFixed(6));
        set("longitude", pos.coords.longitude.toFixed(6));
        setGettingLocation(false);
      },
      () => setGettingLocation(false)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialized || !isAdmin) return;
    setSaving(true);
    const id = generateId();
    const baseSlug = slugify(form.name) || "event";
    const slug = `${baseSlug}-${id.substring(0, 5)}`;
    try {
      await saveEvent({
        id, slug,
        name: form.name.trim(),
        locationName: form.locationName.trim(),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        allowedRadius: parseInt(form.allowedRadius),
        date: form.date,
        isOpen: true,
        preOutreachOpen: false,
        postOutreachOpen: false,
        createdAt: new Date().toISOString(),
      });
      setSaving(false);
      setSuccess(id);
      setTimeout(() => router.push(`/admin/events/${id}/qr`), 1200);
    } catch (e: unknown) {
      console.error("Failed to save event:", e);
      setSaving(false);
      const errMsg = e instanceof Error ? e.message : "Please check your network connection.";
      alert(`Failed to create event. Error: ${errMsg}`);
    }
  };

  if (!initialized || !isAdmin) return null;

  const pickedLat = form.latitude ? parseFloat(form.latitude) : null;
  const pickedLng = form.longitude ? parseFloat(form.longitude) : null;

  return (
    <div className="admin-layout">
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
              <p>Create Event</p>
            </div>
          </div>
          <Link href="/admin/dashboard" className="btn btn-ghost btn-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            <IcArrowLeft size={14} />
            Dashboard
          </Link>
        </header>

        <div className="page-wrapper">
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            {success ? (
              <div className="card fade-in">
                <div style={{ padding: "3.5rem 2rem", textAlign: "center" }}>
                  <div className="success-check" style={{ marginBottom: "1.5rem" }}>
                    <IcCheck size={28} color="white" />
                  </div>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--gray-900)", letterSpacing: "-0.025em", marginBottom: "0.5rem" }}>
                    Event Created!
                  </h2>
                  <p style={{ color: "var(--gray-500)", fontSize: "0.875rem" }}>
                    Redirecting to your QR code…
                  </p>
                </div>
              </div>
            ) : (
              <div className="card fade-in">
                {/* Card top */}
                <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", background: "var(--gray-25)" }}>
                  <div className="page-title">New Outreach Event</div>
                  <div className="page-subtitle">A unique QR code and shareable link will be generated automatically.</div>
                </div>

                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    {/* Event Name */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="ev-name">
                        Event Name <span className="required">*</span>
                      </label>
                      <input
                        id="ev-name"
                        className="form-input"
                        type="text"
                        placeholder="e.g. Moniya Digital Literacy Drive"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        required
                      />
                      {form.name && (
                        <p style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: "0.125rem" }}>
                          URL: <code style={{ background: "var(--gray-100)", padding: "0.1rem 0.3rem", borderRadius: "0.25rem" }}>/event/{slugify(form.name) || "…"}</code>
                        </p>
                      )}
                    </div>

                    {/* Location Name */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="ev-loc">
                        Location Name <span className="required">*</span>
                      </label>
                      <input
                        id="ev-loc"
                        className="form-input"
                        type="text"
                        placeholder="e.g. Moniya Town Hall, Ibadan"
                        value={form.locationName}
                        onChange={(e) => set("locationName", e.target.value)}
                        required
                      />
                    </div>

                    {/* ── Map Picker ── */}
                    <div className="form-group">
                      <label className="form-label">
                        Event Location <span className="required">*</span>
                      </label>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <MapPicker
                          lat={pickedLat}
                          lng={pickedLng}
                          onPick={handleMapPick}
                          onNameSuggestion={handleNameSuggestion}
                        />
                      </div>

                      {/* Coord display / manual entry */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <label className="form-label" htmlFor="ev-lat" style={{ marginBottom: "0.25rem" }}>
                            Latitude
                          </label>
                          <input
                            id="ev-lat"
                            className="form-input"
                            type="number" step="any"
                            placeholder="7.3775"
                            value={form.latitude}
                            onChange={(e) => set("latitude", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label" htmlFor="ev-lon" style={{ marginBottom: "0.25rem" }}>
                            Longitude
                          </label>
                          <input
                            id="ev-lon"
                            className="form-input"
                            type="number" step="any"
                            placeholder="3.9470"
                            value={form.longitude}
                            onChange={(e) => set("longitude", e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: "0.625rem" }}
                        disabled={gettingLocation}
                      >
                        {gettingLocation
                          ? <><span className="spinner" style={{ width: "0.875rem", height: "0.875rem" }} />Detecting…</>
                          : <><IcPin size={13} />Use My Current Location</>
                        }
                      </button>
                    </div>

                    {/* Radius */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="ev-radius">
                        Allowed Radius (metres) <span className="required">*</span>
                      </label>
                      <input
                        id="ev-radius"
                        className="form-input"
                        type="number" min="50" max="5000"
                        placeholder="200"
                        value={form.allowedRadius}
                        onChange={(e) => set("allowedRadius", e.target.value)}
                        required
                      />
                      <p style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>
                        Volunteers must be within this distance from the event centre to submit
                      </p>
                    </div>

                    {/* Date */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="ev-date">
                        Event Date <span className="required">*</span>
                      </label>
                      <input
                        id="ev-date"
                        className="form-input"
                        type="date"
                        value={form.date}
                        onChange={(e) => set("date", e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={saving}
                      style={{ height: "44px", marginTop: "0.25rem" }}
                    >
                      {saving
                        ? <><span className="spinner" style={{ width: "1rem", height: "1rem", borderTopColor: "white" }} />Creating event…</>
                        : "Create Event & Generate QR"
                      }
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <AuthProvider>
      <CreateEventForm />
    </AuthProvider>
  );
}
