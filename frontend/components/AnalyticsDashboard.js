'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function AnalyticsDashboard({ onClose }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="analytics-dashboard max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement des analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="analytics-dashboard max-w-6xl mx-auto p-6">
        <div className="text-center py-12 text-gray-500">
          <p>Erreur lors du chargement des données</p>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-dashboard max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Carrière</h1>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Retour au Chat
          </button>
        </div>
        <p className="text-gray-600 mt-2">Analysez vos performances et suivez votre évolution professionnelle</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Candidatures</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalApplications}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CVs Créés</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalCVs}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Score Moyen CV</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.avgScore}/100</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taux de Réussite</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.successRate}%</p>
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
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Répartition des Candidatures</h2>
          <div className="space-y-3">
            {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'applied' ? 'bg-blue-500' :
                    status === 'interview' ? 'bg-yellow-500' :
                    status === 'accepted' ? 'bg-green-500' :
                    status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status === 'applied' ? 'Candidatures' :
                     status === 'interview' ? 'Entretiens' :
                     status === 'accepted' ? 'Acceptés' :
                     status === 'rejected' ? 'Refusés' : status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{count}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === 'applied' ? 'bg-blue-500' :
                        status === 'interview' ? 'bg-yellow-500' :
                        status === 'accepted' ? 'bg-green-500' :
                        status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
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
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Évolution Mensuelle</h2>
          <div className="space-y-3">
            {analytics.monthlyTrend.map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{month.month}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{month.applications}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
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
          className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Activité Récente</h2>
          {analytics.recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
          ) : (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{activity.position}</p>
                    <p className="text-sm text-gray-600">{activity.company}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                      activity.status === 'interview' ? 'bg-yellow-100 text-yellow-800' :
                      activity.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status === 'applied' ? 'Candidature' :
                       activity.status === 'interview' ? 'Entretien' :
                       activity.status === 'accepted' ? 'Accepté' :
                       activity.status === 'rejected' ? 'Refusé' : activity.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
