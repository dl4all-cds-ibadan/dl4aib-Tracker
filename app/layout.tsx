import type { Metadata } from "next";
import "./globals.css";

// VERCEL_URL is automatically set by Vercel on every deployment (no https://)
// NEXT_PUBLIC_SITE_URL can be set in Vercel env vars as an override (e.g. custom domain)
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "DL4AIB Tracker | Digital Literacy for All Ibadan – Outreach Tracker",
  description:
    "Record outreach attendance during Digital Literacy for All Ibadan field events. Volunteers submit with GPS, live photo and instant QR code access — no app download needed.",
  keywords: "digital literacy, Ibadan, outreach, beneficiary tracker, attendance, DL4AIB, NGO",
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "DL4AIB Tracker",
    title: "DL4AIB Tracker — Track Every Participant, Every Time",
    description:
      "GPS-verified attendance with photo evidence. Scan a QR code, fill the form in 30 seconds. Real-time admin dashboard & CSV export.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DL4AIB Tracker – Outreach Attendance Tracking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DL4AIB Tracker — Track Every Participant, Every Time",
    description:
      "GPS-verified attendance with photo evidence. Scan a QR code, fill the form in 30 seconds.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
