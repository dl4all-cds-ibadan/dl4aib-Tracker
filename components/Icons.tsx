import React from "react";

// Modern SVG icon set — replaces all emojis
interface IconProps { size?: number; className?: string; color?: string; }
const ic = (d: string | React.ReactNode) =>
  ({ size = 16, className = "", color = "currentColor" }: IconProps) =>
    typeof d === "string" ? (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d={d} />
      </svg>
    ) : (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {d}
      </svg>
    );

// Helper for multi-path icons
const Icon = ({ size = 16, className = "", children }: { size?: number; className?: string; children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

export const IcDash        = ic("M3 12h18M3 6h18M3 18h18");
export const IcChart       = (p: IconProps) => <Icon size={p.size} className={p.className}><rect x="2" y="7" width="4" height="15"/><rect x="9" y="3" width="4" height="19"/><rect x="16" y="10" width="4" height="12"/></Icon>;
export const IcCalendar    = (p: IconProps) => <Icon size={p.size} className={p.className}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Icon>;
export const IcUsers       = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></Icon>;
export const IcUser        = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>;
export const IcCamera      = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></Icon>;
export const IcMap         = (p: IconProps) => <Icon size={p.size} className={p.className}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></Icon>;
export const IcPin         = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></Icon>;
export const IcPlus        = ic("M12 5v14M5 12h14");
export const IcQr          = (p: IconProps) => <Icon size={p.size} className={p.className}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 14h3M14 17v3h3"/></Icon>;
export const IcLink        = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></Icon>;
export const IcDownload    = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>;
export const IcShare       = (p: IconProps) => <Icon size={p.size} className={p.className}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Icon>;
export const IcCopy        = (p: IconProps) => <Icon size={p.size} className={p.className}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></Icon>;
export const IcRefresh     = (p: IconProps) => <Icon size={p.size} className={p.className}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></Icon>;
export const IcFlip        = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></Icon>;
export const IcCheck       = ic("M20 6L9 17l-5-5");
export const IcX           = ic("M18 6L6 18M6 6l12 12");
export const IcArrowLeft   = ic("M19 12H5M12 19l-7-7 7-7");
export const IcLogOut      = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Icon>;
export const IcHome        = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Icon>;
export const IcSettings    = (p: IconProps) => <Icon size={p.size} className={p.className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></Icon>;
export const IcLock        = (p: IconProps) => <Icon size={p.size} className={p.className}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></Icon>;
export const IcEye         = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon>;
export const IcEyeOff      = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></Icon>;
export const IcMail        = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Icon>;
export const IcRadar       = (p: IconProps) => <Icon size={p.size} className={p.className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="5"/><line x1="12" y1="2" x2="12" y2="7"/></Icon>;
export const IcSlash       = ic("M18 6L6 18");
export const IcLoader      = (p: IconProps) => <Icon size={p.size} className={p.className}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></Icon>;
export const IcSparkle     = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></Icon>;
export const IcUpload      = (p: IconProps) => <Icon size={p.size} className={p.className}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></Icon>;
export const IcGps         = (p: IconProps) => <Icon size={p.size} className={p.className}><polygon points="3 11 22 2 13 21 11 13 3 11"/></Icon>;
export const IcList        = ic("M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01");
export const IcSearch      = (p: IconProps) => <Icon size={p.size} className={p.className}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>;
export const IcFilter      = ic("M22 3H2l8 9.46V19l4 2v-8.54L22 3");
export const IcMenu        = ic("M3 12h18M3 6h18M3 18h18");
export const IcExport      = (p: IconProps) => <Icon size={p.size} className={p.className}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>;
export const IcZap         = (p: IconProps) => <Icon size={p.size} className={p.className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>;
