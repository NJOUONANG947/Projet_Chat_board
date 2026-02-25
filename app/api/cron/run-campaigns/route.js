/**
 * À appeler chaque jour (cron) pour traiter les campagnes actives.
 * Sécuriser par un secret (CRON_SECRET) pour éviter les appels non autorisés.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runCampaignDay } from '../../../../backend/services/CampaignService.js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const querySecret = searchParams.get('secret')
  const secret = process.env.CRON_SECRET
  const ok = !secret || authHeader === `Bearer ${secret}` || querySecret === secret
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: campaigns } = await supabase
    .from('job_campaigns')
    .select('id, user_id')
    .eq('status', 'active')
    .gte('ends_at', new Date().toISOString())

  const results = []
  for (const c of campaigns || []) {
    try {
      const out = await runCampaignDay(supabase, c.id, c.user_id)
      results.push({ campaignId: c.id, userId: c.user_id, ...out })
    } catch (e) {
      results.push({ campaignId: c.id, userId: c.user_id, error: e.message })
    }
  }

  return NextResponse.json({ ok: true, processed: (campaigns || []).length, results })
}

export async function POST(request) {
  return GET(request)
}
