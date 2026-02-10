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
// Uses SERVICE_ROLE_KEY to bypass RLS for storage operations
async function extractTextFromFile(filePath, mimeType) {
  try {
    console.log('Extracting text from file:', filePath, 'Type:', mimeType)

    // Create Supabase client with SERVICE_ROLE_KEY for storage operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Test download first (as requested)
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('documents')
      .download(filePath)

    console.log('DOWNLOAD ERROR:', downloadError)
    console.log('FILE SIZE:', fileData?.size)

    if (downloadError) {
      console.error('Download error:', downloadError)
      throw new Error(`Failed to download file: ${JSON.stringify(downloadError)}`)
    }

    if (!fileData || fileData.size === 0) {
      throw new Error('Downloaded file is empty or invalid')
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer())

    // Extract text based on file type
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

    console.log('Text extracted successfully, length:', extractedText.length)
    return extractedText.trim()

  } catch (error) {
    console.error('Text extraction error:', error)
    throw error
  }
}

export async function POST(request) {
  try {
    // Create authenticated Supabase client using cookies
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('Authentication error:', sessionError)
      return NextResponse.json({ error: 'Non autorisé - Veuillez vous reconnecter' }, { status: 401 })
    }

    const user = session.user
    console.log('Authenticated user for analysis:', user.id)

    const body = await request.json()
    const { type, documentIds } = body

    if (!type || !documentIds || documentIds.length === 0) {
      return NextResponse.json({
        error: 'Type et IDs de documents requis'
      }, { status: 400 })
    }

    // Fetch documents with authenticated client (RLS will filter by user_id)
    const { data: documents, error: fetchError } = await supabase
      .from('uploaded_documents')
      .select('*')
      .in('id', documentIds)

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des documents' }, { status: 500 })
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'Documents non trouvés ou accès non autorisé' }, { status: 404 })
    }

    console.log('Found documents for analysis:', documents.length)

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

      // AI Cover Letter Generation Prompt
      const generationPrompt = `Tu es un expert en recrutement et en rédaction de lettres de motivation professionnelles.

Voici le CONTENU COMPLET D'UN CV (texte brut) :
---
${cvText}
---

${jobText && jobText.length > 10 ? `Voici éventuellement une OFFRE D'EMPLOI (si présente) :
---
${jobText}
---` : ''}

🎯 TA MISSION :

1. Analyse attentivement le CV.
2. Identifie AUTOMATIQUEMENT :
   - le nom du candidat
   - ses expériences professionnelles
   - ses compétences clés
   - son parcours
3. Rédige une LETTRE DE MOTIVATION :
   - personnalisée
   - professionnelle
   - fluide
   - convaincante
   - adaptée EXACTEMENT au profil réel du CV${jobText && jobText.length > 10 ? ' et à l\'offre d\'emploi' : ''}
4. Utilise UNIQUEMENT les informations présentes dans le CV${jobText && jobText.length > 10 ? ' et l\'offre d\'emploi' : ''}.
5. ❌ INTERDICTION TOTALE d'utiliser :
   - [Votre Nom]
   - [X] ans
   - tout placeholder ou champ vide
6. Si une information n'existe pas dans le CV, reformule intelligemment sans inventer.

📌 FORMAT :
- Lettre complète
- Français professionnel
- Prête à être envoyée`

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
