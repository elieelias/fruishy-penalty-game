import "./globals.css";
import "@fontsource/anybody/800.css";
import "@fontsource/anybody/900.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/space-grotesk/700.css";

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
