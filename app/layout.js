import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Providers from '../frontend/components/Providers'

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
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d0d0d',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={plusJakarta.variable}>
      <head>
        <meta name="theme-color" content="#0d0d0d" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-[#0d0d0d] text-zinc-100 antialiased font-sans overflow-x-hidden max-w-[100vw] w-full" suppressHydrationWarning={true}>
        <Providers>
          <div className="app-screen min-h-screen w-full">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
