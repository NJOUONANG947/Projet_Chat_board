/**
 * Lance immédiatement le traitement des campagnes actives de l'utilisateur connecté.
 * Permet de tester l'envoi des candidatures sans attendre le cron du lendemain.
 */
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { runCampaignDay } from '../../../../backend/services/CampaignService.js'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST() {
  try {
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = session.user.id
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: campaigns, error: listError } = await supabase
      .from('job_campaigns')
      .select('id, user_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString())

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const list = campaigns || []
    if (list.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'Aucune campagne active. Lance une campagne ci-dessus puis réessaie.',
        processed: 0,
        results: []
      })
    }

    const results = []
    for (const c of list) {
      try {
        const out = await runCampaignDay(supabase, c.id, c.user_id)
        results.push({ campaignId: c.id, ...out })
      } catch (e) {
        results.push({ campaignId: c.id, sent: 0, total: 0, reason: e?.message || String(e) })
      }
    }

    const totalSent = results.reduce((acc, r) => acc + (r.sent || 0), 0)
    const automationResults = (results || []).flatMap((r) => r.automationResults || [])
    const autoSuccessCount = automationResults.filter((r) => r.success).length
    const firstReason = results.find((r) => r.reason)?.reason
    const firstResult = results[0]
    const hasCounts = firstResult && (typeof firstResult.offersFetched === 'number' || typeof firstResult.offersMatched === 'number')
    const offersToConsult = (results || []).flatMap((r) => r.offersToConsult || [])
    let message = firstReason
      || (hasCounts
        ? `${firstResult.offersFetched ?? 0} offres trouvées, ${firstResult.offersMatched ?? 0} correspondent à ton profil.`
        : 'Traitement terminé.')
    if (autoSuccessCount > 0 && !(firstReason || '').includes('envoyée(s) automatiquement')) {
      message = `${autoSuccessCount} candidature(s) envoyée(s) automatiquement. ${message}`
    }
    if (offersToConsult.length > 0 && autoSuccessCount === 0 && !message.includes('liens')) {
      message = `${offersToConsult.length} offre(s) correspondent à ton profil. Postule via les liens ci-dessous.`
    }
    return NextResponse.json({
      ok: true,
      message,
      processed: list.length,
      results,
      offersToConsult,
      automationResults: automationResults.length ? automationResults : undefined
    })
  } catch (e) {
    console.error('Run now campaigns error:', e)
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 })
  }
}
