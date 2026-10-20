import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://repairtrack.app'),
  title: {
    default: 'RepairTrack',
    template: '%s | RepairTrack',
  },
  description: 'Repair shop operations, organized.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png' }],
  },
  openGraph: {
    title: 'RepairTrack',
    description: 'Repair shop operations, organized.',
    siteName: 'RepairTrack',
    images: [
      {
        url: '/cover.png',
        width: 1200,
        height: 630,
        alt: 'RepairTrack — Repair shop operations, organized.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RepairTrack',
    description: 'Repair shop operations, organized.',
    images: ['/cover.png'],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}><body className="flex min-h-full flex-col"><Providers>{children}</Providers></body></html>
}
