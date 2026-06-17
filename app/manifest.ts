import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Saluty — Evalúa tu comida con IA',
    short_name: 'Saluty',
    description:
      'Analiza alimentos con IA y descubre tu Score Saluty en segundos.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#06070a',
    categories: ['health', 'food', 'lifestyle'],
    lang: 'es',
    icons: [
      {
        src: '/icon.jpg',
        sizes: 'any',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/apple-icon.jpg',
        sizes: 'any',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  };
}
