import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "세림비앤지 현장 공지",
  description: "세림비앤지 다국어 생산 현장 공지사항 앱",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "세림공지",
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