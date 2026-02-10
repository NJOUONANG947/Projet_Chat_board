import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Helper function to extract text from a file in Supabase Storage
async function extractTextFromFile(filePath, mimeType) {
  try {
    console.log('Extracting text from file:', filePath, 'Type:', mimeType)

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('documents')
      .download(filePath)

    if (downloadError) {
      throw new Error(`Failed to download file: ${JSON.stringify(downloadError)}`)
    }

    if (!fileData || fileData.size === 0) {
      throw new Error('Downloaded file is empty or invalid')
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    let extractedText = ''

    if (mimeType === 'application/pdf') {
      const pdfData = await pdfParse(buffer)
      extractedText = pdfData.text
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else if (mimeType === 'text/plain') {
      extractedText = buffer.toString('utf-8')
    } else {
      throw new Error(`Unsupported file type for text extraction: ${mimeType}`)
    }

    return extractedText.trim()
  } catch (error) {
    console.error('Text extraction error:', error)
    throw error
  }
}

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé - Veuillez vous reconnecter' }, { status: 401 })
    }

    const user = session.user
    const body = await request.json()
    const { type, documentIds } = body

    if (!documentIds || documentIds.length === 0) {
      return NextResponse.json({
        error: 'Au moins un document est requis'
      }, { status: 400 })
    }

    // Fetch documents with authenticated client
    const { data: documents, error: fetchError } = await supabase
      .from('uploaded_documents')
      .select('*')
      .in('id', documentIds)

    if (fetchError || !documents || documents.length === 0) {
      return NextResponse.json({ error: 'Documents non trouvés' }, { status: 404 })
    }

    if (type === 'generate_cover_letter') {
      console.log('Starting cover letter generation for documents:', documents.map(d => ({ id: d.id, name: d.file_name, type: d.file_type })))

      // Auto-identify CV and job offer based on content and metadata
      let cvDoc, jobDoc

      // First try to identify by file_type
      cvDoc = documents.find(d => d.file_type === 'cv')
      jobDoc = documents.find(d => d.file_type === 'job_offer')

      console.log('Initial identification - CV:', cvDoc?.id, 'Job:', jobDoc?.id)

      // If not found by type, try to identify by content analysis
      if (!cvDoc || !jobDoc) {
        console.log('Content-based identification needed')
        for (const doc of documents) {
          const text = (doc.extracted_text || '').toLowerCase()
          const fileName = (doc.metadata?.original_name || doc.file_name || '').toLowerCase()

          console.log('Analyzing document:', doc.id, 'filename:', fileName, 'has_text:', !!text)

          // Check for CV indicators
          if (!cvDoc && (
            fileName.includes('cv') ||
            fileName.includes('resume') ||
            fileName.includes('curriculum') ||
            text.includes('expérience professionnelle') ||
            text.includes('formation') ||
            text.includes('compétences') ||
            text.includes('profil professionnel')
          )) {
            cvDoc = doc
            console.log('Found CV by content:', doc.id)
          }

          // Check for job offer indicators
          if (!jobDoc && (
            fileName.includes('offre') ||
            fileName.includes('job') ||
            fileName.includes('poste') ||
            text.includes('description du poste') ||
            text.includes('missions') ||
            text.includes('profil recherché') ||
            text.includes('nous proposons') ||
            text.includes('vous êtes')
          )) {
            jobDoc = doc
            console.log('Found Job by content:', doc.id)
          }
        }
      }

      // For cover letter generation, we need at least a CV
      if (!cvDoc) {
        return NextResponse.json({
          error: 'Aucun CV trouvé. Veuillez uploader un CV pour générer une lettre de motivation.'
        }, { status: 400 })
      }

      console.log('Final assignment - CV:', cvDoc.id, 'Job:', jobDoc?.id)

      // Get text content - try database first, then extract from file
      console.log('Getting text content for documents...')

      let cvText = cvDoc.extracted_text?.trim()
      let jobText = jobDoc?.extracted_text?.trim()

      // If CV text is missing, extract from file
      if (!cvText) {
        try {
          console.log('CV text missing from database, extracting from file...')
          cvText = await extractTextFromFile(cvDoc.file_path, cvDoc.metadata?.mime_type)
          console.log('CV text extracted from file, length:', cvText.length)
        } catch (error) {
          console.error('Failed to extract CV text:', error)
          return NextResponse.json({
            error: `Impossible d'extraire le texte du CV: ${error.message}`
          }, { status: 400 })
        }
      }

      // If Job text is missing and jobDoc exists, extract from file
      if (jobDoc && !jobText) {
        try {
          console.log('Job text missing from database, extracting from file...')
          jobText = await extractTextFromFile(jobDoc.file_path, jobDoc.metadata?.mime_type)
          console.log('Job text extracted from file, length:', jobText.length)
        } catch (error) {
          console.error('Failed to extract Job text:', error)
          // Job is optional, so we can continue without it
          console.log('Continuing without job text due to extraction error')
        }
      }

      // Final validation - ensure CV text is not empty
      if (!cvText || cvText.length < 10) {
        return NextResponse.json({
          error: 'Le contenu du CV est vide ou insuffisant pour générer une lettre de motivation.'
        }, { status: 400 })
      }

      console.log('Text content validated - CV length:', cvText.length, 'Job length:', jobText?.length || 0)

      console.log('Starting cover letter generation...')

      // AI Cover Letter Generation Prompt - Enhanced for better structure
      let generationPrompt
      if (jobText && jobText.length > 10) {
        // Personalized cover letter with job offer
        generationPrompt = `Génère une lettre de motivation professionnelle et complète basée sur ce CV et cette offre d'emploi.

CV DU CANDIDAT :
---
${cvText}
---

OFFRE D'EMPLOI :
---
${jobText}
---

INSTRUCTIONS DÉTAILLÉES :
- Rédige une lettre de motivation complète et professionnelle en français
- Structure parfaite : En-tête, Date, Destinataire, Objet, Salutation, Corps (Introduction + Corps + Conclusion), Formule de politesse
- Intègre TOUTES les informations pertinentes du CV : expériences, compétences, formation, réalisations
- Adapte spécifiquement aux exigences de l'offre d'emploi
- Mentionne le poste visé et l'entreprise
- Démontre la motivation et l'adéquation au poste
- Utilise un ton professionnel mais engageant
- Longueur : 350-450 mots pour une lettre complète
- Format : texte brut professionnel, prêt à être utilisé

RÈGLES IMPORTANTES :
- Lettre complète avec tous les éléments formels
- Intégration systématique des expériences du CV
- Mise en valeur des compétences pertinentes pour l'offre
- Argumentation solide sur l'adéquation au poste
- RÉPONDS UNIQUEMENT avec le texte complet de la lettre de motivation, rien d'autre.`
      } else {
        // General intelligent cover letter
        generationPrompt = `Génère une lettre de motivation professionnelle et complète basée sur ce CV.

CV DU CANDIDAT :
---
${cvText}
---

INSTRUCTIONS DÉTAILLÉES :
- Rédige une lettre de motivation générale mais complète en français
- Structure parfaite : En-tête, Date, Destinataire générique, Objet, Salutation, Corps (Introduction + Corps + Conclusion), Formule de politesse
- Intègre TOUTES les informations pertinentes du CV : expériences détaillées, compétences, formation, réalisations
- Adapte le contenu aux expériences et compétences principales du candidat
- Démontre la motivation et les atouts du candidat
- Utilise un ton professionnel et convaincant
- Longueur : 350-450 mots pour une lettre complète
- Format : texte brut professionnel, prêt à être utilisé

RÈGLES IMPORTANTES :
- Lettre complète avec tous les éléments formels
- Intégration systématique de TOUTES les expériences du CV
- Mise en valeur de toutes les compétences pertinentes
- Argumentation solide sur les qualités et motivations
- RÉPONDS UNIQUEMENT avec le texte complet de la lettre de motivation, rien d'autre.`
      }

      // Check if GROQ API key is available
      if (!process.env.GROQ_API_KEY) {
        console.error('GROQ_API_KEY not found in environment variables')
        return NextResponse.json({
          error: 'Configuration IA manquante - Clé API GROQ non configurée'
        }, { status: 500 })
      }

      console.log('Calling GROQ API for cover letter generation...')
      console.log('Prompt length:', generationPrompt.length, 'characters')

      let aiResponse
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: generationPrompt }],
          model: 'llama-3.1-8b-instant',
          temperature: 0.7, // Higher temperature for more creative writing
          max_tokens: 2000,
        })

        console.log('GROQ API call completed successfully')

        aiResponse = chatCompletion.choices[0]?.message?.content?.trim()

        if (!aiResponse) {
          console.error('Empty response from GROQ API')
          return NextResponse.json({ error: 'Réponse vide de l\'IA' }, { status: 500 })
        }

        console.log('AI Response length:', aiResponse.length, 'characters')
        console.log('AI Response preview:', aiResponse.substring(0, 200) + '...')

      } catch (aiError) {
        console.error('GROQ API Error:', aiError)
        return NextResponse.json({
          error: 'Erreur lors de l\'appel à l\'IA',
          details: aiError.message
        }, { status: 500 })
      }

      console.log('Cover letter generation completed successfully')

      return NextResponse.json({
        cover_letter: aiResponse,
        documents: {
          cv: {
            id: cvDoc.id,
            name: cvDoc.metadata?.original_name || cvDoc.file_name,
            type: cvDoc.file_type
          },
          job: jobDoc ? {
            id: jobDoc.id,
            name: jobDoc.metadata?.original_name || jobDoc.file_name,
            type: jobDoc.file_type
          } : null
        }
      })
    }

    return NextResponse.json({ error: 'Type d\'analyse non supporté' }, { status: 400 })

  } catch (error) {
    console.error('Analysis Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de l\'analyse',
      details: error.message
    }, { status: 500 })
  }
}
