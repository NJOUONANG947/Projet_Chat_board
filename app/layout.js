import '../frontend/styles/globals.css'

export const metadata = {
  title: 'Chat App',
  description: 'Simple chat application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
