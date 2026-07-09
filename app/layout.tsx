import "./globals.css";
import "@fontsource/anybody/800.css";
import "@fontsource/anybody/900.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/space-grotesk/700.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Fruishy Shootout",
  description: "Scan your Fruishy QR code, cross the pitch, and climb today's leaderboard.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
