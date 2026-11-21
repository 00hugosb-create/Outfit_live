import './globals.css'
export const metadata = { title: 'Outfit Live', description: 'Tus outfits de la semana' }
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#ab6cc4' }
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
