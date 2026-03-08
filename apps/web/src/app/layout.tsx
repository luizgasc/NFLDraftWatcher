import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "NFL Draft Watcher",
  description:
    "Modern, data-driven NFL draft platform for prospects, boards, community, and news.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
