import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import CVCreationMenu from './CVCreationMenu'

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
  loading
}) {
  const { signOut } = useAuth()
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCVMenu, setShowCVMenu] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const message = input.trim()
    setInput('')
    await onSendMessage(message)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-center">
          <div className="animate-float">
            <div className="w-16 h-16 bg-blue-900/80 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-800/50">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-zinc-400 animate-pulse">Chargement de CareerAI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/40 to-transparent pointer-events-none" />

      {/* CV Creation Menu */}
      {showCVMenu && (
        <CVCreationMenu
          onClose={() => setShowCVMenu(false)}
          onOpenCVBuilder={onOpenCVBuilder}
          onOpenDocumentManager={onOpenDocumentManager}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-80 bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-700/50 z-50 flex flex-col"
            >
              <SidebarContent
                conversations={conversations}
                currentConversationId={currentConversationId}
                onStartNewConversation={onStartNewConversation}
                onSwitchConversation={onSwitchConversation}
                onClose={() => setSidebarOpen(false)}
                onOpenSettings={onOpenSettings}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-700/50">
        <SidebarContent
          conversations={conversations}
          currentConversationId={currentConversationId}
          onStartNewConversation={onStartNewConversation}
          onSwitchConversation={onSwitchConversation}
          onDeleteConversation={onDeleteConversation}
          onOpenSettings={onOpenSettings}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-700/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-3 p-2 rounded-xl hover:bg-zinc-700/50 transition-colors text-zinc-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-900/80 rounded-xl flex items-center justify-center border border-blue-800/50">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">CareerAI</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCVMenu(true)}
              className="p-2.5 rounded-xl hover:bg-zinc-700/50 transition-colors text-zinc-400 hover:text-blue-200"
              title="Créer un CV"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              onClick={onOpenDocumentManager}
              className="p-2.5 rounded-xl hover:bg-zinc-700/50 transition-colors text-zinc-400 hover:text-blue-200"
              title="Documents"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
            </button>
            {onOpenApplicationTracker && (
              <button
                onClick={onOpenApplicationTracker}
                className="p-2.5 rounded-xl hover:bg-zinc-700/50 transition-colors text-zinc-400 hover:text-blue-200"
                title="Suivi des candidatures"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </button>
            )}
            {onOpenJobCampaigns && (
              <button
                onClick={onOpenJobCampaigns}
                className="p-2.5 rounded-xl hover:bg-zinc-700/50 transition-colors text-zinc-400 hover:text-emerald-200"
                title="Candidatures automatiques"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
            )}
            {onOpenRecruiterDashboard && (
              <button
                onClick={onOpenRecruiterDashboard}
                className="p-2.5 rounded-xl hover:bg-zinc-700/50 transition-colors text-zinc-400 hover:text-blue-200"
                title="Dashboard Recruteur"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
            )}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2.5 rounded-xl hover:bg-zinc-700/50 transition-colors text-zinc-400 hover:text-blue-200"
                title="Paramètres"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            <div className="border-l border-zinc-600 pl-2 ml-1">
              <button
                onClick={async () => {
                  try {
                    await signOut()
                  } catch (error) {
                    console.error('Logout error:', error)
                  }
                }}
                className="p-2.5 rounded-xl hover:bg-zinc-600/50 transition-colors text-zinc-400 hover:text-zinc-200"
                title="Se déconnecter"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="animate-float w-20 h-20 bg-blue-900/80 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-800/50">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Comment puis-je vous aider ?</h2>
                <p className="text-zinc-400 text-lg mb-10">Posez une question ou demandez de créer un CV, une lettre, ou des conseils carrière.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <div className="bg-zinc-800/60 border border-zinc-600/40 p-5 rounded-2xl hover:border-blue-800/50 transition-colors text-left">
                    <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-white font-semibold mb-1">Créer un CV</h3>
                    <p className="text-zinc-400 text-sm">CV professionnel généré par l'IA</p>
                  </div>
                  <div className="bg-zinc-800/60 border border-zinc-600/40 p-5 rounded-2xl hover:border-blue-800/50 transition-colors text-left">
                    <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-white font-semibold mb-1">Analyser un CV</h3>
                    <p className="text-zinc-400 text-sm">Conseils et améliorations ciblées</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
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

        {/* Input */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-700/50 px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Écrivez votre message..."
                    disabled={loading}
                    rows={1}
                    className="w-full resize-none bg-zinc-800/80 border border-zinc-600/50 rounded-xl px-4 py-3 pr-12 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-900/50 focus:border-blue-800/50 transition-all"
                    style={{ minHeight: '48px', maxHeight: '200px' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="absolute right-2 bottom-2 p-2.5 rounded-xl bg-blue-900/80 text-white hover:bg-blue-800/90 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-all border border-blue-800/50"
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
            <p className="text-xs text-zinc-500 mt-2 text-center">
              Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
            </p>
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
      <div className="p-4 border-b border-zinc-700/50">
        <button
          onClick={() => {
            onStartNewConversation()
            onClose?.()
          }}
          className="w-full flex items-center justify-center gap-2 bg-blue-900/80 hover:bg-blue-800/90 text-white font-semibold rounded-xl px-4 py-3 border border-blue-800/50 transition-all"
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
              className={`w-full flex items-center justify-between mb-1 px-2 py-1.5 rounded-xl ${
                conv.id === currentConversationId
                  ? 'bg-blue-900/30 border border-blue-800/50'
                  : 'hover:bg-zinc-700/40 border border-transparent'
              }`}
            >
              <button
                onClick={() => {
                  onSwitchConversation(conv.id)
                  onClose?.()
                }}
                className="flex-1 text-left px-2 py-2 rounded-lg focus:outline-none"
              >
                <div className="font-medium truncate text-sm text-gray-100">
                  {conv.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(conv.created_at).toLocaleDateString()}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onDeleteConversation?.(conv.id)}
                className="ml-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-600/50 rounded-lg transition-colors"
                title="Supprimer la conversation"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      </div>

      {onOpenSettings && (
        <div className="p-3 border-t border-zinc-700/50">
          <button
            onClick={() => {
              onOpenSettings()
              onClose?.()
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-colors text-sm font-medium"
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
    >
      <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
        <div className="flex items-start space-x-3">
          {message.role === 'assistant' && (
            <div className="w-8 h-8 bg-blue-900/80 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-800/50">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className={`rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-900/80 text-white border border-blue-800/50'
                  : 'bg-zinc-800/80 border border-zinc-600/40 text-zinc-100'
              }`}
            >
              <div className="prose prose-sm max-w-none prose-invert">
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>
                    {line}
                  </p>
                ))}
              </div>
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
                  className="absolute top-0 right-0 transform translate-x-full ml-2"
                >
                  <button
                    onClick={() => onCopy(message.content)}
                    className="p-2 bg-zinc-700/80 border border-zinc-600/50 rounded-xl hover:bg-zinc-600/80 transition-colors"
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
            <div className="w-8 h-8 bg-zinc-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
