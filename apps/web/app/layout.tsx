import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Truyện Reading",
  description: "Vietnamese novel reading website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
