import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CARAMBA | Web Order',
  description: 'Burritos a tu manera',
  manifest: '/manifest.json', // Although not strictly requested, it's a PWA
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
      </body>
    </html>
  );
}
