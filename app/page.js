'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../frontend/contexts/AuthContext'
import ChatGPT from '../frontend/components/ChatGPT_dark'
import { useChat } from '../frontend/hooks/useChat'
import CVBuilder from '../frontend/components/CVBuilder'
import DocumentManager from '../frontend/components/DocumentManager_pdf'
import ApplicationTracker from '../frontend/components/ApplicationTracker'
import AnalyticsDashboard from '../frontend/components/AnalyticsDashboard'
import CVViewer from '../frontend/components/CVViewer'
import RecruiterDashboard from '../frontend/components/RecruiterDashboard'
import Settings from '../frontend/components/Settings'
import JobCampaigns from '../frontend/components/JobCampaigns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { api } from '../frontend/lib/api.js'

export default function Home() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [showCVBuilder, setShowCVBuilder] = useState(false)
  const [showDocumentManager, setShowDocumentManager] = useState(false)
  const [showApplicationTracker, setShowApplicationTracker] = useState(false)
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false)
  const [showCVViewer, setShowCVViewer] = useState(false)
  const [showRecruiterDashboard, setShowRecruiterDashboard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showJobCampaigns, setShowJobCampaigns] = useState(false)
  const [savedCVData, setSavedCVData] = useState(null)

  const {
    messages,
    conversations,
    currentConversationId,
    loading: chatLoading,
    sendMessage,
    startNewConversation,
    switchConversation,
    deleteConversation
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
          title: cvData.personal.jobTitle || 'Professionnel',
          contact: cvData.personal.email,
          location: cvData.personal.address
        },
        professional_summary: cvData.summary,
        experience: cvData.experience,
        education: cvData.education,
        skills: cvData.skills,
        keywords: [],
        interests: cvData.interests || '',
        template: cvData.template
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

  const handleOpenRecruiterDashboard = () => {
    setShowRecruiterDashboard(true)
  }

  const handleCloseRecruiterDashboard = () => {
    setShowRecruiterDashboard(false)
  }

  const handleOpenSettings = () => setShowSettings(true)
  const handleCloseSettings = () => setShowSettings(false)
  const handleOpenJobCampaigns = () => setShowJobCampaigns(true)
  const handleCloseJobCampaigns = () => setShowJobCampaigns(false)

  const handleCloseCVViewer = () => {
    setShowCVViewer(false)
    setSavedCVData(null)
  }

  // Rediriger les visiteurs non connectés vers la page d'accueil explicative
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/welcome')
      return
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
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

  if (showRecruiterDashboard) {
    return (
      <RecruiterDashboard
        onClose={handleCloseRecruiterDashboard}
      />
    )
  }

  if (showSettings) {
    return (
      <Settings
        onClose={handleCloseSettings}
      />
    )
  }

  if (showJobCampaigns) {
    return (
      <JobCampaigns
        onClose={handleCloseJobCampaigns}
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
      onDeleteConversation={deleteConversation}
      onOpenCVBuilder={handleOpenCVBuilder}
      onOpenDocumentManager={handleOpenDocumentManager}
      onOpenApplicationTracker={handleOpenApplicationTracker}
      onOpenRecruiterDashboard={handleOpenRecruiterDashboard}
      onOpenSettings={handleOpenSettings}
      onOpenJobCampaigns={handleOpenJobCampaigns}
      loading={chatLoading}
    />
  )
}
