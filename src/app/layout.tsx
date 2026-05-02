import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import ButtonGuard from "@/components/button-guard";
import { RouteTransitionProvider } from "@/components/route-transition-provider";
import ServiceWorkerRegistration from "@/components/service-worker-registration";
import SplashScreen from "@/components/splash-screen";
import { ToastProvider } from "@/components/toast-provider";
import OfflineBanner from "@/components/offline-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEON LAB — 팀 근무 일정 공유",
  description:
    "Apple 캘린더 구독 URL을 활용하여 팀 근무 일정을 공유·확인하는 서비스",
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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <SplashScreen />
        <ServiceWorkerRegistration />
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
