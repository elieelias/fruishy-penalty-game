import "./globals.css";
import { Anybody, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";

const anybody = Anybody({
  weight: ["800", "900"],
  subsets: ["latin"],
  variable: "--font-anybody",
});

const jakarta = Plus_Jakarta_Sans({
  weight: ["500"],
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const space = Space_Grotesk({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-space",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${anybody.variable} ${jakarta.variable} ${space.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
