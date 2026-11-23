import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "세림비앤지 생산본부",
  description: "세림비앤지 생산본부 웹앱",

  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/app-icon.png",
    apple: "/app-icon.png",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "생산본부",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
