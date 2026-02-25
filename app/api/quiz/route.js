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
    const { documentIds } = body

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

    console.log('Generating quiz for documents:', documents.map(d => ({ id: d.id, name: d.file_name, type: d.file_type })))

    // Identify CV and job offer
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

    // We need at least a job offer to generate the quiz
    if (!jobDoc) {
      return NextResponse.json({
        error: 'Aucune offre d\'emploi trouvée. Veuillez uploader une offre d\'emploi pour générer un quiz.'
      }, { status: 400 })
    }

    // Get text content - try database first, then extract from file
    console.log('Getting text content for documents...')

    let jobText = jobDoc.extracted_text?.trim()
    let cvText = cvDoc?.extracted_text?.trim()

    // If Job text is missing, extract from file
    if (!jobText) {
      try {
        console.log('Job text missing from database, extracting from file...')
        jobText = await extractTextFromFile(jobDoc.file_path, jobDoc.metadata?.mime_type)
        console.log('Job text extracted from file, length:', jobText.length)
      } catch (error) {
        console.error('Failed to extract Job text:', error)
        return NextResponse.json({
          error: `Impossible d'extraire le texte de l'offre d'emploi: ${error.message}`
        }, { status: 400 })
      }
    }

    // If CV text is missing and cvDoc exists, extract from file
    if (cvDoc && !cvText) {
      try {
        console.log('CV text missing from database, extracting from file...')
        cvText = await extractTextFromFile(cvDoc.file_path, cvDoc.metadata?.mime_type)
        console.log('CV text extracted from file, length:', cvText.length)
      } catch (error) {
        console.error('Failed to extract CV text:', error)
        // CV is optional, so we can continue without it
        console.log('Continuing without CV text due to extraction error')
        cvText = null
      }
    }

    // Final validation - ensure job text is not empty
    if (!jobText || jobText.length < 10) {
      return NextResponse.json({
        error: 'Le contenu de l\'offre d\'emploi est vide ou insuffisant pour générer un quiz.'
      }, { status: 400 })
    }

    console.log('Text content validated - Job length:', jobText.length, 'CV length:', cvText?.length || 0)

    // Check if GROQ API key is available
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not found in environment variables')
      return NextResponse.json({
        error: 'Configuration IA manquante - Clé API GROQ non configurée'
      }, { status: 500 })
    }

    // Build the prompt based on available documents
    let quizPrompt
    if (cvText && cvText.length > 50) {
      // Quiz based on job offer AND CV
      quizPrompt = `Génère un quiz complet de 10 questions d'entretien d'embauche basées sur cette offre d'emploi ET ce CV du candidat.

OFFRE D'EMPLOI :
---
${jobText}
---

CV DU CANDIDAT :
---
${cvText}
---

INSTRUCTIONS :
Génère EXACTEMENT 10 questions d'entretien professionnelle divisées en 2 catégories (5 questions par catégorie) :

1. QUESTIONS TECHNIQUES (5 questions) - Liées aux compétences techniques et connaissances spécifiques demandées dans l'offre d'emploi
2. QUESTIONS GÉNÉRALES/MISSION (5 questions) - Questions sur la motivation, l'adaptation au poste et à l'entreprise

Pour chaque question, fournis :
- La question elle-même
- 4 options de réponse (exactement 4)
- L'index de la réponse correcte (0, 1, 2, ou 3)
- Une réponse suggérée détaillée de 2-4 phrases (pertinente et professionnelle)

RÈGLES IMPORTANTES :
- Les questions techniques doivent être spécifiquement adaptées aux compétences demandées dans l'offre
- Les questions générales doivent être pertinentes pour le poste et l'entreprise
- Les réponses suggérées doivent être concises mais complètes
- Les 4 options doivent être plausibles et variées
- Questions en français, réponses en français
- Format JSON strict

RÉPONDS UNIQUEMENT avec un objet JSON valide contenant exactement ce format :
{
  "technical_questions": [
    {
      "question": "Question technique 1",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "suggested_answer": "Réponse suggérée détaillée 1"
    },
    ... (4 autres questions)
  ],
  "general_questions": [
    {
      "question": "Question générale 1",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "suggested_answer": "Réponse suggérée détaillée 1"
    },
    ... (4 autres questions)
  ]
}

JSON doit être valide et parsable. EXACTEMENT 5 questions par catégorie.`
    } else {
      // Quiz based on job offer only (no CV)
      quizPrompt = `Génère un quiz complet de 10 questions d'entretien d'embauche basées sur cette offre d'emploi.

OFFRE D'EMPLOI :
---
${jobText}
---

INSTRUCTIONS :
Génère EXACTEMENT 10 questions d'entretien professionnelle divisées en 2 catégories (5 questions par catégorie) :

1. QUESTIONS TECHNIQUES (5 questions) - Liées aux compétences techniques et connaissances spécifiques demandées dans l'offre d'emploi
2. QUESTIONS GÉNÉRALES/MISSION (5 questions) - Questions sur la motivation, l'adaptation au poste et à l'entreprise

Pour chaque question, fournis :
- La question elle-même
- 4 options de réponse (exactement 4)
- L'index de la réponse correcte (0, 1, 2, ou 3)
- Une réponse suggérée détaillée de 2-4 phrases (pertinente et professionnelle)

RÈGLES IMPORTANTES :
- Les questions techniques doivent être spécifiquement adaptées aux compétences demandées dans l'offre
- Les questions générales doivent être pertinentes pour le poste et l'entreprise
- Les réponses suggérées doivent être concises mais complètes
- Les 4 options doivent être plausibles et variées
- Questions en français, réponses en français
- Format JSON strict

RÉPONDS UNIQUEMENT avec un objet JSON valide contenant exactement ce format :
{
  "technical_questions": [
    {
      "question": "Question technique 1",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "suggested_answer": "Réponse suggérée détaillée 1"
    },
    ... (4 autres questions)
  ],
  "general_questions": [
    {
      "question": "Question générale 1",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "suggested_answer": "Réponse suggérée détaillée 1"
    },
    ... (4 autres questions)
  ]
}

JSON doit être valide et parsable. EXACTEMENT 5 questions par catégorie.`
    }

    console.log('Calling GROQ API for quiz generation...')
    console.log('Prompt length:', quizPrompt.length, 'characters')

    let aiResponse
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: quizPrompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 3000,
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

    // Parse JSON response
    let quizData
    try {
      // Clean the response if it has markdown code blocks
      const jsonMatch = aiResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/) || aiResponse.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : aiResponse
      quizData = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse)
      return NextResponse.json({
        error: 'Erreur de format dans la réponse de l\'IA'
      }, { status: 500 })
    }

    // Validate required fields
    const requiredFields = ['technical_questions', 'general_questions']
    for (const field of requiredFields) {
      if (!quizData[field] || !Array.isArray(quizData[field])) {
        return NextResponse.json({
          error: `Champ manquant ou invalide dans le quiz: ${field}`
        }, { status: 500 })
      }
    }

    // Validate each category has 5 questions and has options + correct_answer
    const categories = ['technical_questions', 'general_questions']
    for (const category of categories) {
      if (quizData[category].length !== 5) {
        return NextResponse.json({
          error: `La catégorie ${category} doit contenir exactement 5 questions (actuellement: ${quizData[category].length})`
        }, { status: 500 })
      }
      
      // Validate each question has options and correct_answer
      for (let i = 0; i < quizData[category].length; i++) {
        const question = quizData[category][i]
        if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
          return NextResponse.json({
            error: `La question ${i + 1} dans ${category} doit avoir exactement 4 options`
          }, { status: 500 })
        }
        if (typeof question.correct_answer !== 'number' || question.correct_answer < 0 || question.correct_answer > 3) {
          return NextResponse.json({
            error: `La question ${i + 1} dans ${category} doit avoir un correct_answer entre 0 et 3`
          }, { status: 500 })
        }
      }
    }

    console.log('Quiz generation completed successfully')

    return NextResponse.json({
      quiz: quizData,
      documents: {
        job: {
          id: jobDoc.id,
          name: jobDoc.metadata?.original_name || jobDoc.file_name,
          type: jobDoc.file_type
        },
        cv: cvDoc ? {
          id: cvDoc.id,
          name: cvDoc.metadata?.original_name || cvDoc.file_name,
          type: cvDoc.file_type
        } : null
      },
      total_questions: 10
    })

  } catch (error) {
    console.error('Quiz Generation Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de la génération du quiz',
      details: error.message
    }, { status: 500 })
  }
}
