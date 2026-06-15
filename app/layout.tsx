import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Saluty — Evalúa tu comida con IA',
  description:
    'Sube fotos, pega ingredientes o describe tu comida y recibe un análisis nutricional con IA. Tu asistente inteligente de salud.',
  keywords: ['nutrición', 'salud', 'IA', 'análisis nutricional', 'ultraprocesados'],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="app-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
