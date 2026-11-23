export default function manifest() {
  return {
    name: 'Outfit Live',
    short_name: 'Outfit Live',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff7fc',
    theme_color: '#b962c5',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
