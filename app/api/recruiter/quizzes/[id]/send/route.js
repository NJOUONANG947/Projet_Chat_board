import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/** Renvoie une chaîne pour l'email (évite [object Object] si titre stocké en JSON). */
function safeEmailStr(val) {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object' && val !== null) {
    if ('projet' in val && 'entreprise' in val)
      return [val.entreprise, val.projet].filter(Boolean).join(' – ') || 'Poste'
    return Object.values(val).filter(Boolean).join(' – ') || ''
  }
  return String(val)
}

/**
 * POST - Envoyer un quiz à un candidat par email
 * Génère un lien unique pour que le candidat puisse répondre au quiz
 */
export async function POST(request, context) {
  try {
    const { params: paramsRef } = context || {}
    const params = typeof paramsRef?.then === 'function' ? await paramsRef : paramsRef || {}
    const quizId = params.id

    if (!quizId) {
      return NextResponse.json({ error: 'ID du quiz manquant' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { candidateId, candidateEmail } = body

    if (!candidateId || !candidateEmail) {
      return NextResponse.json({ error: 'ID candidat et email requis' }, { status: 400 })
    }

    // Vérifier que le quiz appartient au recruteur et est actif
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*, job_posting:job_postings(title)')
      .eq('id', quizId)
      .eq('recruiter_id', session.user.id)
      .single()

    if (quizError || !quiz) {
      console.error('Quiz fetch error:', quizError)
      return NextResponse.json({ error: 'Quiz non trouvé ou non autorisé' }, { status: 404 })
    }

    if (!quiz.is_active) {
      return NextResponse.json({ error: 'Le quiz doit être approuvé avant d\'être envoyé' }, { status: 400 })
    }

    // Vérifier que le candidat appartient au recruteur
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .eq('recruiter_id', session.user.id)
      .single()

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidat non trouvé' }, { status: 404 })
    }

    // Générer un token unique pour le lien du quiz
    const quizToken = `${quizId}-${candidateId}-${Date.now()}-${Math.random().toString(36).substring(2)}`

    const questionsCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0

    // Créer l'entrée quiz_results AVANT l'email pour que le lien soit valide dès réception
    // On utilise invite_token (colonne TEXT) pour éviter la colonne metadata / cache schéma
    const { data: quizResult, error: resultError } = await supabase
      .from('quiz_results')
      .insert({
        quiz_id: quizId,
        candidate_id: candidateId,
        recruiter_id: session.user.id,
        score: null,
        total_questions: questionsCount,
        correct_answers: null,
        answers: {},
        completed_at: null,
        invite_token: quizToken
      })
      .select()
      .single()

    if (resultError) {
      console.error('Error creating quiz result:', resultError)
      const msg = process.env.NODE_ENV === 'development' ? resultError.message : 'Erreur lors de la préparation du quiz'
      return NextResponse.json({ error: msg, code: resultError.code }, { status: 500 })
    }

    // Lien du quiz pour le candidat
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const quizLink = `${baseUrl}/quiz/${quizToken}`

    const jobTitle = safeEmailStr(quiz.job_posting?.title ?? quiz.job_posting ?? 'Poste')
    const quizTitle = safeEmailStr(quiz.title)

    // Envoyer l'email via Resend
    try {
      await sendQuizEmail({
        to: candidateEmail,
        candidateName: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Candidat',
        quizTitle,
        jobTitle,
        quizLink,
        recruiterName: session.user.email
      })
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError)
      const msg = emailError?.message || 'Erreur lors de l\'envoi de l\'email'
      return NextResponse.json({
        error: msg,
        details: process.env.NODE_ENV === 'development' ? (emailError.stack || msg) : undefined
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz envoyé avec succès',
      quizLink,
      quizResult
    })

  } catch (error) {
    console.error('Send quiz error:', error)
    const msg = error?.message || 'Erreur serveur'
    return NextResponse.json({
      error: msg,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

/**
 * Fonction pour envoyer l'email du quiz via Resend
 */
async function sendQuizEmail({ to, candidateName, quizTitle, jobTitle, quizLink, recruiterName }) {
  try {
    // Vérifier que Resend est configuré
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY n\'est pas configuré dans les variables d\'environnement. Veuillez configurer Resend pour envoyer des emails.')
    }

    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM n\'est pas configuré. Veuillez définir l\'adresse email expéditrice dans EMAIL_FROM.')
    }

    // Importer et utiliser Resend
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    console.log('📧 Configuration Resend:')
    console.log('- EMAIL_FROM:', process.env.EMAIL_FROM)
    console.log('- API Key:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NON CONFIGURÉ')
    console.log('- Destinataire:', to)

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject: `Quiz technique - ${jobTitle}`,
      html: generateEmailHTML({ candidateName, quizTitle, jobTitle, quizLink, recruiterName })
    })

    if (error) {
      console.error('❌ Erreur Resend API:', error)
      console.error('❌ Détails de l\'erreur:', JSON.stringify(error, null, 2))
      const msg = error.message || JSON.stringify(error)
      if (msg.includes('only send testing emails to your own email') || msg.includes('verify a domain')) {
        throw new Error(
          'En mode test, Resend n\'autorise l\'envoi qu\'à votre propre adresse (celle du compte Resend). ' +
          'Pour envoyer le quiz à d\'autres candidats : vérifiez un domaine sur https://resend.com/domains puis utilisez une adresse « De » avec ce domaine (ex. noreply@votredomaine.com) dans EMAIL_FROM.'
        )
      }
      throw new Error(`Erreur Resend: ${msg}`)
    }

    console.log('✅ Email envoyé avec succès via Resend!')
    console.log('- Email ID:', data?.id)
    console.log('- Destinataire:', to)
    console.log('- Expéditeur:', process.env.EMAIL_FROM)

    return true

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    throw error // Propager l'erreur pour que l'API puisse la gérer
  }
}

function generateEmailHTML({ candidateName, quizTitle, jobTitle, quizLink, recruiterName }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quiz technique - ${jobTitle}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🎯 Quiz Technique</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${jobTitle}</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Bonjour ${candidateName},</p>
        
        <p>Vous avez été sélectionné(e) pour passer un quiz technique dans le cadre de votre candidature pour le poste de <strong>${jobTitle}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h2 style="margin-top: 0; color: #667eea;">${quizTitle}</h2>
          <p style="margin-bottom: 0;">Ce quiz vous permettra de démontrer vos compétences techniques.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${quizLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                    font-weight: bold; font-size: 16px;">
            🚀 Commencer le quiz
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>Note importante :</strong> Ce lien est unique et personnel. Ne le partagez pas avec d'autres personnes.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px; margin: 0;">
          Si vous avez des questions, n'hésitez pas à nous contacter.<br>
          Bonne chance pour votre quiz !
        </p>
      </div>
    </body>
    </html>
  `
}
