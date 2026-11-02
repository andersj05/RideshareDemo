import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rideshare Test Lab",
  description:
    "A mobile usability lab for comparing separate rideshare apps with an aggregate booking flow.",
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
