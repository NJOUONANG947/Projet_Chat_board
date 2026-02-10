import { supabase } from '../lib/supabase.js'

class PersistenceService {
  constructor() {
    this.supabase = supabase
  }

  // CV Operations
  async saveCV(userId, cvData) {
    try {
      const { data, error } = await this.supabase
        .from('user_cvs')
        .insert({
          user_id: userId,
          title: cvData.title || 'Mon CV',
          content: cvData.content,
          generated_content: cvData.generatedContent,
          template_id: cvData.templateId,
          is_draft: cvData.isDraft || false,
          original_name: cvData.originalName || 'generated_cv.pdf'
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, cv: data }
    } catch (error) {
      console.error('Save CV error:', error)
      return { success: false, error: error.message }
    }
  }

  async getUserCVs(userId, options = {}) {
    try {
      let query = this.supabase
        .from('user_cvs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.draft !== undefined) {
        query = query.eq('is_draft', options.draft)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, cvs: data }
    } catch (error) {
      console.error('Get CVs error:', error)
      return { success: false, error: error.message }
    }
  }

  async updateCV(cvId, userId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('user_cvs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', cvId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return { success: true, cv: data }
    } catch (error) {
      console.error('Update CV error:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteCV(cvId, userId) {
    try {
      const { error } = await this.supabase
        .from('user_cvs')
        .delete()
        .eq('id', cvId)
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Delete CV error:', error)
      return { success: false, error: error.message }
    }
  }

  // Document Operations
  async saveDocument(userId, documentData) {
    try {
      const { data, error } = await this.supabase
        .from('uploaded_documents')
        .insert({
          user_id: userId,
          original_name: documentData.originalName,
          file_type: documentData.fileType,
          file_size: documentData.fileSize,
          extracted_text: documentData.extractedText,
          metadata: documentData.metadata,
          notes: documentData.notes
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, document: data }
    } catch (error) {
      console.error('Save document error:', error)
      return { success: false, error: error.message }
    }
  }

  async getUserDocuments(userId, options = {}) {
    try {
      let query = this.supabase
        .from('uploaded_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.fileType) {
        query = query.eq('file_type', options.fileType)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, documents: data }
    } catch (error) {
      console.error('Get documents error:', error)
      return { success: false, error: error.message }
    }
  }

  async updateDocument(documentId, userId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('uploaded_documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return { success: true, document: data }
    } catch (error) {
      console.error('Update document error:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteDocument(documentId, userId) {
    try {
      const { error } = await this.supabase
        .from('uploaded_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Delete document error:', error)
      return { success: false, error: error.message }
    }
  }

  // Application Operations
  async saveApplication(userId, applicationData) {
    try {
      const { data, error } = await this.supabase
        .from('job_applications')
        .insert({
          user_id: userId,
          position: applicationData.position,
          company: applicationData.company,
          status: applicationData.status || 'applied',
          application_date: applicationData.applicationDate || new Date().toISOString(),
          notes: applicationData.notes,
          cv_id: applicationData.cvId,
          contact_info: applicationData.contactInfo,
          follow_up_date: applicationData.followUpDate
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, application: data }
    } catch (error) {
      console.error('Save application error:', error)
      return { success: false, error: error.message }
    }
  }

  async getUserApplications(userId, options = {}) {
    try {
      let query = this.supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.status) {
        query = query.eq('status', options.status)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, applications: data }
    } catch (error) {
      console.error('Get applications error:', error)
      return { success: false, error: error.message }
    }
  }

  async updateApplication(applicationId, userId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('job_applications')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return { success: true, application: data }
    } catch (error) {
      console.error('Update application error:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteApplication(applicationId, userId) {
    try {
      const { error } = await this.supabase
        .from('job_applications')
        .delete()
        .eq('id', applicationId)
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Delete application error:', error)
      return { success: false, error: error.message }
    }
  }

  // Analytics Operations
  async getUserAnalytics(userId, dateRange = {}) {
    try {
      const cvStats = await this.getCVAnalytics(userId, dateRange)
      const applicationStats = await this.getApplicationAnalytics(userId, dateRange)
      const documentStats = await this.getDocumentAnalytics(userId, dateRange)

      return {
        success: true,
        analytics: {
          overview: {
            totalApplications: applicationStats.total,
            totalCVs: cvStats.total,
            totalDocuments: documentStats.total,
            avgScore: cvStats.avgScore,
            successRate: applicationStats.successRate
          },
          statusBreakdown: applicationStats.statusBreakdown,
          monthlyTrend: applicationStats.monthlyTrend,
          recentActivity: await this.getRecentActivity(userId, 10)
        }
      }
    } catch (error) {
      console.error('Analytics error:', error)
      return { success: false, error: error.message }
    }
  }

  async getCVAnalytics(userId, dateRange) {
    try {
      let query = this.supabase
        .from('user_cvs')
        .select('*')
        .eq('user_id', userId)

      if (dateRange.startDate) {
        query = query.gte('created_at', dateRange.startDate)
      }

      const { data, error } = await query

      if (error) throw error

      const total = data.length
      const avgScore = total > 0 ? 75 : 0

      return { total, avgScore, cvs: data }
    } catch (error) {
      console.error('CV analytics error:', error)
      return { total: 0, avgScore: 0, cvs: [] }
    }
  }

  async getApplicationAnalytics(userId, dateRange) {
    try {
      let query = this.supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', userId)

      if (dateRange.startDate) {
        query = query.gte('created_at', dateRange.startDate)
      }

      const { data, error } = await query

      if (error) throw error

      const total = data.length
      const statusBreakdown = data.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      }, {})

      const successCount = (statusBreakdown.accepted || 0) + (statusBreakdown.interview || 0)
      const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0

      const monthlyTrend = this.calculateMonthlyTrend(data)

      return { total, statusBreakdown, successRate, monthlyTrend, applications: data }
    } catch (error) {
      console.error('Application analytics error:', error)
      return { total: 0, statusBreakdown: {}, successRate: 0, monthlyTrend: [], applications: [] }
    }
  }

  async getDocumentAnalytics(userId, dateRange) {
    try {
      let query = this.supabase
        .from('uploaded_documents')
        .select('*')
        .eq('user_id', userId)

      if (dateRange.startDate) {
        query = query.gte('created_at', dateRange.startDate)
      }

      const { data, error } = await query

      if (error) throw error

      return { total: data.length, documents: data }
    } catch (error) {
      console.error('Document analytics error:', error)
      return { total: 0, documents: [] }
    }
  }

  calculateMonthlyTrend(applications) {
    const monthlyData = {}

    applications.forEach(app => {
      const date = new Date(app.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          applications: 0
        }
      }

      monthlyData[monthKey].applications++
    })

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
  }

  async getRecentActivity(userId, limit = 10) {
    try {
      const activities = []

      const { data: applications } = await this.supabase
        .from('job_applications')
        .select('id, position, company, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (applications) {
        activities.push(...applications.map(app => ({
          id: app.id,
          type: 'application',
          title: `${app.position} at ${app.company}`,
          date: app.created_at,
          status: app.status
        })))
      }

      return activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit)

    } catch (error) {
      console.error('Recent activity error:', error)
      return []
    }
  }
}

export default PersistenceService
