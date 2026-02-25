import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import RankingService from '../../../lib/RankingService.js'

// POST - Calculer le score de pertinence d'un candidat pour un poste
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { candidateId, jobPostingId, weights } = body

    if (!candidateId || !jobPostingId) {
      return NextResponse.json({ error: 'ID candidat et poste requis' }, { status: 400 })
    }

    // Vérifier les permissions
    const [candidateCheck, jobCheck] = await Promise.all([
      supabase.from('candidates').select('recruiter_id').eq('id', candidateId).single(),
      supabase.from('job_postings').select('recruiter_id').eq('id', jobPostingId).single()
    ])

    if (candidateCheck.error || !candidateCheck.data || 
        jobCheck.error || !jobCheck.data) {
      return NextResponse.json({ error: 'Candidat ou poste non trouvé' }, { status: 404 })
    }

    if (candidateCheck.data.recruiter_id !== session.user.id ||
        jobCheck.data.recruiter_id !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const rankingService = new RankingService(supabase)
    const score = await rankingService.calculateRelevanceScore(candidateId, jobPostingId, weights)

    return NextResponse.json({ score })

  } catch (error) {
    console.error('Relevance score calculation error:', error)
    return NextResponse.json({ 
      error: 'Erreur calcul score',
      details: error.message 
    }, { status: 500 })
  }
}
