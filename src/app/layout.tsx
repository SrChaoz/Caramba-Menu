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

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] header-checkered bg-caramba-bg z-40 border-b-2 border-caramba-border flex flex-col items-center justify-center">
      <div className="flex items-center gap-2">
        <h1 className="text-white font-black text-3xl italic tracking-tighter mix-blend-plus-lighter">CARAMBA</h1>
        <span className="text-2xl pt-1">🌯</span>
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
