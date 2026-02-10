import { NextResponse } from 'next/server'
import { authenticateRequest } from '../../../backend/lib/auth.js'
import { supabase } from '../../../backend/lib/supabase'

export async function GET(request) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { data: applications, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        user_cvs(title)
      `)
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des candidatures' }, { status: 500 })
    }

    return NextResponse.json({ applications: applications || [] })
  } catch (error) {
    console.error('Applications API Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de la récupération des candidatures'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { company_name, position_title, job_description, application_status, applied_date, notes, cv_id } = body

    if (!company_name || !position_title) {
      return NextResponse.json({
        error: 'Le nom de l\'entreprise et le titre du poste sont obligatoires'
      }, { status: 400 })
    }

    const { data: application, error } = await supabase
      .from('job_applications')
      .insert({
        user_id: auth.user.id,
        company_name,
        position_title,
        job_description,
        application_status: application_status || 'applied',
        applied_date,
        notes,
        cv_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating application:', error)
      return NextResponse.json({ error: 'Erreur lors de la création de la candidature' }, { status: 500 })
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Applications API Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de la création de la candidature'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { id, company_name, position_title, job_description, application_status, applied_date, notes, cv_id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de candidature requis' }, { status: 400 })
    }

    const { data: application, error } = await supabase
      .from('job_applications')
      .update({
        company_name,
        position_title,
        job_description,
        application_status,
        applied_date,
        notes,
        cv_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating application:', error)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour de la candidature' }, { status: 500 })
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Applications API Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de la mise à jour de la candidature'
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de candidature requis' }, { status: 400 })
    }

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id)

    if (error) {
      console.error('Error deleting application:', error)
      return NextResponse.json({ error: 'Erreur lors de la suppression de la candidature' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Applications API Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de la suppression de la candidature'
    }, { status: 500 })
  }
}
