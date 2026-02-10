import { supabase } from '../lib/supabase.js'

class UserService {
  async getCurrentUser(request) {
    try {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return { success: false, error: 'No authorization header' }
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return { success: false, error: 'Invalid token' }
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at
        }
      }
    } catch (error) {
      console.error('User service error:', error)
      return { success: false, error: error.message }
    }
  }

  async validateUserAccess(userId, resourceType, resourceId) {
    try {
      // Check if user has access to specific resource
      let query

      switch (resourceType) {
        case 'cv':
          query = supabase
            .from('user_cvs')
            .select('id')
            .eq('id', resourceId)
            .eq('user_id', userId)
          break

        case 'document':
          query = supabase
            .from('uploaded_documents')
            .select('id')
            .eq('id', resourceId)
            .eq('user_id', userId)
          break

        case 'application':
          query = supabase
            .from('job_applications')
            .select('id')
            .eq('id', resourceId)
            .eq('user_id', userId)
          break

        case 'conversation':
          query = supabase
            .from('conversations')
            .select('id')
            .eq('id', resourceId)
            .eq('user_id', userId)
          break

        default:
          return { success: false, error: 'Invalid resource type' }
      }

      const { data, error } = await query.single()

      if (error || !data) {
        return { success: false, error: 'Access denied' }
      }

      return { success: true }
    } catch (error) {
      console.error('Access validation error:', error)
      return { success: false, error: error.message }
    }
  }

  async getUserProfile(userId) {
    try {
      // Get comprehensive user profile data
      const [cvStats, documentStats, applicationStats, conversationStats] = await Promise.all([
        this.getUserCVStats(userId),
        this.getUserDocumentStats(userId),
        this.getUserApplicationStats(userId),
        this.getUserConversationStats(userId)
      ])

      return {
        success: true,
        profile: {
          userId,
          stats: {
            totalCVs: cvStats.total,
            totalDocuments: documentStats.total,
            totalApplications: applicationStats.total,
            totalConversations: conversationStats.total,
            recentActivity: await this.getRecentActivity(userId)
          },
          preferences: await this.getUserPreferences(userId)
        }
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
      return { success: false, error: error.message }
    }
  }

  async getUserCVStats(userId) {
    try {
      const { data, error } = await supabase
        .from('user_cvs')
        .select('id, created_at, is_draft')
        .eq('user_id', userId)

      if (error) throw error

      return {
        total: data.length,
        drafts: data.filter(cv => cv.is_draft).length,
        published: data.filter(cv => !cv.is_draft).length,
        recent: data.filter(cv => {
          const createdAt = new Date(cv.created_at)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return createdAt > weekAgo
        }).length
      }
    } catch (error) {
      console.error('CV stats error:', error)
      return { total: 0, drafts: 0, published: 0, recent: 0 }
    }
  }

  async getUserDocumentStats(userId) {
    try {
      const { data, error } = await supabase
        .from('uploaded_documents')
        .select('id, file_type, created_at')
        .eq('user_id', userId)

      if (error) throw error

      const typeCounts = data.reduce((acc, doc) => {
        acc[doc.file_type] = (acc[doc.file_type] || 0) + 1
        return acc
      }, {})

      return {
        total: data.length,
        byType: typeCounts,
        recent: data.filter(doc => {
          const createdAt = new Date(doc.created_at)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return createdAt > weekAgo
        }).length
      }
    } catch (error) {
      console.error('Document stats error:', error)
      return { total: 0, byType: {}, recent: 0 }
    }
  }

  async getUserApplicationStats(userId) {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('id, status, created_at')
        .eq('user_id', userId)

      if (error) throw error

      const statusCounts = data.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      }, {})

      return {
        total: data.length,
        byStatus: statusCounts,
        recent: data.filter(app => {
          const createdAt = new Date(app.created_at)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return createdAt > weekAgo
        }).length
      }
    } catch (error) {
      console.error('Application stats error:', error)
      return { total: 0, byStatus: {}, recent: 0 }
    }
  }

  async getUserConversationStats(userId) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, created_at')
        .eq('user_id', userId)

      if (error) throw error

      return {
        total: data.length,
        recent: data.filter(conv => {
          const createdAt = new Date(conv.created_at)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return createdAt > weekAgo
        }).length
      }
    } catch (error) {
      console.error('Conversation stats error:', error)
      return { total: 0, recent: 0 }
    }
  }

  async getRecentActivity(userId) {
    try {
      // Get recent activity across all resources
      const activities = []

      // Recent CVs
      const { data: cvs } = await supabase
        .from('user_cvs')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (cvs) {
        activities.push(...cvs.map(cv => ({
          type: 'cv',
          id: cv.id,
          title: cv.title,
          date: cv.created_at,
          action: 'created'
        })))
      }

      // Recent applications
      const { data: apps } = await supabase
        .from('job_applications')
        .select('id, position, company, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (apps) {
        activities.push(...apps.map(app => ({
          type: 'application',
          id: app.id,
          title: `${app.position} at ${app.company}`,
          date: app.created_at,
          action: 'applied',
          status: app.status
        })))
      }

      // Sort by date and return top 10
      return activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)

    } catch (error) {
      console.error('Recent activity error:', error)
      return []
    }
  }

  async getUserPreferences(userId) {
    try {
      // Get user preferences (could be stored in a separate table)
      // For now, return default preferences
      return {
        theme: 'light',
        language: 'fr',
        notifications: true,
        autoSave: true
      }
    } catch (error) {
      console.error('Preferences error:', error)
      return {}
    }
  }

  async updateUserPreferences(userId, preferences) {
    try {
      // Update user preferences
      // This would typically update a user_preferences table
      return { success: true, preferences }
    } catch (error) {
      console.error('Update preferences error:', error)
      return { success: false, error: error.message }
    }
  }
}

export default UserService
