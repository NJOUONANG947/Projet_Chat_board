// Custom hook for chat functionality
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [loading, setLoading] = useState(true)

  const toast = useToast()
  const confirm = useConfirm()
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  const getAuthHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}
  }

  /* -----------------------------
     Fetch conversations on login
  ------------------------------ */
  useEffect(() => {
    if (user) {
      fetchConversations()
    } else {
      setConversations([])
      setMessages([])
      setCurrentConversationId(null)
    }
  }, [user])

  /* -----------------------------
     Fetch messages when switching
     conversation (DO NOT RESET)
  ------------------------------ */
  useEffect(() => {
    if (currentConversationId && user) {
      fetchMessages(currentConversationId)
    }
  }, [currentConversationId, user])

  /* -----------------------------
     Fetch conversations
  ------------------------------ */
  const fetchConversations = async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/chat', { headers })
      const data = await res.json()

      setConversations(data.conversations || [])

      if (data.conversations?.length > 0) {
        setCurrentConversationId(prev =>
          prev ? prev : data.conversations[0].id
        )
      } else {
        await startNewConversation()
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  /* -----------------------------
     Fetch messages
  ------------------------------ */
  const fetchMessages = async (conversationId) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(
        `/api/chat?conversationId=${conversationId}`,
        { headers }
      )
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  /* -----------------------------
     Delete conversation
  ------------------------------ */
  const deleteConversation = async (conversationId) => {
    if (!conversationId || !user) return
    const ok = await confirm({ title: 'Supprimer la conversation', message: 'Supprimer définitivement cette conversation et tous ses messages ?', confirmLabel: 'Supprimer', danger: true })
    if (!ok) return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/chat?conversationId=${conversationId}`, {
        method: 'DELETE',
        headers,
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression de la conversation')
      }

      setConversations(prev => prev.filter(c => c.id !== conversationId))

      if (conversationId === currentConversationId) {
        // Si on supprime la conversation active, en sélectionner une autre ou en créer une
        setMessages([])
        const remaining = conversations.filter(c => c.id !== conversationId)
        if (remaining.length > 0) {
          const next = remaining[0]
          setCurrentConversationId(next.id)
          await fetchMessages(next.id)
        } else {
          setCurrentConversationId(null)
          await startNewConversation()
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast.error(error.message || 'Erreur lors de la suppression de la conversation')
    }
  }

  /* -----------------------------
     Send message with streaming
  ------------------------------ */
  const sendMessage = async (message, images = [], options = {}) => {
    if ((!message || !message.trim()) && (!images || images.length === 0) && !options.generateImage && !(options.documentText && options.documentText.trim())) return
    if (!currentConversationId || !user) return

    const imageList = Array.isArray(images) ? images : []
    const wantGenerateImage = !!options.generateImage

    const userMessage = {
      content: wantGenerateImage ? (message || '').trim() || 'Générer une image' : ((message || '').trim() || (options.documentText ? ' [Document joint]' : ' [Image(s)]')),
      role: 'user',
      createdAt: new Date(),
      ...(imageList.length > 0 && { images: imageList }),
    }

    setMessages(prev => [...prev, userMessage])

    // Add streaming assistant message placeholder
    const assistantMessageId = Date.now().toString()
    const assistantMessage = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      createdAt: new Date(),
      isStreaming: true,
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      const headers = await getAuthHeaders()

      // Use streaming endpoint
      const response = await fetch('/api/chat', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          message: (message || '').trim(),
          conversationId: currentConversationId,
          ...(imageList.length > 0 && { images: imageList }),
          ...(wantGenerateImage && { generateImage: true }),
          ...(options.documentText && options.documentText.trim() && { documentText: options.documentText.trim() }),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start streaming')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              // Streaming complete
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              )
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.chunk) {
                fullContent += parsed.chunk
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                )
              }
              if (parsed.imageUrl) {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, generatedImageUrl: parsed.imageUrl, content: fullContent || 'Voici l\'image générée :' }
                      : msg
                  )
                )
              }
            } catch (e) {
              // Ignore parsing errors for now
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove the streaming message and show error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
      setMessages(prev => [...prev, {
        content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        role: 'assistant',
        createdAt: new Date(),
      }])
    }
  }

  /* -----------------------------
     Start new conversation
  ------------------------------ */
  const startNewConversation = async () => {
    if (!user) return

    try {
      const headers = await getAuthHeaders()
      const title = `Conversation ${new Date().toLocaleString()}`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          action: 'createConversation',
          title,
        }),
      })

      const data = await res.json()

      if (data?.conversation) {
        setConversations(prev => [data.conversation, ...prev])
        setCurrentConversationId(data.conversation.id)
        setMessages([]) // ← only reset HERE (intentionally)
      }
    } catch (error) {
      console.error('Failed to create new conversation:', error)
    }
  }

  const switchConversation = (conversationId) => {
    if (conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId)
    }
  }

  return {
    messages,
    conversations,
    currentConversationId,
    loading,
    sendMessage,
    startNewConversation,
    switchConversation,
    deleteConversation,
  }
}
