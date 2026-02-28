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
export const maxDuration = 60

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
    const firstReason = results.find((r) => r.reason)?.reason
    const message = totalSent > 0
      ? `${totalSent} candidature(s) envoyée(s). Consulte « Voir le détail des envois » pour les détails.`
      : firstReason
        ? firstReason
        : list.length > 0
          ? 'Traitement terminé. Aucune nouvelle candidature envoyée (quota du jour ou pas d\'offre avec email trouvée).'
          : 'Aucune campagne active.'
    return NextResponse.json({
      ok: true,
      message,
      processed: list.length,
      results
    })
  } catch (e) {
    console.error('Run now campaigns error:', e)
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 })
  }
}
