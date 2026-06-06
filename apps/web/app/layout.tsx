import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./components/Providers"

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TruyệnHay - Đọc Truyện Online",
  description: "Vietnamese novel reading website",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
