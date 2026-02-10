// Custom hook for chat functionality
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [loading, setLoading] = useState(true)

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
     Send message with streaming
  ------------------------------ */
  const sendMessage = async (message) => {
    if (!message || !currentConversationId || !user) return

    const userMessage = {
      content: message,
      role: 'user',
      createdAt: new Date(),
    }

    // Show user message immediately
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
          message,
          conversationId: currentConversationId,
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
  }
}
