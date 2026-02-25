import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { AuthProvider } from '../frontend/contexts/AuthContext'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
})

export const metadata = {
  title: 'CareerAI - Assistant carrière IA',
  description: 'Assistant carrière propulsé par l’IA : conseils, CV et lettres personnalisés, gestion de documents, suivi des candidatures et candidatures automatiques (stages, CDI, CDD).',
  keywords: 'CV, carrière, IA, recrutement, lettre de motivation, candidature automatique, stage, CDI, CDD',
  authors: [{ name: 'CareerAI' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0f172a',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={plusJakarta.variable}>
      <head>
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased font-sans" suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
