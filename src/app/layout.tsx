import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next";
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CARAMBA | Web Order',
  description: 'Arma tus burritos a tu manera de forma rápida y sencilla.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'CARAMBA | Web Order',
    description: 'Arma tus burritos a tu manera de forma rápida y sencilla.',
    url: 'https://caramba-menu.vercel.app',
    siteName: 'CARAMBA',
    locale: 'es_EC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CARAMBA | Web Order',
    description: 'Arma tus burritos a tu manera de forma rápida y sencilla.',
  },
};

export const viewport: Viewport = {
  themeColor: '#111113',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // For mobile app feel
};

import Image from 'next/image';

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] bg-caramba-surface z-40 border-b-2 border-caramba-border flex flex-col items-center justify-center shadow-lg">
      <div className="flex items-center justify-center w-full">
        <Image src="/logo-fw.png" alt="Caramba Logo" width={220} height={56} className="h-14 w-auto object-contain" priority />
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased text-caramba-text bg-caramba-bg min-h-screen selection:bg-caramba-red/30`}>
        <Header />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
