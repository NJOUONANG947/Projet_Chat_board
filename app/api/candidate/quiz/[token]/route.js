import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET - Récupérer un quiz par token pour un candidat
 * Route publique (pas d'authentification requise)
 */
export async function GET(request, { params }) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ error: 'Token requis' }, { status: 400 })
    }

    // Service role pour lire quiz_results (lien unique stocké dans invite_token)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Récupérer le quiz_result par le token unique (colonne invite_token)
    const { data: quizResult, error: resultError } = await supabase
      .from('quiz_results')
      .select(`
        *,
        quiz:quizzes(*),
        candidate:candidates(*)
      `)
      .eq('invite_token', token)
      .is('completed_at', null)
      .maybeSingle()

    if (resultError || !quizResult) {
      return NextResponse.json({ error: 'Quiz non trouvé ou déjà complété' }, { status: 404 })
    }

    // Vérifier que le quiz est actif
    if (!quizResult.quiz?.is_active) {
      return NextResponse.json({ error: 'Ce quiz n\'est plus disponible' }, { status: 403 })
    }

    return NextResponse.json({
      quiz: quizResult.quiz,
      candidate: quizResult.candidate,
      quizResultId: quizResult.id
    })

  } catch (error) {
    console.error('Get quiz by token error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
