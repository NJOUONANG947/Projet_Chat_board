'use client'

import { useState } from 'react'
import { useAuth } from '../frontend/contexts/AuthContext'
import ChatGPT from '../frontend/components/ChatGPT'
import { useChat } from '../frontend/hooks/useChat'
import CVBuilder from '../frontend/components/CVBuilder'
import DocumentManager from '../frontend/components/DocumentManager'
import ApplicationTracker from '../frontend/components/ApplicationTracker'
import AnalyticsDashboard from '../frontend/components/AnalyticsDashboard'
import { api } from '../frontend/lib/api.js'

export default function Home() {
  const { user } = useAuth()
  const [showCVBuilder, setShowCVBuilder] = useState(false)
  const [showDocumentManager, setShowDocumentManager] = useState(false)
  const [showApplicationTracker, setShowApplicationTracker] = useState(false)
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false)

  const {
    messages,
    conversations,
    currentConversationId,
    loading: chatLoading,
    sendMessage,
    startNewConversation,
    switchConversation
  } = useChat()

  const handleOpenCVBuilder = () => {
    setShowCVBuilder(true)
  }

  const handleSaveCV = async (cvData) => {
    try {
      const { id, message } = await api.saveCV(cvData)
      alert(message || 'CV sauvegardé avec succès!')
      setShowCVBuilder(false)
    } catch (error) {
      console.error('Save CV error:', error)
      alert('Erreur lors de la sauvegarde du CV: ' + error.message)
    }
  }

  const handleCancelCV = () => {
    setShowCVBuilder(false)
  }

  const handleOpenDocumentManager = () => {
    setShowDocumentManager(true)
  }

  const handleCloseDocumentManager = () => {
    setShowDocumentManager(false)
  }

  const handleOpenApplicationTracker = () => {
    setShowApplicationTracker(true)
  }

  const handleCloseApplicationTracker = () => {
    setShowApplicationTracker(false)
  }

  const handleOpenAnalyticsDashboard = () => {
    setShowAnalyticsDashboard(true)
  }

  const handleCloseAnalyticsDashboard = () => {
    setShowAnalyticsDashboard(false)
  }

  if (showCVBuilder) {
    return (
      <CVBuilder
        onSave={handleSaveCV}
        onCancel={handleCancelCV}
      />
    )
  }

  if (showDocumentManager) {
    return (
      <DocumentManager
        onClose={handleCloseDocumentManager}
      />
    )
  }

  if (showApplicationTracker) {
    return (
      <ApplicationTracker
        onClose={handleCloseApplicationTracker}
      />
    )
  }

  if (showAnalyticsDashboard) {
    return (
      <AnalyticsDashboard
        onClose={handleCloseAnalyticsDashboard}
      />
    )
  }

  return (
    <ChatGPT
      messages={messages}
      conversations={conversations}
      currentConversationId={currentConversationId}
      onSendMessage={sendMessage}
      onStartNewConversation={startNewConversation}
      onSwitchConversation={switchConversation}
      onOpenCVBuilder={handleOpenCVBuilder}
      onOpenDocumentManager={handleOpenDocumentManager}
      loading={chatLoading}
    />
  )
}
