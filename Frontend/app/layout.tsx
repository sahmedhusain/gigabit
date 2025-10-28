import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/providers/ClientProviders";

export const metadata: Metadata = {
  title: "Gigabit",
  description: "A modern social network platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="antialiased font-sans"
        suppressHydrationWarning={true}
      >
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
