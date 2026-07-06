import type { Metadata, Viewport } from 'next';
import { Baloo_2, Nunito, Cinzel, Manrope } from 'next/font/google';
import '@/styles/globals.css';
import '@/styles/design-tokens.css';
import SessionProvider from '@/components/SessionProvider';
import MotionProvider from '@/components/MotionProvider';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Toaster } from 'react-hot-toast';
import { brand } from '@/config/brand';

// Legacy Little Loot type pairing - kept only until every component using it
// is redesigned (see DESIGN_SYSTEM.md). Do not use for new Girnar surfaces.
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

// Girnar Gifts type pairing - classical inscribed display serif (kin to the
// logo wordmark) + a clean geometric/humanist sans for UI and body copy.
const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
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
    <html lang="en" className={`${baloo2.variable} ${nunito.variable} ${cinzel.variable} ${manrope.variable}`}>
      <body>
        <MotionProvider>
          <SessionProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
                <Toaster position="top-right" />
              </WishlistProvider>
            </CartProvider>
          </SessionProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
