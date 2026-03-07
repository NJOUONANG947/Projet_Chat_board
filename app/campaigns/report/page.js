'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../frontend/contexts/AuthContext'
import { api } from '../../../frontend/lib/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

const SOURCE_LABELS = {
  adzuna: 'Adzuna',
  lba: 'La Bonne Alternance',
  lba_v1: 'LBA V1',
  lba_v3: 'LBA V3',
  france_travail: 'France Travail',
  google: 'Google',
  other: 'Autre',
  internal: 'Interne',
  manual: 'Manuel'
}

function formatTargetName(targetName) {
  if (typeof targetName === 'string') return targetName
  if (targetName && typeof targetName === 'object') {
    return [targetName.entreprise, targetName.projet].filter(Boolean).join(' – ') || '—'
  }
  return '—'
}

function parseCompanyAndTitle(targetName) {
  const str = formatTargetName(targetName)
  const idx = str.indexOf(' - ')
  if (idx > 0) {
    return { company: str.slice(0, idx).trim(), title: str.slice(idx + 3).trim() }
  }
  return { company: str, title: '' }
}

export default function CampaignReportPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState({ campaigns: [], applications: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterCampaignId, setFilterCampaignId] = useState('')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    api.getCampaignsReport()
      .then((res) => {
        if (!cancelled) {
          setData({ campaigns: res.campaigns || [], applications: res.applications || [] })
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/welcome')
      return
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const applications = filterCampaignId
    ? data.applications.filter((a) => a.campaign_id === filterCampaignId)
    : data.applications

  const byPlatform = Object.entries(
    applications.reduce((acc, a) => {
      const s = a.target_source || 'other'
      acc[s] = (acc[s] || 0) + 1
      return acc
    }, {})
  ).map(([name, count]) => ({ name: SOURCE_LABELS[name] || name, count, fill: name === 'adzuna' ? '#3b82f6' : name === 'lba' ? '#10b981' : '#6366f1' }))

  const byDay = Object.entries(
    applications.reduce((acc, a) => {
      const day = a.sent_at ? new Date(a.sent_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {})
  )
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-')))

  const successFail = [
    { name: 'Envoyées', value: applications.filter((a) => a.status === 'sent').length, fill: '#10b981' },
    { name: 'Échecs', value: applications.filter((a) => a.status === 'failed').length, fill: '#ef4444' }
  ].filter((d) => d.value > 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="border-b border-white/10 bg-black/40 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-zinc-400 hover:text-white text-sm">← Retour</Link>
          <h1 className="text-lg font-semibold text-white">Compte rendu des candidatures automatiques</h1>
          <div />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {data.applications.length === 0 ? (
              <div className="rounded-xl bg-white/[0.06] border border-white/10 p-8 text-center text-zinc-400">
                <p>Aucune candidature enregistrée pour le moment.</p>
                <p className="mt-2 text-sm">Lance un envoi depuis « Mes campagnes » pour voir le compte rendu ici.</p>
                <Link href="/" className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm">Retour à l’accueil</Link>
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <label className="text-sm text-zinc-400">Campagne :</label>
                  <select
                    value={filterCampaignId}
                    onChange={(e) => setFilterCampaignId(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Toutes</option>
                    {data.campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.duration_days} j · jusqu'au {new Date(c.ends_at).toLocaleDateString('fr-FR')} · {c.total_sent ?? 0} envois
                      </option>
                    ))}
                  </select>
                </div>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">Par plateforme</h3>
                    {byPlatform.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={byPlatform} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, count }) => `${name}: ${count}`}>
                            {byPlatform.map((entry, i) => <Cell key={i} fill={entry.fill || '#6366f1'} />)}
                          </Pie>
                          <Tooltip formatter={(v) => [v, 'Candidatures']} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-zinc-500 text-sm">Aucune donnée</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">Envoyées vs échecs</h3>
                    {successFail.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={successFail} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                            {successFail.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip formatter={(v) => [v, 'Candidatures']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-zinc-500 text-sm">Aucune donnée</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">Envois par jour</h3>
                    {byDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={byDay} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" name="Candidatures" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-zinc-500 text-sm">Aucune donnée</p>
                    )}
                  </div>
                </section>

                <section className="rounded-xl bg-white/[0.06] border border-white/10 overflow-hidden">
                  <h2 className="text-base font-semibold text-white px-4 py-3 border-b border-white/10">Tableau des envois</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-zinc-400 border-b border-white/10">
                          <th className="px-4 py-3 font-medium">Date et heure</th>
                          <th className="px-4 py-3 font-medium">Offre</th>
                          <th className="px-4 py-3 font-medium">Entreprise</th>
                          <th className="px-4 py-3 font-medium">Plateforme</th>
                          <th className="px-4 py-3 font-medium">Statut</th>
                          <th className="px-4 py-3 font-medium">Confirmée</th>
                          <th className="px-4 py-3 font-medium">Lien</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((app) => {
                          const { company, title } = parseCompanyAndTitle(app.target_name)
                          return (
                            <tr key={app.id} className="border-b border-white/5 hover:bg-white/[0.04]">
                              <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                                {app.sent_at ? new Date(app.sent_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                              </td>
                              <td className="px-4 py-3 text-white max-w-[200px] truncate" title={formatTargetName(app.target_name)}>{title || formatTargetName(app.target_name)}</td>
                              <td className="px-4 py-3 text-zinc-300 max-w-[140px] truncate" title={company}>{company}</td>
                              <td className="px-4 py-3 text-zinc-300">{SOURCE_LABELS[app.target_source] || app.target_source || '—'}</td>
                              <td className="px-4 py-3">
                                <span className={app.status === 'sent' ? 'text-emerald-400' : 'text-amber-400'}>
                                  {app.status === 'sent' ? 'Envoyé' : 'Échec'}
                                </span>
                              </td>
                              <td className="px-4 py-3">{app.metadata?.verified ? 'Oui' : '—'}</td>
                              <td className="px-4 py-3">
                                {app.target_url ? (
                                  <a href={app.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block max-w-[120px]">Ouvrir</a>
                                ) : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
