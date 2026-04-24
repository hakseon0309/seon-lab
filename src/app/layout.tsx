import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import ButtonGuard from "@/components/button-guard";
import { RouteTransitionProvider } from "@/components/route-transition-provider";
import SplashScreen from "@/components/splash-screen";
import { ToastProvider } from "@/components/toast-provider";
import OfflineBanner from "@/components/offline-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEON LAB — 팀 시프트 공유",
  description:
    "Apple 캘린더 구독 URL을 활용하여 팀원들의 근무 시프트를 한눈에 공유·확인하는 서비스",
  applicationName: "SEON LAB",
  appleWebApp: {
    capable: true,
    title: "SEON LAB",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SplashScreen />
        <I18nProvider>
          <ThemeProvider>
            <ToastProvider>
              <OfflineBanner />
              <RouteTransitionProvider>
                <ButtonGuard />
                {children}
              </RouteTransitionProvider>
            </ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
