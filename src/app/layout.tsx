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

const appleStartupImages = [
  {
    href: "/apple-startup/640x1136.png",
    media:
      "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
  },
  {
    href: "/apple-startup/750x1334.png",
    media:
      "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
  },
  {
    href: "/apple-startup/828x1792.png",
    media:
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
  },
  {
    href: "/apple-startup/1125x2436.png",
    media:
      "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
  },
  {
    href: "/apple-startup/1170x2532.png",
    media:
      "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
  },
  {
    href: "/apple-startup/1179x2556.png",
    media:
      "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
  },
  {
    href: "/apple-startup/1242x2688.png",
    media:
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
  },
  {
    href: "/apple-startup/1284x2778.png",
    media:
      "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
  },
  {
    href: "/apple-startup/1290x2796.png",
    media:
      "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
  },
];

export const metadata: Metadata = {
  title: "SEON LAB — 팀 근무 일정 공유",
  description:
    "Apple 캘린더 구독 URL을 활용하여 팀 근무 일정을 공유·확인하는 서비스",
  applicationName: "SEON LAB",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "SEON LAB",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#ffffff",
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
      <head>
        {appleStartupImages.map((image) => (
          <link
            key={image.href}
            rel="apple-touch-startup-image"
            href={image.href}
            media={image.media}
          />
        ))}
      </head>
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
