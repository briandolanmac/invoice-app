import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tour Invoices",
  description: "Create and manage tour-guide invoices.",
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
