import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scrumptious — Restaurant Simulation",
  description: "Make restaurant decisions, review simulation results, and shape the app together.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
