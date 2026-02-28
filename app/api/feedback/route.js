import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const DEFAULT_FEEDBACK_EMAIL = 'arhurnjouonang5@gmail.com'
const DEFAULT_FROM_EMAIL = 'CareerAI <onboarding@resend.dev>'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const senderEmail = typeof body.email === 'string' ? body.email.trim() : ''

    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: 'Veuillez écrire un message d\'au moins 10 caractères.' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Envoi d\'avis indisponible : configurez RESEND_API_KEY dans .env.local (voir .env.example).' },
        { status: 503 }
      )
    }

    const toEmail = process.env.FEEDBACK_EMAIL || DEFAULT_FEEDBACK_EMAIL
    const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || DEFAULT_FROM_EMAIL

    let fromLabel = 'Utilisateur CareerAI'
    if (senderEmail && senderEmail.includes('@')) {
      fromLabel = `${senderEmail} (CareerAI)`
    } else {
      try {
        const cookieStore = await cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email) fromLabel = `${session.user.email} (CareerAI)`
      } catch (_) {}
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: senderEmail && senderEmail.includes('@') ? senderEmail : undefined,
      subject: `[CareerAI] Avis / Feedback`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Nouvel avis CareerAI</h2>
          <p><strong>De :</strong> ${fromLabel}</p>
          ${senderEmail ? `<p><strong>Email :</strong> ${senderEmail}</p>` : ''}
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <div style="white-space: pre-wrap; background: #f5f5f5; padding: 16px; border-radius: 8px;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <p style="color: #888; font-size: 12px; margin-top: 16px;">Envoyé depuis le formulaire Avis de l'application CareerAI.</p>
        </div>
      `
    })

    if (error) {
      console.error('Feedback email error:', error)
      const msg = error?.message || ''
      const userMessage = msg.includes('domain') || msg.includes('Domain')
        ? 'Configuration email incomplète. Vérifiez RESEND_FROM_EMAIL / EMAIL_FROM (ex: onboarding@resend.dev pour les tests).'
        : 'L\'envoi a échoué. Réessayez plus tard.'
      return NextResponse.json(
        { error: userMessage },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Merci ! Votre avis a bien été envoyé.' })
  } catch (e) {
    console.error('Feedback API error:', e)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
