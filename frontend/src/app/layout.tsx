import './globals.css';
import type { Metadata } from 'next';
import KeepAliveProvider from '@/components/KeepAliveProvider';

export const metadata: Metadata = {
  title: 'Study Hub - Study Materials Platform',
  description: 'Modern study materials management for Khulna University students and teachers',
  keywords: ['study materials', 'university', 'education', 'khulna university'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>🎓</text></svg>" />
      </head>
      <body className="overflow-x-hidden">
        <KeepAliveProvider />
        <div id="root" className="min-h-screen flex flex-col">
          {children}
        </div>
        <div id="modal-root" />
      </body>
    </html>
  );
}
