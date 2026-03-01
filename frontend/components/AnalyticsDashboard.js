'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext'

export default function AnalyticsDashboard({ onClose }) {
  const { t, lang } = useLanguage()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const [error, setError] = useState(null)

  const fetchAnalytics = async () => {
    setError(null)
    try {
      const response = await fetch('/api/analytics')
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || t.analytics.loadError)
        setAnalytics(null)
        return
      }
      setAnalytics(data.analytics)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(t.analytics.cannotLoad)
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-root min-h-screen bg-zinc-950 flex items-center justify-center w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-800 border-t-transparent mx-auto" />
          <p className="text-zinc-400 mt-4">{t.analytics.loading}</p>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="page-root min-h-screen bg-zinc-950 flex items-center justify-center w-full">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-zinc-300 mb-4">{error || t.analytics.loadErrorData}</p>
          <p className="text-zinc-400 text-sm mb-6">{t.analytics.checkConnection}</p>
          <button
            onClick={() => { setLoading(true); fetchAnalytics(); }}
            className="px-4 py-2 bg-blue-900/80 text-white font-medium rounded-xl hover:bg-blue-800/90 border border-blue-800/50"
          >
            {t.analytics.retry}
          </button>
          <button
            onClick={onClose}
            className="block w-full mt-3 px-4 py-2 text-zinc-400 hover:text-white"
          >
            {t.app.backToChat}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-root min-h-screen bg-zinc-950 w-full">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{t.analytics.dashboardTitle}</h1>
            <p className="text-zinc-400 mt-1">{t.analytics.dashboardSub}</p>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-700/80 text-zinc-200 hover:bg-zinc-600 font-medium"
          >
            {t.app.backToChat}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-800/60 border border-zinc-600/40 rounded-2xl p-6 hover:border-blue-800/50 transition-colors"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-900/30 border border-blue-800/40 rounded-xl">
              <span className="text-2xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-400">{t.analytics.totalApplications}</p>
              <p className="text-2xl font-bold text-white">{analytics.overview.totalApplications}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-800/60 border border-zinc-600/40 rounded-2xl p-6 hover:border-blue-800/50 transition-colors"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-900/30 border border-blue-800/40 rounded-xl">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-400">{t.analytics.totalCVs}</p>
              <p className="text-2xl font-bold text-white">{analytics.overview.totalCVs}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-800/60 border border-zinc-600/40 rounded-2xl p-6 hover:border-blue-800/50 transition-colors"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-900/30 border border-blue-800/40 rounded-xl">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-400">{t.analytics.avgScore}</p>
              <p className="text-2xl font-bold text-white">{analytics.overview.avgScore}/100</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-800/60 border border-zinc-600/40 rounded-2xl p-6 hover:border-blue-800/50 transition-colors"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-900/30 border border-blue-800/40 rounded-xl">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-400">{t.analytics.successRate}</p>
              <p className="text-2xl font-bold text-white">{analytics.overview.successRate}%</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-zinc-800/60 border border-zinc-600/40 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">{t.analytics.distributionTitle}</h2>
          <div className="space-y-3">
            {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'applied' ? 'bg-blue-800' :
                    status === 'interview' ? 'bg-zinc-500' :
                    status === 'accepted' ? 'bg-blue-500' :
                    status === 'rejected' ? 'bg-zinc-600' : 'bg-zinc-500'
                  }`}></div>
                  <span className="text-sm font-medium text-zinc-200 capitalize">
                    {status === 'applied' ? t.analytics.applicationsLabel :
                     status === 'interview' ? t.analytics.interviewsLabel :
                     status === 'accepted' ? t.analytics.acceptedLabel :
                     status === 'rejected' ? t.analytics.rejectedLabel : status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-zinc-300">{count}</span>
                  <div className="w-20 bg-zinc-700/50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === 'applied' ? 'bg-blue-800' :
                        status === 'interview' ? 'bg-zinc-500' :
                        status === 'accepted' ? 'bg-blue-500' :
                        status === 'rejected' ? 'bg-zinc-600' : 'bg-zinc-500'
                      }`}
                      style={{ width: `${analytics.overview.totalApplications > 0 ? (count / analytics.overview.totalApplications) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Monthly Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">{t.analytics.monthlyTitle}</h2>
          <div className="space-y-3">
            {analytics.monthlyTrend.map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">{month.month}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-zinc-300">{month.applications}</span>
                  <div className="w-20 bg-zinc-700/50 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-800 rounded-full"
                      style={{ width: `${Math.max((month.applications / 10) * 100, 5)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-zinc-800/60 border border-zinc-600/40 rounded-2xl p-6 lg:col-span-2"
        >
          <h2 className="text-xl font-semibold text-white mb-4">{t.analytics.recentActivity}</h2>
          {analytics.recentActivity.length === 0 ? (
            <p className="text-zinc-400 text-center py-4">{t.analytics.noRecentActivity}</p>
          ) : (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-zinc-800/40 border border-zinc-600/40 rounded-xl">
                  <div>
                    <p className="font-medium text-white">{activity.position}</p>
                    <p className="text-sm text-zinc-300">{activity.company}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'applied' ? 'bg-blue-900/30 text-blue-200 border border-blue-800/40' :
                      activity.status === 'interview' ? 'bg-zinc-600/50 text-zinc-200 border border-zinc-500/40' :
                      activity.status === 'accepted' ? 'bg-blue-900/30 text-blue-200 border border-blue-800/40' :
                      activity.status === 'rejected' ? 'bg-zinc-700/50 text-zinc-300 border border-zinc-600/40' :
                      'bg-zinc-700/50 text-zinc-200 border border-zinc-600/40'
                    }`}>
                      {activity.status === 'applied' ? t.analytics.statusApplied :
                       activity.status === 'interview' ? t.analytics.statusInterview :
                       activity.status === 'accepted' ? t.analytics.statusAccepted :
                       activity.status === 'rejected' ? t.analytics.statusRejected : activity.status}
                    </span>
                    <p className="text-xs text-zinc-400 mt-1">
                      {new Date(activity.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      </div>
    </div>
  )
}
