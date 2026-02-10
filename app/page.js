'use client'

import { useState } from 'react'
import { useAuth } from '../frontend/contexts/AuthContext'
import ChatGPT from '../frontend/components/ChatGPT_dark'
import { useChat } from '../frontend/hooks/useChat'
import CVBuilder from '../frontend/components/CVBuilder'
import DocumentManager from '../frontend/components/DocumentManager_pdf'
import ApplicationTracker from '../frontend/components/ApplicationTracker'
import AnalyticsDashboard from '../frontend/components/AnalyticsDashboard'
import CVViewer from '../frontend/components/CVViewer'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { api } from '../frontend/lib/api.js'

export default function Home() {
  const { user } = useAuth()
  const [showCVBuilder, setShowCVBuilder] = useState(false)
  const [showDocumentManager, setShowDocumentManager] = useState(false)
  const [showApplicationTracker, setShowApplicationTracker] = useState(false)
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false)
  const [showCVViewer, setShowCVViewer] = useState(false)
  const [savedCVData, setSavedCVData] = useState(null)

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
      const supabase = createClientComponentClient()
      const cvTitle = `${cvData.personal.firstName} ${cvData.personal.lastName}`.trim() || 'Mon CV'

      const { data, error } = await supabase
        .from('user_cvs')
        .insert({
          user_id: user.id,
          title: cvTitle,
          content: cvData
        });

      if (error) {
        console.error('Erreur sauvegarde CV:', error);
        throw new Error(error.message);
      }

      // Transform data for CVViewer
      const transformedData = {
        personal_info: {
          name: `${cvData.personal.firstName} ${cvData.personal.lastName}`.trim(),
          title: 'Professionnel', // Could be enhanced
          contact: cvData.personal.email,
          location: cvData.personal.address
        },
        professional_summary: cvData.summary,
        experience: cvData.experience,
        education: cvData.education,
        skills: cvData.skills,
        keywords: [] // Could be enhanced with AI-generated keywords
      }

      setSavedCVData(transformedData)
      setShowCVViewer(true)
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

  const handleCloseCVViewer = () => {
    setShowCVViewer(false)
    setSavedCVData(null)
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

  if (showCVViewer && savedCVData) {
    return (
      <CVViewer
        cvData={savedCVData}
        onClose={handleCloseCVViewer}
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
