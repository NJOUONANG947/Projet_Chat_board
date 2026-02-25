import { NextResponse } from 'next/server'
import { Resend } from 'resend'

/**
 * Route de test pour vérifier la configuration Resend
 * GET /api/test-email?to=votre@email.com
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to')

    if (!to) {
      return NextResponse.json({ 
        error: 'Paramètre "to" requis. Utilisez: /api/test-email?to=votre@email.com' 
      }, { status: 400 })
    }

    // Vérifier la configuration
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'RESEND_API_KEY n\'est pas configuré dans les variables d\'environnement',
        help: 'Ajoutez RESEND_API_KEY dans votre fichier .env.local'
      }, { status: 500 })
    }

    if (!process.env.EMAIL_FROM) {
      return NextResponse.json({ 
        error: 'EMAIL_FROM n\'est pas configuré dans les variables d\'environnement',
        help: 'Ajoutez EMAIL_FROM=onboarding@resend.dev dans votre fichier .env.local'
      }, { status: 500 })
    }

    console.log('🔍 Configuration détectée:')
    console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NON CONFIGURÉ')
    console.log('- EMAIL_FROM:', process.env.EMAIL_FROM)

    // Tester l'envoi d'email
    const resend = new Resend(process.env.RESEND_API_KEY)

    console.log('📧 Tentative d\'envoi d\'email à:', to)

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject: 'Test Email - Configuration Resend',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #667eea;">✅ Test Email Réussi !</h2>
          <p>Si vous recevez cet email, votre configuration Resend fonctionne correctement.</p>
          <p><strong>Expéditeur:</strong> ${process.env.EMAIL_FROM}</p>
          <p><strong>Destinataire:</strong> ${to}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Date: ${new Date().toLocaleString('fr-FR')}
          </p>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('❌ Erreur Resend:', error)
      return NextResponse.json({ 
        error: 'Erreur lors de l\'envoi de l\'email',
        details: error,
        configuration: {
          hasApiKey: !!process.env.RESEND_API_KEY,
          emailFrom: process.env.EMAIL_FROM,
          apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10)
        }
      }, { status: 500 })
    }

    console.log('✅ Email envoyé avec succès!')
    console.log('- Email ID:', data?.id)
    console.log('- Destinataire:', to)

    return NextResponse.json({
      success: true,
      message: 'Email de test envoyé avec succès',
      emailId: data?.id,
      to: to,
      from: process.env.EMAIL_FROM,
      note: 'Vérifiez votre boîte de réception (et le dossier spam)'
    })

  } catch (error) {
    console.error('❌ Erreur serveur:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
