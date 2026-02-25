import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// PATCH - Mettre à jour un quiz (approbation, activation, etc.)
export async function PATCH(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Vérifier que le quiz appartient au recruteur
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('recruiter_id')
      .eq('id', id)
      .single()

    if (quizError || !quiz || quiz.recruiter_id !== session.user.id) {
      return NextResponse.json({ error: 'Quiz non trouvé ou non autorisé' }, { status: 404 })
    }

    // Mettre à jour le quiz
    const { data: updatedQuiz, error: updateError } = await supabase
      .from('quizzes')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Quiz update error:', updateError)
      return NextResponse.json({ error: 'Erreur mise à jour quiz' }, { status: 500 })
    }

    return NextResponse.json({ quiz: updatedQuiz })

  } catch (error) {
    console.error('Quiz PATCH error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un quiz (rejet)
export async function DELETE(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = params

    // Vérifier que le quiz appartient au recruteur
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('recruiter_id')
      .eq('id', id)
      .single()

    if (quizError || !quiz || quiz.recruiter_id !== session.user.id) {
      return NextResponse.json({ error: 'Quiz non trouvé ou non autorisé' }, { status: 404 })
    }

    // Supprimer le quiz
    const { error: deleteError } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Quiz delete error:', deleteError)
      return NextResponse.json({ error: 'Erreur suppression quiz' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Quiz supprimé avec succès' })

  } catch (error) {
    console.error('Quiz DELETE error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET - Récupérer un quiz spécifique
export async function GET(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = params

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        job_posting:job_postings(title)
      `)
      .eq('id', id)
      .eq('recruiter_id', session.user.id)
      .single()

    if (error || !quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ quiz })

  } catch (error) {
    console.error('Quiz GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
