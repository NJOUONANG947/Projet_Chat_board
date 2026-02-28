'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { logger } from '../../lib/logger'

const NAV_ITEMS = [
  { id: 'cv', label: 'CV & Lettres', icon: FileIcon, href: null },
  { id: 'candidatures', label: 'Candidatures', icon: ListIcon, href: null },
  { id: 'campagnes', label: 'Campagnes', icon: CampaignIcon, href: null },
  { id: 'recruteur', label: 'Recruteur', icon: RecruiterIcon, href: null },
  { id: 'parametres', label: 'Paramètres', icon: SettingsIcon, href: null },
]

function FileIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
function ListIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}
function CampaignIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}
function RecruiterIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}
function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function MenuIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

export default function AppShell({
  children,
  onNavAction,
  title = 'CareerAI',
  showMobileNav = true,
}) {
  const { signOut } = useAuth()
  const toast = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      logger.error('Logout error:', error)
      toast.error(error?.message || 'Erreur lors de la déconnexion')
    }
  }

  const handleNav = (id) => {
    onNavAction?.(id)
    setSidebarOpen(false)
  }

  const SidebarContent = () => (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNav(item.id)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-[100dvh] sm:min-h-screen max-h-[100dvh] sm:max-h-none bg-[#0d0d0d] text-zinc-100 overflow-hidden w-full">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 xl:w-64 flex-shrink-0 bg-[#0d0d0d] border-r border-white/[0.06]">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
              <span className="text-white font-bold text-sm">CV</span>
            </div>
            <span className="font-semibold text-white tracking-tight">CareerAI</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-[#0d0d0d] border-r border-white/[0.06] z-50 flex flex-col"
            >
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">CV</span>
                  </div>
                  <span className="font-semibold text-white">CareerAI</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/[0.08] text-zinc-400"
                  aria-label="Fermer"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 px-3 sm:px-6 flex items-center justify-between gap-2 bg-[#0d0d0d] border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/[0.06] text-zinc-400"
              aria-label="Menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-white truncate">{title}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <LogoutIcon className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 min-h-0 overflow-hidden overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        {showMobileNav && (
          <nav className="lg:hidden flex-shrink-0 h-16 px-2 pb-[env(safe-area-inset-bottom)] pt-2 bg-[#0d0d0d] border-t border-white/[0.06] safe-area-pb">
            <div className="flex items-center justify-around gap-1 max-w-lg mx-auto">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 rounded-xl text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors touch-target"
                  aria-label={item.label}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium truncate max-w-[64px]">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
