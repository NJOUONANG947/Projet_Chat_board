import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { useAuth } from '../contexts/AuthContext'

export default function Chat({
  messages,
  conversations = [],
  currentConversationId,
  onSendMessage,
  onStartNewConversation,
  onSwitchConversation,
  onOpenCVBuilder,
  onOpenDocumentManager
}) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const { signOut, user } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, sending])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    setSending(true)
    await onSendMessage(input.trim())
    setInput('')
    setSending(false)
  }

  const handleStartNewChat = () => {
    onStartNewConversation()
  }

  return (
    <div className="chat-container flex h-screen">
      {/* Sidebar - Hidden on mobile, overlay on tablet */}
      <motion.div
        initial={{ rotateY: -90, x: -300 }}
        animate={{
          rotateY: sidebarOpen ? 0 : -90,
          x: sidebarOpen ? 0 : -300
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          transformOrigin: 'left center'
        }}
        className={`fixed left-0 top-0 h-full w-64 md:w-80 bg-gray-100/90 backdrop-blur-md border-r border-gray-300/50 z-20 shadow-2xl ${
          sidebarOpen ? 'block' : 'hidden md:block'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)'
        }}
      >
        <div className="p-4 md:p-6" style={{ transform: 'translateZ(20px)' }}>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-800 text-lg md:text-xl font-semibold mb-4 md:mb-6"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          >
            Conversations
          </motion.h2>
          <motion.button
            whileHover={{
              scale: 1.05,
              rotateX: 5,
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), 0 8px 20px -5px rgba(0, 0, 0, 0.1)'
            }}
            whileTap={{ scale: 0.95, rotateX: 0 }}
            onClick={handleStartNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-all duration-300 font-medium mb-4"
            style={{
              transform: 'translateZ(10px)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            Nouvelle Discussion
          </motion.button>
          <div className="space-y-2">
            {conversations?.map((conv) => (
              <motion.button
                key={conv.id}
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSwitchConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-300 ${
                  conv.id === currentConversationId
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-white/50 text-gray-700 hover:bg-white/70'
                }`}
                style={{
                  transform: 'translateZ(5px)',
                  boxShadow: conv.id === currentConversationId
                    ? '0 2px 4px -1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                    : '0 1px 2px -1px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="font-medium truncate">{conv.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(conv.createdAt).toLocaleDateString()}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat */}
      <div className="flex-1 flex flex-col md:ml-80">
        {/* Header */}
        <div className="bg-gray-50/80 backdrop-blur-md border-b border-gray-200/50 p-3 md:p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-3 md:mr-4 text-gray-600 hover:text-blue-600 transition-colors p-1"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-gray-800 text-lg md:text-xl font-semibold">Chat AI</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenCVBuilder}
              className="text-gray-600 hover:text-blue-600 transition-colors p-1"
              title="Constructeur CV"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              onClick={onOpenDocumentManager}
              className="text-gray-600 hover:text-green-600 transition-colors p-1"
              title="Gestionnaire de Documents"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
            </button>
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-gray-600 hover:text-red-600 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 chat-mobile-padding">
          {messages.map((msg, index) => (
            <MessageBubble key={index} message={msg} isUser={msg.role === 'user'} />
          ))}
          {sending && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <motion.div
          className="bg-gray-50/80 backdrop-blur-md border-t border-gray-200/50 p-3 md:p-4"
          style={{
            transform: 'translateZ(5px)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          }}
        >
          <form onSubmit={handleSubmit} className="flex space-x-2 md:space-x-3">
            <motion.input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre message..."
              disabled={sending}
              className="flex-1 bg-white/70 border border-gray-300/50 rounded-lg px-3 md:px-4 py-2 md:py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 chat-mobile-text"
              style={{
                transform: 'translateZ(2px)',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 0 rgba(255, 255, 255, 0.5)'
              }}
              whileFocus={{
                scale: 1.01,
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 0 rgba(255, 255, 255, 0.5)'
              }}
            />
            <motion.button
              type="submit"
              disabled={sending}
              whileHover={{
                scale: 1.05,
                rotateX: 5,
                z: 10
              }}
              whileTap={{ scale: 0.95, rotateX: 0 }}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg transition-all duration-300 flex items-center space-x-1 md:space-x-2 font-medium text-sm md:text-base"
              style={{
                transform: 'translateZ(5px)',
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                transformStyle: 'preserve-3d'
              }}
            >
              <span style={{ transform: 'translateZ(2px)' }}>
                {sending ? 'Envoi...' : 'Envoyer'}
              </span>
              <motion.svg
                className="w-3 h-3 md:w-4 md:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={sending ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: sending ? Infinity : 0, ease: 'linear' }}
                style={{ transform: 'translateZ(2px)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </motion.svg>
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
