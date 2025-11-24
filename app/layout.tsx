import type React from "react"
import type { Metadata } from "next"
import { Noto_Sans_Thai } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { SettingsProvider } from "@/lib/settings-context"

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Unizorn - ระบบบัญชีและการเงิน",
  description: "ระบบบัญชีและการเงินสำหรับนิติบุคคลอาคารชุด",
  generator: 'v0.app',
  appleWebApp: {
    capable: false,
  },
  manifest: undefined,
  other: {
    'mobile-web-app-capable': 'no',
    'apple-mobile-web-app-capable': 'no',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This is the root layout. It provides the essential html and body tags.
  // Next.js will automatically use the correct layout from the route groups inside {children}.
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body className="bg-gray-50" suppressHydrationWarning>
        <SettingsProvider>
          {children}
          <Toaster />
        </SettingsProvider>
      </body>
    </html>
  )
}

