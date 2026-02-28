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
import CVCreationMenu from '../frontend/components/CVCreationMenu'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
  const [showCVMenu, setShowCVMenu] = useState(false)

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

  const handleNavAction = (id) => {
    switch (id) {
      case 'cv':
        setShowCVMenu(true)
        break
      case 'candidatures':
        setShowApplicationTracker(true)
        break
      case 'campagnes':
        setShowJobCampaigns(true)
        break
      case 'recruteur':
        setShowRecruiterDashboard(true)
        break
      case 'parametres':
        setShowSettings(true)
        break
      default:
        break
    }
  }

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
      <div className="flex-1 min-h-0 flex items-center justify-center bg-[#0a0a0a] w-full">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
      <div className="flex-1 min-h-0 flex flex-col w-full min-w-0 overflow-hidden">
        <CVBuilder
          onSave={handleSaveCV}
          onCancel={handleCancelCV}
        />
      </div>
    )
  }

  if (showDocumentManager) {
    return (
      <div className="flex-1 min-h-0 flex flex-col w-full min-w-0 overflow-hidden">
        <DocumentManager
          onClose={handleCloseDocumentManager}
        />
      </div>
    )
  }

  if (showApplicationTracker) {
    return (
      <div className="flex-1 min-h-0 flex flex-col w-full min-w-0 overflow-hidden">
        <ApplicationTracker
          onClose={handleCloseApplicationTracker}
        />
      </div>
    )
  }

  if (showAnalyticsDashboard) {
    return (
      <div className="flex-1 min-h-0 flex flex-col w-full min-w-0 overflow-hidden">
        <AnalyticsDashboard
          onClose={handleCloseAnalyticsDashboard}
        />
      </div>
    )
  }

  if (showRecruiterDashboard) {
    return (
      <div className="flex-1 min-h-0 flex flex-col w-full min-w-0 overflow-hidden">
        <RecruiterDashboard
          onClose={handleCloseRecruiterDashboard}
        />
      </div>
    )
  }

  if (showSettings) {
    return (
      <div className="flex-1 min-h-0 flex flex-col w-full min-w-0 overflow-hidden">
        <Settings
          onClose={handleCloseSettings}
        />
      </div>
    )
  }

  if (showJobCampaigns) {
    return (
      <div className="flex-1 min-h-0 flex flex-col w-full min-w-0 overflow-hidden">
        <JobCampaigns
          onClose={handleCloseJobCampaigns}
        />
      </div>
    )
  }

  if (showCVViewer && savedCVData) {
    return (
      <div className="flex-1 min-h-0 flex flex-col w-full min-w-0 overflow-hidden">
        <CVViewer
          cvData={savedCVData}
          onClose={handleCloseCVViewer}
        />
      </div>
    )
  }

  if (showCVMenu) {
    return (
      <div className="flex-1 min-h-0 flex flex-col w-full min-w-0 overflow-hidden">
        <CVCreationMenu
          onClose={() => setShowCVMenu(false)}
          onOpenCVBuilder={() => { setShowCVMenu(false); setShowCVBuilder(true) }}
          onOpenDocumentManager={() => { setShowCVMenu(false); setShowDocumentManager(true) }}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full min-w-0 overflow-hidden">
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
    </div>
  )
}
