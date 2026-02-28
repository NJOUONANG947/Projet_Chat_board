import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { logger } from '../lib/logger'
import CVCreationMenu from './CVCreationMenu'

const DOCUMENT_ACCEPT = '.pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'

export default function ChatGPT({
  messages,
  conversations = [],
  currentConversationId,
  onSendMessage,
  onStartNewConversation,
  onSwitchConversation,
  onDeleteConversation,
  onOpenCVBuilder,
  onOpenDocumentManager,
  onOpenApplicationTracker,
  onOpenRecruiterDashboard,
  onOpenSettings,
  onOpenJobCampaigns,
  loading,
  embedded = false,
  hideHistory = false,
}) {
  const { signOut } = useAuth()
  const toast = useToast()
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCVMenu, setShowCVMenu] = useState(false)
  const [attachedImages, setAttachedImages] = useState([])
  const [attachedDocument, setAttachedDocument] = useState(null)
  const [documentUploading, setDocumentUploading] = useState(false)
  const [generateImageMode, setGenerateImageMode] = useState(false)
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const fileInputRef = useRef(null)
  const documentInputRef = useRef(null)
  const plusMenuRef = useRef(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const showConversationSidebar = !embedded || !hideHistory

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [loading])

  useEffect(() => {
    const closePlusMenu = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setTimeout(() => setPlusMenuOpen(false), 0)
      }
    }
    if (plusMenuOpen) {
      document.addEventListener('click', closePlusMenu)
      return () => document.removeEventListener('click', closePlusMenu)
    }
  }, [plusMenuOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = input.trim()
    const hasAttached = attachedImages.length > 0
    const hasDocument = !!(attachedDocument && (attachedDocument.extractedText?.trim() || text))
    if ((!text && !hasAttached && !generateImageMode && !hasDocument) || loading) return

    const message = text || ''
    const images = [...attachedImages]
    const opts = {
      generateImage: generateImageMode,
      ...(attachedDocument && { documentText: attachedDocument.extractedText || '' }),
    }
    setInput('')
    setAttachedImages([])
    setAttachedDocument(null)
    setGenerateImageMode(false)
    await onSendMessage(message, images, opts)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const MAX_IMAGES = 5
  const MAX_SIZE_MB = 4

  const handleFileChange = (e) => {
    const files = e.target.files
    if (!files?.length) return
    const next = [...attachedImages]
    const readNext = (idx) => {
      if (idx >= files.length || next.length >= MAX_IMAGES) {
        e.target.value = ''
        return
      }
      const file = files[idx]
      if (!file.type.startsWith('image/') || file.size > MAX_SIZE_MB * 1024 * 1024) {
        readNext(idx + 1)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        next.push(reader.result)
        setAttachedImages([...next].slice(0, MAX_IMAGES))
        readNext(idx + 1)
      }
      reader.readAsDataURL(file)
    }
    readNext(0)
  }

  const removeImage = (index) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleDocumentChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowed.includes(file.type)) {
      toast.error('Format non supporté. Utilisez PDF, Word ou TXT.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10 Mo).')
      return
    }
    setDocumentUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', 'document')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'upload')
      }
      const extractedText = data.extractedText ?? data.document?.extracted_text ?? ''
      if (!extractedText || !extractedText.trim()) {
        toast.info('Document importé mais aucun texte extrait. Vous pouvez quand même poser une question.')
      } else {
        toast.success('Document importé. Posez votre question ci-dessous.')
      }
      setAttachedDocument({ name: file.name, extractedText: extractedText.trim() })
    } catch (err) {
      logger.error('Document upload error:', err)
      toast.error(err.message || 'Impossible d\'importer le document.')
    } finally {
      setDocumentUploading(false)
    }
  }

  const canSend = (input.trim() || attachedImages.length > 0 || generateImageMode || (attachedDocument?.extractedText?.trim())) && !loading

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Texte copié')
    } catch (err) {
      logger.error('Failed to copy text: ', err)
      toast.error('Copie impossible')
    }
  }

  if (loading) {
    if (embedded) {
      return (
        <div className="flex items-center justify-center min-h-[200px] w-full">
          <div className="w-10 h-10 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }
    return (
      <div className="page-root flex items-center justify-center min-h-[100dvh] sm:h-screen bg-[#0a0a0a] w-full">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="animate-float"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#007AFF]/20 border border-[#007AFF]/30 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#007AFF] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </motion.div>
          <p className="text-zinc-400 animate-pulse text-sm sm:text-base">Chargement de CareerAI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${embedded ? 'min-h-0 h-full' : 'min-h-[100dvh] sm:min-h-screen max-h-[100dvh] sm:max-h-none'} bg-[#0d0d0d] text-zinc-100 overflow-hidden w-full ${!embedded ? 'page-root' : ''}`}>
      <div className="flex flex-1 w-full min-h-0">

      {/* CV Creation Menu */}
      {showCVMenu && (
        <CVCreationMenu
          onClose={() => setShowCVMenu(false)}
          onOpenCVBuilder={onOpenCVBuilder}
          onOpenDocumentManager={onOpenDocumentManager}
        />
      )}

      {/* Sidebar conversations - style ChatGPT (une seule sidebar à gauche) */}
      {showConversationSidebar && (
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-80 bg-[#0a0a0a]/98 backdrop-blur-2xl border-r border-white/[0.08] z-50 flex flex-col"
            >
              <SidebarContent
                conversations={conversations}
                currentConversationId={currentConversationId}
                onStartNewConversation={onStartNewConversation}
                onSwitchConversation={onSwitchConversation}
                onDeleteConversation={onDeleteConversation}
                onClose={() => setSidebarOpen(false)}
                onOpenSettings={onOpenSettings}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      )}

      {/* Desktop: sidebar gauche unique (liste conversations) - comme ChatGPT */}
      {showConversationSidebar && (
      <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col bg-[#0a0a0a] border-r border-white/[0.08] min-h-0">
        <SidebarContent
          conversations={conversations}
          currentConversationId={currentConversationId}
          onStartNewConversation={onStartNewConversation}
          onSwitchConversation={onSwitchConversation}
          onDeleteConversation={onDeleteConversation}
          onOpenSettings={onOpenSettings}
        />
      </aside>
      )}

      {/* Zone centrale unique : header minimal + messages + input sticky (comme ChatGPT) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative z-10 bg-[#0d0d0d]">
        {/* Header minimal - une ligne */}
        {!embedded && (
        <header className="flex-shrink-0 h-12 sm:h-14 px-3 sm:px-4 border-b border-white/[0.08] flex items-center justify-between gap-2 bg-[#0d0d0d]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/[0.08] text-zinc-400 flex-shrink-0"
              aria-label="Ouvrir les conversations"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#007AFF]/20 border border-[#007AFF]/30 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">CV</span>
              </div>
              <h1 className="text-sm sm:text-base font-semibold text-white truncate">CareerAI</h1>
            </div>
          </div>
          <nav className="flex items-center gap-0.5 flex-shrink-0" aria-label="Actions">
            <button onClick={() => setShowCVMenu(true)} className="p-2 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-[#007AFF]" title="CV & Lettres">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
            <button onClick={onOpenDocumentManager} className="p-2 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-[#007AFF]" title="Documents">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" /></svg>
            </button>
            {onOpenApplicationTracker && <button onClick={onOpenApplicationTracker} className="p-2 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-[#007AFF]" title="Candidatures"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg></button>}
            {onOpenJobCampaigns && <button onClick={onOpenJobCampaigns} className="p-2 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-emerald-400" title="Campagnes"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></button>}
            {onOpenRecruiterDashboard && <button onClick={onOpenRecruiterDashboard} className="p-2 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-[#007AFF]" title="Recruteur"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>}
            {onOpenSettings && <button onClick={onOpenSettings} className="p-2 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-[#007AFF]" title="Paramètres"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>}
            <button onClick={async () => { try { await signOut() } catch (e) { logger.error('Logout error:', e); toast.error(e?.message || 'Erreur déconnexion') }} } className="p-2 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white" title="Se déconnecter">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </nav>
        </header>
        )}

        {embedded && showConversationSidebar && (
          <div className="flex-shrink-0 px-3 py-2 border-b border-white/[0.06] flex items-center lg:hidden">
            <button type="button" onClick={() => setSidebarOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white text-sm font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              Conversations
            </button>
          </div>
        )}

        {/* Messages - zone scrollable, max-width centré comme ChatGPT */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:px-8 sm:py-6">
            {messages.length === 0 ? (
              <div className="text-center py-8 sm:py-16">
                <div className="animate-float w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-[#007AFF]/20 border border-[#007AFF]/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-7 h-7 sm:w-10 sm:h-10 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-1.5 sm:mb-2">Comment puis-je vous aider ?</h2>
                <p className="text-zinc-400 text-xs sm:text-base mb-4 sm:mb-8 max-w-md mx-auto">Posez une question ou demandez de créer un CV, une lettre, ou des conseils carrière.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 max-w-lg mx-auto">
                  <div className="rounded-2xl bg-white/[0.05] border border-white/[0.08] p-4 sm:p-5 hover:border-[#007AFF]/30 transition-colors text-left">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#007AFF]/20 flex items-center justify-center mb-2 sm:mb-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-white font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base">Créer un CV</h3>
                    <p className="text-zinc-400 text-xs sm:text-sm">CV professionnel généré par l'IA</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.05] border border-white/[0.08] p-4 sm:p-5 hover:border-[#007AFF]/30 transition-colors text-left">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#007AFF]/20 flex items-center justify-center mb-2 sm:mb-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-white font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base">Analyser un CV</h3>
                    <p className="text-zinc-400 text-xs sm:text-sm">Conseils et améliorations ciblées</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-5">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id || index}
                    message={message}
                    onCopy={copyToClipboard}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input fixé en bas - style ChatGPT : un seul champ avec + à gauche */}
        <div className="flex-shrink-0 border-t border-white/[0.08] bg-[#0d0d0d] py-3 sm:py-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-4">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-8">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={documentInputRef}
                type="file"
                accept={DOCUMENT_ACCEPT}
                onChange={handleDocumentChange}
                className="hidden"
              />
              {attachedDocument && (
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#007AFF]/15 border border-[#007AFF]/30 text-sm text-zinc-200">
                    <svg className="w-4 h-4 text-[#007AFF] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate max-w-[180px]">{attachedDocument.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedDocument(null)}
                      className="p-1 rounded-lg hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors"
                      aria-label="Retirer le document"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  {documentUploading && <span className="text-xs text-zinc-500">Import en cours...</span>}
                </div>
              )}
              {attachedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachedImages.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt="" className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-white/[0.12]" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Retirer l'image"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div
                className="flex items-end gap-0 rounded-2xl bg-white/[0.06] border border-white/[0.12] focus-within:border-[#007AFF]/40 focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all shadow-lg"
                ref={plusMenuRef}
              >
                {/* Bouton + style ChatGPT */}
                <div className="relative flex-shrink-0 pl-2 sm:pl-3 pb-2 sm:pb-2.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPlusMenuOpen(prev => !prev) }}
                    className="p-2 rounded-lg text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors"
                    title="Pièces jointes"
                    aria-label="Ajouter une pièce jointe"
                    aria-expanded={plusMenuOpen}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {plusMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 mb-1 py-1.5 min-w-[200px] rounded-xl bg-[#1c1c1e] border border-white/[0.12] shadow-xl z-50"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setPlusMenuOpen(false)
                            if (documentUploading) return
                            documentInputRef.current?.click()
                          }}
                          disabled={documentUploading}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/[0.08] transition-colors rounded-lg mx-1 disabled:opacity-50"
                        >
                          <span className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </span>
                          <span>Importer un document</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPlusMenuOpen(false)
                            if (attachedImages.length >= MAX_IMAGES) {
                              toast.info(`Maximum ${MAX_IMAGES} images.`)
                              return
                            }
                            fileInputRef.current?.click()
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/[0.08] transition-colors rounded-lg mx-1"
                        >
                          <span className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </span>
                          <span>Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPlusMenuOpen(false)
                            toast.info('Génération d\'image indisponible pour le moment.')
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/[0.08] transition-colors rounded-lg mx-1"
                        >
                          <span className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </span>
                          <span>Générer une image</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Zone de texte */}
                <div className="flex-1 relative min-w-0 py-2 sm:py-2.5">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={attachedDocument ? 'Posez une question sur ce document...' : 'Écrivez votre message...'}
                    disabled={loading}
                    rows={1}
                    className="w-full resize-none bg-transparent px-1 sm:px-2 pr-10 sm:pr-12 text-zinc-100 placeholder:text-zinc-500 text-sm sm:text-base focus:outline-none border-0 focus:ring-0 min-h-[24px] max-h-[200px]"
                    style={{ minHeight: '24px' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!canSend}
                    className="absolute right-1.5 bottom-1.5 sm:right-2 sm:bottom-2 p-2 sm:p-2.5 rounded-xl bg-[#007AFF] text-white hover:bg-[#0056b3] disabled:bg-white/[0.1] disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </form>
            <p className="text-xs text-zinc-500 mt-2 text-center">Entrée pour envoyer · Maj+Entrée nouvelle ligne</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

function SidebarContent({
  conversations,
  currentConversationId,
  onStartNewConversation,
  onSwitchConversation,
  onDeleteConversation,
  onOpenSettings,
  onClose
}) {
  return (
    <>
      <div className="p-3 border-b border-white/[0.08] flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#007AFF]/20 border border-[#007AFF]/30 flex items-center justify-center">
          <span className="text-white font-bold text-xs">CV</span>
        </div>
        <span className="font-semibold text-white text-sm">CareerAI</span>
      </div>
      <div className="p-4 border-b border-white/[0.08]">
        <button
          onClick={() => {
            onStartNewConversation()
            onClose?.()
          }}
          className="w-full flex items-center justify-center gap-2 bg-[#007AFF] hover:bg-[#0056b3] text-white font-semibold rounded-xl px-4 py-3 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nouvelle conversation</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`w-full flex items-center gap-2 mb-1 px-2 py-2 rounded-xl group ${
                conv.id === currentConversationId
                  ? 'bg-[#007AFF]/20 border border-[#007AFF]/30'
                  : 'hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <button
                onClick={() => {
                  onSwitchConversation(conv.id)
                  onClose?.()
                }}
                className="flex-1 min-w-0 text-left px-1 py-1 rounded-lg focus:outline-none"
              >
                <div className="font-medium truncate text-sm text-gray-100">
                  {conv.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {new Date(conv.created_at).toLocaleDateString()}
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDeleteConversation?.(conv.id) }}
                className="flex-shrink-0 p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/[0.1] transition-colors"
                title="Supprimer la conversation"
                aria-label="Supprimer la conversation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {onOpenSettings && (
        <div className="p-3 border-t border-white/[0.08]">
          <button
            onClick={() => {
              onOpenSettings()
              onClose?.()
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Paramètres
          </button>
        </div>
      )}
    </>
  )
}

function MessageBubble({ message, onCopy }) {
  const [showActions, setShowActions] = useState(false)
  const generatedImageUrl = message.generatedImageUrl || (() => {
    if (message.role !== 'assistant' || !message.content) return null
    const m = message.content.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/)
    return m ? m[1] : null
  })()
  const displayContent = message.content && generatedImageUrl
    ? message.content.replace(/\n*!\[[^\]]*\]\([^)]+\)\n*/g, '\n').trim()
    : message.content

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-5`}
    >
      <div className={`max-w-full ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
        <div className="flex items-start gap-2 sm:gap-3">
          {message.role === 'assistant' && (
            <div className="w-8 h-8 rounded-2xl bg-[#007AFF]/20 border border-[#007AFF]/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <div
            className={`relative group ${message.role === 'user' ? 'order-1' : 'order-2'}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
          >
            <div
              className={`rounded-2xl px-3 sm:px-4 py-3 break-words ${
                message.role === 'user'
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-white/[0.06] border border-white/[0.08] text-zinc-100'
              }`}
            >
              {message.images?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {message.images.map((src, i) => (
                    <img key={i} src={src} alt="" className="max-w-[120px] max-h-[120px] rounded-lg object-cover border border-white/20" />
                  ))}
                </div>
              )}
              {message.role === 'assistant' && generatedImageUrl && (
                <div className="mb-2">
                  <img src={generatedImageUrl} alt="Générée par l'IA" className="max-w-full max-h-[320px] rounded-lg object-contain border border-white/[0.12]" />
                </div>
              )}
              {(displayContent && displayContent.trim() && displayContent.trim() !== '[Image(s)]') && (
              <div className="prose prose-sm max-w-none prose-invert break-words">
                {displayContent.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>
                    {line}
                  </p>
                ))}
              </div>
              )}
              {message.isStreaming && (
                <div className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />
              )}
            </div>

            <AnimatePresence>
              {showActions && !message.isStreaming && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-0 right-0 transform translate-x-full ml-2 hidden sm:block"
                >
                  <button
                    onClick={() => onCopy(message.content)}
                    className="p-2 bg-white/[0.1] border border-white/[0.12] rounded-xl hover:bg-white/[0.15] transition-colors"
                    title="Copier"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-2xl bg-white/[0.08] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
