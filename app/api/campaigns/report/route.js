/**
 * Compte rendu des envois automatiques : toutes les campagnes et leurs candidatures.
 */
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = session.user.id

    const { data: campaigns, error: campError } = await supabase
      .from('job_campaigns')
      .select('id, duration_days, ends_at, status, max_applications_per_day, total_sent, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (campError) {
      return NextResponse.json({ error: campError.message }, { status: 500 })
    }

    const campaignList = campaigns || []
    if (campaignList.length === 0) {
      const { data: appsNoCampaign } = await supabase
        .from('campaign_applications')
        .select('id, campaign_id, target_name, target_url, target_source, sent_at, status, error_message, metadata')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
      const applicationsWithCampaign = (appsNoCampaign || []).map((app) => {
        const name = app.target_name
        const targetNameStr = typeof name === 'string' ? name : (name && typeof name === 'object' ? [name.entreprise, name.projet].filter(Boolean).join(' – ') || '—' : '—')
        return { ...app, target_name: targetNameStr, campaign_ends_at: null, campaign_duration_days: null }
      })
      return NextResponse.json({ campaigns: [], applications: applicationsWithCampaign })
    }

    const campaignIds = campaignList.map((c) => c.id)
    const { data: applicationsInCampaigns, error: appError1 } = await supabase
      .from('campaign_applications')
      .select('id, campaign_id, user_id, target_name, target_url, target_source, sent_at, status, error_message, metadata')
      .in('campaign_id', campaignIds)
      .order('sent_at', { ascending: false })

    const { data: applicationsOrphan, error: appError2 } = await supabase
      .from('campaign_applications')
      .select('id, campaign_id, user_id, target_name, target_url, target_source, sent_at, status, error_message, metadata')
      .eq('user_id', userId)
      .is('campaign_id', null)
      .order('sent_at', { ascending: false })

    const appError = appError1 || appError2
    const seenIds = new Set()
    const applications = []
    for (const app of [...(applicationsInCampaigns || []), ...(applicationsOrphan || [])]) {
      if (app.id && !seenIds.has(app.id)) {
        seenIds.add(app.id)
        applications.push(app)
      }
    }
    applications.sort((a, b) => new Date(b.sent_at || 0) - new Date(a.sent_at || 0))

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 })
    }

    const campaignsById = Object.fromEntries(campaignList.map((c) => [c.id, c]))
    const applicationsWithCampaign = applications.map((app) => {
      const camp = campaignsById[app.campaign_id]
      const name = app.target_name
      const targetNameStr = typeof name === 'string' ? name : (name && typeof name === 'object' ? [name.entreprise, name.projet].filter(Boolean).join(' – ') || '—' : '—')
      return {
        ...app,
        target_name: targetNameStr,
        campaign_ends_at: camp?.ends_at,
        campaign_duration_days: camp?.duration_days
      }
    })

    return NextResponse.json({
      campaigns: campaignList,
      applications: applicationsWithCampaign
    })
  } catch (e) {
    console.error('Campaigns report error:', e)
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 })
  }
}
