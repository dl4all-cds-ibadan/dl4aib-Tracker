import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DL4AIB Tracker | Digital Literacy for All Ibadan - Outreach Tracker",
  description:
    "Record outreach participants during Digital Literacy for All Ibadan field events. Volunteers submit attendance with GPS, photo evidence and instant QR code access.",
  keywords: "digital literacy, Ibadan, outreach, beneficiary tracker, attendance, DL4AIB",
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
        <link rel="icon" href="/logo.png" />
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
