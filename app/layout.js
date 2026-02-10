import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../frontend/contexts/AuthContext'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'CareerAI - Révolutionnez Votre Carrière',
  description: 'Analysez vos CV, générez des lettres de motivation personnalisées et optimisez votre recherche d\'emploi avec l\'intelligence artificielle la plus avancée.',
  keywords: 'CV, carrière, IA, recrutement, lettre de motivation, analyse CV',
  authors: [{ name: 'CareerAI Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#1e1b4b',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#1e1b4b" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white antialiased" suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
