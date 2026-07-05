import type { Metadata, Viewport } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import '@/styles/globals.css';
import SessionProvider from '@/components/SessionProvider';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Toaster } from 'react-hot-toast';
import { brand } from '@/config/brand';

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
  metadataBase: new URL(brand.url),
  title: { default: brand.name, template: `%s | ${brand.name}` },
  description: brand.description,
  openGraph: {
    title: brand.name,
    description: brand.description,
    url: brand.url,
    siteName: brand.name,
    images: [brand.assets.ogImage],
  },
  icons: { icon: brand.assets.favicon },
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
            <WishlistProvider>
              {children}
              <Toaster position="top-right" />
            </WishlistProvider>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
