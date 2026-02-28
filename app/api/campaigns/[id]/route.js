import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PATCH(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { status } = body

    const { data: campaign } = await supabase.from('job_campaigns').select('id').eq('id', id).eq('user_id', session.user.id).single()
    if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

    const updates = { updated_at: new Date().toISOString() }
    if (['active', 'paused', 'completed', 'cancelled'].includes(status)) updates.status = status

    const { data, error } = await supabase.from('job_campaigns').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ campaign: data })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params

    const { data: campaign } = await supabase.from('job_campaigns').select('id').eq('id', id).eq('user_id', session.user.id).single()
    if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

    const { error: deleteAppsError } = await supabase.from('campaign_applications').delete().eq('campaign_id', id)
    if (deleteAppsError) console.warn('Campaign applications delete:', deleteAppsError.message)

    const { error } = await supabase.from('job_campaigns').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
