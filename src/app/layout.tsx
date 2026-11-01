import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://repairtrack.app'),
  title: {
    default: 'RepairTrack — Repair Shop Management Software & Ticketing System',
    template: '%s | RepairTrack',
  },
  description:
    'All-in-one repair shop management SaaS and ticketing software. Organize repair tickets, device diagnostics, parts inventory, invoicing, payments, and real-time customer status tracking.',
  keywords: [
    'repair shop management software',
    'repair ticketing system',
    'repair shop software',
    'device repair tracking software',
    'repair shop CRM',
    'repair shop POS',
    'phone repair shop software',
    'computer repair management software',
    'electronics repair shop software',
    'repair order tracking system',
    'customer repair tracking portal',
    'repair shop inventory management',
    'repair shop invoicing software',
    'mobile repair management system',
    'repair business software',
  ],
  category: 'business',
  classification: 'Repair Shop Management Software',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'UpzbW5DGkt1WVHcnebJ7eyiXQQsW28g92kifYx0abmE',
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || '9C3F7FBC3DAE2F37AB36B97DDBCFCC93',
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png' }],
  },
  openGraph: {
    title: 'RepairTrack — Repair Shop Management Software & Ticketing System',
    description:
      'All-in-one repair shop management SaaS and ticketing software. Organize repair tickets, device diagnostics, parts inventory, invoicing, payments, and real-time customer status tracking.',
    siteName: 'RepairTrack',
    images: [
      {
        url: '/cover.png',
        width: 1200,
        height: 630,
        alt: 'RepairTrack — Modern repair shop operations, organized.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RepairTrack — Repair Shop Management Software & Ticketing System',
    description:
      'All-in-one repair shop management SaaS and ticketing software. Organize repair tickets, device diagnostics, parts inventory, invoicing, payments, and real-time customer status tracking.',
    images: ['/cover.png'],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
