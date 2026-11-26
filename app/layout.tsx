import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dhaka Bites — Dhaka Restaurant Reviews',
  description: 'Discover and review the best restaurants across Dhaka.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
