import './globals.css';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import "@/lib/prewarm-timer";

export const metadata = {
  title: 'Binance RSI Dashboard',
  description: 'RSI across all Binance spot pairs',
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning className="dark">
      <body className={`${inter.className} min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}>
        <div className="max-w-7xl mx-auto px-3 py-4">{children}</div>
      </body>
    </html>
  );
}
