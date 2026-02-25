import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data, error } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: data })
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
    const {
      preferred_job_titles,
      locations,
      employment_types,
      sectors,
      salary_min,
      salary_max,
      cv_document_id,
      cv_id,
      default_cover_letter,
      allow_auto_apply,
      contact_email,
      contact_phone,
      first_name,
      last_name,
      phone,
      gender,
      contract_type,
      start_date_earliest,
      end_date_latest,
      contract_duration_min_months,
      contract_duration_max_months,
      zone_geographique,
      campaign_email,
      has_promo_code,
      promo_code
    } = body

    const row = {
      user_id: session.user.id,
      preferred_job_titles: preferred_job_titles || [],
      locations: locations || [],
      employment_types: employment_types || [],
      sectors: sectors || [],
      salary_min: salary_min ?? null,
      salary_max: salary_max ?? null,
      cv_document_id: cv_document_id || null,
      cv_id: cv_id || null,
      default_cover_letter: default_cover_letter || null,
      allow_auto_apply: allow_auto_apply ?? false,
      contact_email: contact_email || session.user.email,
      contact_phone: contact_phone || null,
      updated_at: new Date().toISOString(),
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
      gender: gender || null,
      contract_type: contract_type || null,
      start_date_earliest: start_date_earliest || null,
      end_date_latest: end_date_latest || null,
      contract_duration_min_months: contract_duration_min_months ?? null,
      contract_duration_max_months: contract_duration_max_months ?? null,
      zone_geographique: zone_geographique || null,
      campaign_email: campaign_email || contact_email || session.user.email,
      has_promo_code: has_promo_code ?? false,
      promo_code: promo_code || null
    }

    const { data, error } = await supabase
      .from('candidate_profiles')
      .upsert(row, { onConflict: 'user_id', ignoreDuplicates: false })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: data })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
