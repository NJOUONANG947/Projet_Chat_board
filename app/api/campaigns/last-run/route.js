/**
 * Dernière exécution de campagne (run) + liens sauvegardés.
 * Permet d'afficher résultats et liens même après timeout ou sans avoir cliqué "Lancer maintenant".
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

    const { data: run, error: runError } = await supabase
      .from('campaign_runs')
      .select('id, campaign_id, started_at, completed_at, status, offers_fetched, offers_matched, sent_count, reason')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (runError && runError.code !== 'PGRST116') {
      return NextResponse.json({ error: runError.message }, { status: 500 })
    }

    if (!run) {
      return NextResponse.json({ run: null, links: [], message: null })
    }

    const { data: links, error: linksError } = await supabase
      .from('campaign_run_links')
      .select('id, target_name, target_url, target_source')
      .eq('run_id', run.id)
      .order('created_at', { ascending: true })

    if (linksError) {
      return NextResponse.json({ error: linksError.message }, { status: 500 })
    }

    const linkList = (links || []).map((l) => ({
      label: l.target_name || "Voir l'offre",
      href: l.target_url || '#'
    }))

    let message = run.reason || null
    if (!message && run.status === 'completed') {
      message = `${run.offers_fetched ?? 0} offres trouvées, ${run.offers_matched ?? 0} correspondent à ton profil.`
      if ((run.sent_count ?? 0) > 0) {
        message = `${run.sent_count} candidature(s) envoyée(s). ${message}`
      }
      if (linkList.length > 0 && (run.sent_count ?? 0) === 0) {
        message = `${linkList.length} offre(s) à consulter. Postule via les liens ci-dessous.`
      }
    }
    if (run.status === 'running') {
      message = "Exécution en cours… Les résultats et liens s'afficheront ici à la fin."
    }

    return NextResponse.json({
      run: {
        id: run.id,
        campaign_id: run.campaign_id,
        started_at: run.started_at,
        completed_at: run.completed_at,
        status: run.status,
        offers_fetched: run.offers_fetched,
        offers_matched: run.offers_matched,
        sent_count: run.sent_count
      },
      links: linkList,
      message
    })
  } catch (e) {
    console.error('Last run error:', e)
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 })
  }
}
