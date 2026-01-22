// Custom hook for chat functionality
// Currently not implemented, but structure is ready for future use

import { useState, useEffect } from 'react'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch initial messages
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat')
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (message) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (data.response) {
        setMessages(prev => [
          ...prev,
          { content: message, role: 'user', createdAt: new Date() },
          { content: data.response, role: 'assistant', createdAt: new Date() },
        ])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return {
    messages,
    loading,
    sendMessage,
    fetchMessages
  }
}
