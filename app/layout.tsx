import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patient Roster Matching",
  description: "Compares two patient lists and attempts to identify likely matches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
