import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/** Route dynamique (utilise cookies) — évite l’erreur de build "couldn't be rendered statically" */
export const dynamic = 'force-dynamic'

/**
 * GET - Liste des résultats de quiz complétés par les candidats (recruteur)
 */
export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: results, error } = await supabase
      .from('quiz_results')
      .select(`
        id,
        quiz_id,
        candidate_id,
        recruiter_id,
        score,
        total_questions,
        correct_answers,
        time_taken,
        completed_at,
        answers,
        quiz:quizzes(id, title, quiz_type, questions, job_posting_id),
        candidate:candidates(id, first_name, last_name, email)
      `)
      .eq('recruiter_id', session.user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('Quiz results fetch error:', error)
      return NextResponse.json({ error: 'Erreur lors du chargement des résultats' }, { status: 500 })
    }

    const candidateName = (c) => {
      if (!c) return 'Candidat'
      const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
      return name || c.email || 'Candidat'
    }

    const list = (results || []).map((r) => {
      const quiz = Array.isArray(r.quiz) ? r.quiz[0] : r.quiz
      const candidate = Array.isArray(r.candidate) ? r.candidate[0] : r.candidate
      return {
        id: r.id,
        quizId: r.quiz_id,
        candidateId: r.candidate_id,
        candidateName: candidateName(candidate),
        candidateEmail: candidate?.email,
        quizTitle: quiz?.title,
        quizType: quiz?.quiz_type,
        questions: quiz?.questions,
        score: r.score,
        totalQuestions: r.total_questions,
        correctAnswers: r.correct_answers,
        timeTaken: r.time_taken,
        completedAt: r.completed_at,
        answers: r.answers
      }
    })

    return NextResponse.json({ results: list })
  } catch (err) {
    console.error('Quiz results API error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
