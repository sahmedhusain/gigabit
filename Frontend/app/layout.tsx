import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { ToastProvider } from "@/context/ToastContext";
import { SidebarDataProvider } from "@/context/SidebarDataContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Gigabit",
  description: "A modern social network platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased font-sans"
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              <WebSocketProvider>
                <SidebarDataProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </SidebarDataProvider>
              </WebSocketProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
