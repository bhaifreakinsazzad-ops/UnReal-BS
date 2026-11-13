import type { MetadataRoute } from 'next'
import { brand } from '@/lib/brand'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'UnReal BS — Business Systems',
    short_name: 'UnReal BS',
    description: brand.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#070712',
    theme_color: '#070712',
    lang: 'en',
    dir: 'ltr',
    orientation: 'any',
    categories: ['business', 'productivity', 'utilities'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/pwa/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
