import type { Metadata } from "next";
import HomeButton from "./HomeButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoice App",
  description: "Create and manage tour-guide invoices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <HomeButton />
      </body>
    </html>
  );
}
