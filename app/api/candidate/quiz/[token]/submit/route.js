import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * POST - Soumettre les réponses d'un quiz par un candidat
 */
export async function POST(request, { params }) {
  try {
    const { token } = params
    const body = await request.json()
    const {
      quizResultId,
      answers,
      score,
      correctAnswers,
      totalQuestions,
      timeSpent
    } = body

    if (!quizResultId || !answers) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Utiliser service role pour permettre la mise à jour
    )

    // Vérifier que le quiz_result existe et n'est pas déjà complété
    const { data: quizResult, error: resultError } = await supabase
      .from('quiz_results')
      .select(`
        *,
        quiz:quizzes(*),
        candidate:candidates(*)
      `)
      .eq('id', quizResultId)
      .single()

    if (resultError || !quizResult) {
      return NextResponse.json({ error: 'Résultat de quiz non trouvé' }, { status: 404 })
    }

    if (quizResult.completed_at) {
      return NextResponse.json({ error: 'Ce quiz a déjà été complété' }, { status: 403 })
    }

    // Mettre à jour le quiz_result avec les réponses
    const { data: updatedResult, error: updateError } = await supabase
      .from('quiz_results')
      .update({
        score: score || 0,
        total_questions: totalQuestions,
        correct_answers: correctAnswers || 0,
        answers: answers,
        time_taken: timeSpent,
        completed_at: new Date().toISOString()
      })
      .eq('id', quizResultId)
      .select()
      .single()

    if (updateError) {
      console.error('Update quiz result error:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
    }

    // Notifier le recruteur (optionnel - via email ou notification)
    if (quizResult.recruiter_id) {
      await notifyRecruiter({
        recruiterId: quizResult.recruiter_id,
        candidateName: `${quizResult.candidate?.first_name || ''} ${quizResult.candidate?.last_name || ''}`.trim() || 'Candidat',
        quizTitle: quizResult.quiz?.title || 'Quiz',
        score,
        totalQuestions
      })
    }

    // Recalculer le score de pertinence puis le classement du poste (temps réel)
    if (quizResult.quiz?.job_posting_id && quizResult.candidate_id) {
      try {
        const RankingService = (await import('../../../../../lib/RankingService.js')).default
        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        const rankingService = new RankingService(serviceSupabase)
        await rankingService.calculateRelevanceScore(
          quizResult.candidate_id,
          quizResult.quiz.job_posting_id
        )
        // Recalculer tout le classement du poste pour mettre à jour les rangs en temps réel
        await rankingService.rankCandidatesForJob(quizResult.quiz.job_posting_id)
      } catch (err) {
        console.error('Error recalculating relevance score / ranking:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz soumis avec succès',
      result: updatedResult
    })

  } catch (error) {
    console.error('Submit quiz error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * Notifier le recruteur qu'un candidat a complété le quiz
 */
async function notifyRecruiter({ recruiterId, candidateName, quizTitle, score, totalQuestions }) {
  try {
    // Récupérer l'email du recruteur
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: recruiter } = await supabase.auth.admin.getUserById(recruiterId)
    const recruiterEmail = recruiter?.user?.email

    if (!recruiterEmail) {
      console.log('Recruiter email not found')
      return
    }

    // Envoyer l'email de notification au recruteur
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY non configuré - notification email non envoyée')
        return
      }

      const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM
      if (!fromEmail) {
        console.warn('⚠️ RESEND_FROM_EMAIL / EMAIL_FROM non configuré - notification email non envoyée')
        return
      }

      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [recruiterEmail],
        subject: `✅ Quiz complété - ${candidateName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">✅ Quiz Complété</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Bonjour,</p>
              
              <p><strong>${candidateName}</strong> a complété le quiz <strong>"${quizTitle}"</strong>.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <p style="margin: 0;"><strong>Score :</strong> ${score}/100</p>
                <p style="margin: 5px 0 0 0;"><strong>Questions :</strong> ${totalQuestions}</p>
              </div>
              
              <p>Connectez-vous à votre dashboard pour voir les réponses détaillées.</p>
            </div>
          </body>
          </html>
        `
      })

      if (error) {
        console.error('Erreur envoi notification recruteur:', error)
      } else {
        console.log('✅ Notification envoyée au recruteur:', { emailId: data?.id, recruiterEmail })
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error)
      // Ne pas échouer la soumission si la notification échoue
    }
  } catch (error) {
    console.error('Notify recruiter error:', error)
    // Ne pas échouer la soumission si la notification échoue
  }
}
