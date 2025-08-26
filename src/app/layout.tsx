import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/navigation";
import { AuthProvider } from "../../context/AuthContext";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { PWAWrapper } from "@/components/pwa/PWAWrapper";
import { AsyncErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense } from "react";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { GlobalAuthErrorHandler } from "@/components/auth/GlobalAuthErrorHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VineSight - Grape Farming Digital Companion",
  description: "Scientific grape farming operations management app for Indian farmers. Calculate irrigation, track operations, and manage vineyard activities.",
  keywords: "grape farming, vineyard management, agriculture, irrigation calculator, farming app, India",
  authors: [{ name: "VineSight Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#059669" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VineSight" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AsyncErrorBoundary>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading VineSight...</p>
              </div>
            </div>
          }>
            <AuthProvider>
              <GlobalAuthErrorHandler />
              <I18nProvider>
                <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
                  <Navigation />
                  <main className="lg:pl-72 pt-0">
                    <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-6">
                      {children}
                    </div>
                  </main>
                  <BottomNavigation />
                  {/* PWA Install Prompt */}
                  <div className="fixed bottom-20 left-4 right-4 lg:left-80 lg:bottom-4 z-40">
                    <PWAWrapper />
                  </div>
                  {/* Offline Status Indicator - hidden on mobile */}
                  <div className="hidden lg:block fixed top-4 right-4 z-30">
                    <OfflineIndicator />
                  </div>
                </div>
              </I18nProvider>
            </AuthProvider>
          </Suspense>
        </AsyncErrorBoundary>
      </body>
    </html>
  );
}
