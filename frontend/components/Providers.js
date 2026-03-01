'use client'

import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { ConfirmProvider } from '../contexts/ConfirmContext'
import { LanguageProvider } from '../contexts/LanguageContext'
import ErrorBoundary from '../components/ErrorBoundary'

export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  )
}
