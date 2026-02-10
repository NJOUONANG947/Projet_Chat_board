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
        error: 'Au moins un document (CV) est requis'
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

    // Identify CV and job offer
    let cvDoc, jobDoc

    cvDoc = documents.find(d => d.file_type === 'cv')
    jobDoc = documents.find(d => d.file_type === 'job_offer')

    if (!cvDoc || !jobDoc) {
      for (const doc of documents) {
        const text = (doc.extracted_text || '').toLowerCase()
        const fileName = (doc.metadata?.original_name || doc.file_name || '').toLowerCase()

        if (!cvDoc && (
          fileName.includes('cv') ||
          fileName.includes('resume') ||
          fileName.includes('curriculum') ||
          text.includes('expérience professionnelle') ||
          text.includes('formation') ||
          text.includes('compétences')
        )) {
          cvDoc = doc
        }

        if (!jobDoc && (
          fileName.includes('offre') ||
          fileName.includes('job') ||
          fileName.includes('poste') ||
          text.includes('description du poste') ||
          text.includes('missions') ||
          text.includes('profil recherché') ||
          text.includes('nous proposons')
        )) {
          jobDoc = doc
        }
      }
    }

    if (!cvDoc) {
      return NextResponse.json({
        error: 'Aucun CV trouvé. Veuillez uploader un CV avec les mots-clés "CV", "resume" ou "curriculum" dans le nom du fichier.'
      }, { status: 400 })
    }

    // Job offer is now optional - we can generate a general CV
    console.log('CV found:', cvDoc.id, 'Job offer:', jobDoc?.id || 'none (general CV)')

    // Extract text content
    let cvText = cvDoc.extracted_text?.trim()
    let jobText = jobDoc?.extracted_text?.trim()

    if (!cvText) {
      cvText = await extractTextFromFile(cvDoc.file_path, cvDoc.metadata?.mime_type)
    }

    if (jobDoc && !jobText) {
      jobText = await extractTextFromFile(jobDoc.file_path, jobDoc.metadata?.mime_type)
    }

    if (!cvText || cvText.length < 10) {
      return NextResponse.json({
        error: 'Le contenu du CV est insuffisant pour générer un CV optimisé.'
      }, { status: 400 })
    }

    console.log('Text content validated - CV length:', cvText.length, 'Job length:', jobText?.length || 0)

    // Generate optimized CV
    let generationPrompt
    if (jobText && jobText.length > 10) {
      // Personalized CV with job offer
      generationPrompt = `Tu es un expert en recrutement et optimisation de CV.

Voici le CV ORIGINAL du candidat :
---
${cvText}
---

Voici l'OFFRE D'EMPLOI ciblée :
---
${jobText}
---

🎯 TA MISSION :
Adapte et optimise ce CV pour qu'il corresponde parfaitement à l'offre d'emploi.

📌 INSTRUCTIONS :
1. Analyse les compétences et expériences demandées dans l'offre
2. Réorganise le CV pour mettre en avant les éléments les plus pertinents
3. Utilise les mots-clés de l'offre d'emploi
4. Optimise la présentation pour passer les filtres ATS
5. Garde toutes les informations réelles du CV original
6. Structure professionnelle : En-tête, Expériences, Formation, Compétences, etc.

RÉPONDS UNIQUEMENT avec le CV optimisé au format JSON :
{
  "personal_info": {
    "name": "Nom complet",
    "title": "Titre professionnel adapté à l'offre",
    "contact": "email et téléphone si disponibles",
    "location": "ville si disponible"
  },
  "professional_summary": "Résumé professionnel optimisé (2-3 phrases)",
  "experience": [
    {
      "position": "Poste occupé",
      "company": "Nom de l'entreprise",
      "period": "Période (format: Mois Année - Mois Année)",
      "description": "Description optimisée avec mots-clés de l'offre"
    }
  ],
  "education": [
    {
      "degree": "Diplôme obtenu",
      "school": "Établissement",
      "year": "Année d'obtention"
    }
  ],
  "skills": ["Compétence 1", "Compétence 2", "Compétence 3"],
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3"]
}`
    } else {
      // General CV optimization
      generationPrompt = `Tu es un expert en recrutement et optimisation de CV.

Voici le CV ORIGINAL du candidat :
---
${cvText}
---

🎯 TA MISSION :
Optimise ce CV pour qu'il soit plus attractif et professionnel.

📌 INSTRUCTIONS :
1. Améliore la structure et la présentation
2. Renforce les formulations pour qu'elles soient plus impactantes
3. Organise les informations de manière logique
4. Utilise un langage professionnel et moderne
5. Garde toutes les informations réelles du CV original
6. Structure professionnelle : En-tête, Expériences, Formation, Compétences, etc.

RÉPONDS UNIQUEMENT avec le CV optimisé au format JSON :
{
  "personal_info": {
    "name": "Nom complet",
    "title": "Titre professionnel approprié",
    "contact": "email et téléphone si disponibles",
    "location": "ville si disponible"
  },
  "professional_summary": "Résumé professionnel optimisé (2-3 phrases)",
  "experience": [
    {
      "position": "Poste occupé",
      "company": "Nom de l'entreprise",
      "period": "Période (format: Mois Année - Mois Année)",
      "description": "Description optimisée et professionnelle"
    }
  ],
  "education": [
    {
      "degree": "Diplôme obtenu",
      "school": "Établissement",
      "year": "Année d'obtention"
    }
  ],
  "skills": ["Compétence 1", "Compétence 2", "Compétence 3"],
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3"]
}`
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        error: 'Configuration IA manquante'
      }, { status: 500 })
    }

    console.log('Starting CV generation...')
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: generationPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 3000,
    })

    const aiResponse = chatCompletion.choices[0]?.message?.content?.trim()

    if (!aiResponse) {
      return NextResponse.json({ error: 'Réponse vide de l\'IA' }, { status: 500 })
    }

    console.log('CV generation completed, parsing response...')

    // Parse JSON response
    let cvData
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      const cleanJson = jsonMatch ? jsonMatch[0] : aiResponse
      cvData = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('AI Response:', aiResponse)
      return NextResponse.json({
        error: 'Erreur de format dans la réponse de l\'IA',
        details: 'L\'IA n\'a pas retourné un format JSON valide'
      }, { status: 500 })
    }

    // Now generate cover letter automatically
    console.log('CV generated successfully, now generating cover letter...')

    let coverLetterPrompt
    if (jobText && jobText.length > 10) {
      // Personalized cover letter
      coverLetterPrompt = `Génère une lettre de motivation professionnelle et captivante.

Voici le CV du candidat :
---
${cvText}
---

Voici l'OFFRE D'EMPLOI :
---
${jobText}
---

INSTRUCTIONS :
- Rédige une lettre de motivation complète et professionnelle en français
- Adapte le contenu au CV et aux exigences de l'offre d'emploi
- Utilise un ton moderne, captivant et professionnel
- Structure la lettre avec les éléments classiques : introduction, corps, conclusion
- Personnalise avec des éléments spécifiques du CV et de l'offre
- Longueur : 250-400 mots
- Format : texte brut, prêt à copier-coller

RÈGLES IMPORTANTES :
- Lettre complète avec en-tête, salutation, corps et formule de politesse
- Ton professionnel mais engageant
- Mise en valeur des expériences et compétences pertinentes
- RÉPONDS UNIQUEMENT avec le texte de la lettre de motivation, rien d'autre.`
    } else {
      // General cover letter
      coverLetterPrompt = `Génère une lettre de motivation professionnelle et intelligente.

Voici le CV du candidat :
---
${cvText}
---

INSTRUCTIONS :
- Rédige une lettre de motivation générale mais personnalisée selon le profil du CV
- Utilise un ton moderne, captivant et professionnel
- Structure la lettre avec les éléments classiques : introduction, corps, conclusion
- Adapte le contenu aux expériences et compétences principales du candidat
- Longueur : 250-400 mots
- Format : texte brut, prêt à copier-coller

RÈGLES IMPORTANTES :
- Lettre complète avec en-tête générique, salutation, corps et formule de politesse
- Ton professionnel mais engageant
- Mise en valeur des expériences et compétences clés
- Adaptable à différents types de postes
- RÉPONDS UNIQUEMENT avec le texte de la lettre de motivation, rien d'autre.`
    }

    const coverLetterCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: coverLetterPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 2000,
    })

    const coverLetterResponse = coverLetterCompletion.choices[0]?.message?.content?.trim()

    console.log('Cover letter generation completed')

    return NextResponse.json({
      optimized_cv: cvData,
      cover_letter: coverLetterResponse || 'Erreur lors de la génération de la lettre de motivation',
      documents: {
        cv: {
          id: cvDoc.id,
          name: cvDoc.metadata?.original_name || cvDoc.file_name
        },
        job: jobDoc ? {
          id: jobDoc.id,
          name: jobDoc.metadata?.original_name || jobDoc.file_name
        } : null
      }
    })

  } catch (error) {
    console.error('CV Generation Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de la génération du CV',
      details: error.message
    }, { status: 500 })
  }
}
