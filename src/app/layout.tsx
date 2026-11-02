import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "fare — A better way there",
  description:
    "A rideshare comparison and usability research prototype. Compare simulated rides, then test a simpler way to book.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Ignore body attributes injected by browser extensions such as Grammarly.
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
