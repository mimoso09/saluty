import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import SplashScreen from '@/components/SplashScreen';

export const metadata: Metadata = {
  title: 'Saluty — Evalúa tu comida con IA',
  description:
    'Sube fotos, pega ingredientes o describe tu comida y recibe un análisis nutricional con IA. Tu asistente inteligente de salud.',
  keywords: ['nutrición', 'salud', 'IA', 'análisis nutricional', 'ultraprocesados'],
  applicationName: 'Saluty',
  appleWebApp: {
    capable: true,
    title: 'Saluty',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#06070a',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="app-wrapper">{children}</div>
        <SplashScreen />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
