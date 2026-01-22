'use client'

import Chat from '../frontend/components/Chat'
import { useChat } from '../frontend/hooks/useChat'

export default function Home() {
  const { messages, loading, sendMessage } = useChat()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-100 to-blue-50">
        <div className="text-gray-800 text-xl font-medium">Chargement...</div>
      </div>
    )
  }

  return <Chat messages={messages} onSendMessage={sendMessage} />
}
