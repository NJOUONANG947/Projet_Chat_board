import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

export const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}

export const apiRequest = async (endpoint, options = {}) => {
  const headers = await getAuthHeaders()

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(endpoint, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  // CV operations
  saveCV: (cvData) => apiRequest('/api/cv', {
    method: 'POST',
    body: JSON.stringify({ cvData })
  }),

  getCVs: () => apiRequest('/api/cv'),

  // AI operations
  generateContent: (agent, context, options = {}) => apiRequest('/api/ai', {
    method: 'POST',
    body: JSON.stringify({ agent, context, options })
  }),

  // Document operations
  uploadDocument: (formData) => apiRequest('/api/upload', {
    method: 'POST',
    body: formData,
    headers: {} // Let browser set content-type for FormData
  }),

  analyzeDocument: (documentId, analysisType) => apiRequest('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ documentId, analysisType })
  }),

  // Application operations
  saveApplication: (applicationData) => apiRequest('/api/applications', {
    method: 'POST',
    body: JSON.stringify({ applicationData })
  }),

  getApplications: () => apiRequest('/api/applications'),

  updateApplication: (applicationId, updates) => apiRequest(`/api/applications/${applicationId}`, {
    method: 'PUT',
    body: JSON.stringify({ updates })
  }),

  deleteApplication: (applicationId) => apiRequest(`/api/applications/${applicationId}`, {
    method: 'DELETE'
  }),

  // Analytics operations
  getAnalytics: (dateRange) => apiRequest('/api/analytics', {
    method: 'GET',
    body: dateRange ? JSON.stringify({ dateRange }) : undefined
  }),

  // Export operations
  exportCV: (cvId, format = 'pdf') => apiRequest('/api/export', {
    method: 'POST',
    body: JSON.stringify({ cvId, format })
  }),

  // Quiz operations
  generateQuiz: (documentIds) => apiRequest('/api/quiz', {
    method: 'POST',
    body: JSON.stringify({ documentIds })
  }),

  // Campaigns (candidatures automatiques)
  getCampaignProfile: () => apiRequest('/api/campaigns/profile'),
  saveCampaignProfile: (profile) => apiRequest('/api/campaigns/profile', {
    method: 'POST',
    body: JSON.stringify(profile)
  }),
  getCampaigns: () => apiRequest('/api/campaigns'),
  createCampaign: (body) => apiRequest('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  getCampaignApplications: (campaignId) => apiRequest(`/api/campaigns/${campaignId}/applications`),
  updateCampaign: (campaignId, body) => apiRequest(`/api/campaigns/${campaignId}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  }),
  deleteCampaign: (campaignId) => apiRequest(`/api/campaigns/${campaignId}`, {
    method: 'DELETE'
  }),
  /** Lance immédiatement le traitement des campagnes actives (sans attendre le cron). */
  runNowCampaigns: () => apiRequest('/api/campaigns/run-now', {
    method: 'POST'
  })
}
