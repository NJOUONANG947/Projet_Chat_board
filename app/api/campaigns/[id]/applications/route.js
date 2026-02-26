import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const { data: campaign } = await supabase.from('job_campaigns').select('id').eq('id', id).eq('user_id', session.user.id).single()
    if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

    const { data, error } = await supabase
      .from('campaign_applications')
      .select('*')
      .eq('campaign_id', id)
      .order('sent_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const applications = (data || []).map((app) => {
      const name = app.target_name
      const targetNameStr =
        typeof name === 'string'
          ? name
          : name && typeof name === 'object'
            ? [name.entreprise, name.projet].filter(Boolean).join(' – ') || '—'
            : '—'
      return { ...app, target_name: targetNameStr }
    })
    return NextResponse.json({ applications })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
