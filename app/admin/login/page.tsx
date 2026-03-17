"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { IcMail, IcLock, IcEye, IcEyeOff, IcArrowLeft } from "@/components/Icons";
import { LogoMark } from "@/components/AppLogo";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    await new Promise((r) => setTimeout(r, 350));
    const res = await login(email, password);
    if (res.success) router.push("/admin/dashboard");
    else setError(res.error || "Incorrect email or password. Please try again.");
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "var(--r-md)",
    color: "white",
    fontSize: "0.9375rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const focusIn  = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(34,197,94,0.7)";
    e.target.style.boxShadow   = "0 0 0 3px rgba(34,197,94,0.14)";
  };
  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.1)";
    e.target.style.boxShadow   = "none";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--brand-950)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "1.5rem", position: "relative", overflow: "hidden",
    }}>
      {/* Subtle glow — green only */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(34,197,94,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: "500px", height: "500px",
        borderRadius: "50%",
        background: "rgba(16,185,129,0.04)",
        top: "60%", left: "-20%", pointerEvents: "none",
      }} />

      {/* Back link */}
      <div style={{ position: "absolute", top: "1.25rem", left: "1.25rem" }}>
        <Link href="/"
          style={{ display:"flex", alignItems:"center", gap:"0.375rem", color:"rgba(255,255,255,0.35)", fontSize:"0.8125rem", fontWeight:500, textDecoration:"none", transition:"color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
        >
          <IcArrowLeft size={14} />
          Back to home
        </Link>
      </div>

      <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <LogoMark size={52} />
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "1.375rem", fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>
            DL4AIB
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8125rem", marginTop: "0.2rem" }}>
            Digital Literacy for All Ibadan
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "var(--r-2xl)",
          padding: "1.75rem",
          backdropFilter: "blur(20px)",
        }}>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:"1.125rem", fontWeight:700, color:"white", letterSpacing:"-0.025em", marginBottom:"0.25rem" }}>
            Sign in to your account
          </h2>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.8125rem", marginBottom:"1.5rem" }}>
            Manage events and view participant data
          </p>

          {error && (
            <div style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", color:"#fca5a5", borderRadius:"var(--r-md)", padding:"0.75rem 1rem", fontSize:"0.8125rem", marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display:"block", fontSize:"0.8125rem", fontWeight:600, color:"rgba(255,255,255,0.55)", marginBottom:"0.375rem" }}>
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.3)" }}>
                  <IcMail size={15} />
                </div>
                <input id="email" type="email" placeholder="admin@dl4aib.org"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email"
                  style={{ ...inputStyle, padding: "0.625rem 0.875rem 0.625rem 2.25rem" }}
                  onFocus={focusIn} onBlur={focusOut}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display:"block", fontSize:"0.8125rem", fontWeight:600, color:"rgba(255,255,255,0.55)", marginBottom:"0.375rem" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.3)" }}>
                  <IcLock size={15} />
                </div>
                <input id="password" type={showPass ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password"
                  style={{ ...inputStyle, padding: "0.625rem 2.5rem 0.625rem 2.25rem" }}
                  onFocus={focusIn} onBlur={focusOut}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)", padding:0, display:"flex", alignItems:"center", transition:"color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color="rgba(255,255,255,0.6)")}
                  onMouseLeave={e => (e.currentTarget.style.color="rgba(255,255,255,0.3)")}
                >
                  {showPass ? <IcEyeOff size={15} /> : <IcEye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ height:"42px", fontSize:"0.9375rem" }}>
              {loading
                ? <><span className="spinner" style={{ width:"1rem", height:"1rem", borderTopColor:"white" }} />Signing in…</>
                : "Sign In"
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <AuthProvider><LoginForm /></AuthProvider>;
}
