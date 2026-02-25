import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import RankingService from '../../../lib/RankingService.js'

// POST - Calculer et classer les candidats pour un poste
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { jobPostingId, weights } = body

    if (!jobPostingId) {
      return NextResponse.json({ error: 'ID du poste requis' }, { status: 400 })
    }

    // Vérifier que le poste appartient au recruteur
    const { data: jobPosting, error: jobError } = await supabase
      .from('job_postings')
      .select('recruiter_id')
      .eq('id', jobPostingId)
      .single()

    if (jobError || !jobPosting || jobPosting.recruiter_id !== session.user.id) {
      return NextResponse.json({ error: 'Poste non trouvé ou non autorisé' }, { status: 404 })
    }

    const rankingService = new RankingService(supabase)
    const rawRankings = await rankingService.rankCandidatesForJob(jobPostingId, weights)

    // Enrichir avec les noms des candidats
    const candidateIds = rawRankings.map(r => r.candidate_id)
    const { data: candidates } = await supabase
      .from('candidates')
      .select('id, first_name, last_name, email')
      .in('id', candidateIds)
    const candidateMap = new Map((candidates || []).map(c => [c.id, c]))
    const rankings = rawRankings.map(r => ({
      ...r,
      candidate_name: (() => {
        const c = candidateMap.get(r.candidate_id)
        if (!c) return `Candidat #${String(r.candidate_id).slice(0, 8)}`
        return [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || `Candidat #${String(r.candidate_id).slice(0, 8)}`
      })()
    }))

    return NextResponse.json({ 
      rankings,
      message: `${rankings.length} candidats classés avec succès`
    })

  } catch (error) {
    console.error('Ranking calculation error:', error)
    return NextResponse.json({ 
      error: 'Erreur calcul classement',
      details: error.message 
    }, { status: 500 })
  }
}

// GET - Récupérer le classement pour un poste
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobPostingId = searchParams.get('jobPostingId')

    if (!jobPostingId) {
      return NextResponse.json({ error: 'ID du poste requis' }, { status: 400 })
    }

    const rankingService = new RankingService(supabase)
    const rawRankings = await rankingService.getRankingForJob(jobPostingId)

    // Normaliser pour le frontend : rank, candidate_id, candidate_name, overall_score, breakdown
    const rankings = (rawRankings || []).map((row, idx) => ({
      rank: row.rank_position ?? idx + 1,
      candidate_id: row.candidate_id,
      candidate_name: row.candidate
        ? [row.candidate.first_name, row.candidate.last_name].filter(Boolean).join(' ') || row.candidate.email || `Candidat #${String(row.candidate_id).slice(0, 8)}`
        : `Candidat #${String(row.candidate_id).slice(0, 8)}`,
      overall_score: row.relevance_score?.overall_score ?? 0,
      breakdown: row.relevance_score ? {
        skills: { score: row.relevance_score.skills_score ?? 0 },
        experience: { score: row.relevance_score.experience_score ?? 0 }
      } : null
    }))

    return NextResponse.json({ rankings })

  } catch (error) {
    console.error('Get ranking error:', error)
    return NextResponse.json({ error: 'Erreur récupération classement' }, { status: 500 })
  }
}
