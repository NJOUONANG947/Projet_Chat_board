import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// POST - Créer un poste
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      required_skills,
      required_experience,
      location,
      salary_range,
      employment_type,
      status
    } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Titre et description requis' }, { status: 400 })
    }

    const { data: jobPosting, error } = await supabase
      .from('job_postings')
      .insert({
        recruiter_id: session.user.id,
        title,
        description,
        required_skills: required_skills || [],
        required_experience: required_experience || null,
        location: location || null,
        salary_range: salary_range || null,
        employment_type: employment_type || 'full-time',
        status: status || 'open'
      })
      .select()
      .single()

    if (error) {
      console.error('Job posting creation error:', error)
      return NextResponse.json({ error: 'Erreur création poste' }, { status: 500 })
    }

    return NextResponse.json({ jobPosting })

  } catch (error) {
    console.error('Job postings API error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET - Lister les postes
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('job_postings')
      .select('*')
      .eq('recruiter_id', session.user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: jobPostings, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Erreur récupération postes' }, { status: 500 })
    }

    return NextResponse.json({ jobPostings: jobPostings || [] })

  } catch (error) {
    console.error('Job postings GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
