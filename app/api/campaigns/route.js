import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data, error } = await supabase
      .from('job_campaigns')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ campaigns: data || [] })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const duration_days = Math.min(Math.max(Number(body.duration_days) || 7, 1), 90)
    const max_per_day = Math.min(Math.max(Number(body.max_applications_per_day) || 10, 1), 50)

    const ends_at = new Date()
    ends_at.setDate(ends_at.getDate() + duration_days)

    const { data: campaign, error } = await supabase
      .from('job_campaigns')
      .insert({
        user_id: session.user.id,
        status: 'active',
        duration_days,
        ends_at: ends_at.toISOString(),
        max_applications_per_day: max_per_day
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ campaign })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
