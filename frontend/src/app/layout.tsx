import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'LinkLens – Enterprise Link Intelligence Platform',
  description:
    'High-performance link analytics, smart redirects, dynamic QR codes, and enterprise-grade APIs. Privacy-first, self-hosted link intelligence.',
  keywords: 'link analytics, URL shortener, smart redirects, QR codes, campaign management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
