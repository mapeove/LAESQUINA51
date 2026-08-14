import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/features/cart/cart-context';
import { PushNotificationManager } from '@/components/PushNotificationManager';

export const viewport: Viewport = {
  themeColor: '#F3E8CC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'La Esquina 51 | Venezuelan Street Food en Sevilla',
  description: 'Comida callejera venezolana y fusión latina en Sevilla. Hamburguesas, perros, shawarma, empanadas y boxes. Pedidos viernes, sábados y domingos.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'La Esquina 51',
  },
  openGraph: {
    title: 'La Esquina 51 | Venezuelan Street Food en Sevilla',
    description: 'Comida callejera venezolana y fusión latina en Sevilla. Hamburguesas, perros, shawarma, empanadas y boxes. Pedidos viernes, sábados y domingos.',
    url: 'https://laesquina51.es',
    siteName: 'La Esquina 51',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Esquina 51 | Venezuelan Street Food',
    description: 'Comida callejera venezolana y fusión latina en Sevilla.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#F3E8CC] text-[#3A2418] font-inter min-h-[100dvh] antialiased">
        <CartProvider>
          <PushNotificationManager />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
