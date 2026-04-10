import type { Metadata, Viewport } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import '@/styles/globals.css';
import SessionProvider from '@/components/SessionProvider';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'react-hot-toast';

const baloo2 = Baloo_2({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-baloo',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Little Loot — Kids & Stationery Store',
  description:
    'Your one-stop destination for premium kids toys, creative stationery, and educational games. Bringing joy to every child!',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${baloo2.variable} ${nunito.variable}`}>
      <body>
        <SessionProvider>
          <CartProvider>
            {children}
            <Toaster position="top-right" />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
