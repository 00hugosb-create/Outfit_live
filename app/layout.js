import './globals.css'
export const metadata = { title: 'Outfit Live', description: 'Tus outfits de la semana', appleWebApp: { capable: true, title: 'Outfit Live' } }
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#b962c5' }
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
