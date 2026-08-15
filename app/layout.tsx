import type { Metadata, Viewport } from "next";
import HomeButton from "./HomeButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoice App",
  description: "Create and manage tour-guide invoices.",
};

/** viewportFit:"cover" is required for env(safe-area-inset-*) to return
 *  real values at all -- without it every safe-area CSS in this app
 *  (PDF popup padding, .page bottom padding) silently evaluates to 0. */
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <HomeButton />
        {children}
      </body>
    </html>
  );
}
