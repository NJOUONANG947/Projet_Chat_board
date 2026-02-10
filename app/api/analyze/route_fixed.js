import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request) {
  try {
    // Create authenticated Supabase client using cookies
    const supabase = createServerComponentClient({ cookies })

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Non autorisé - Veuillez vous reconnecter' }, { status: 401 })
    }

    console.log('Authenticated user:', user.id)

    const body = await request.json()
    const { type, documentIds } = body

    if (!type || !documentIds || documentIds.length === 0) {
      return NextResponse.json({
        error: 'Type et IDs de documents requis'
      }, { status: 400 })
    }

    // Fetch documents with authenticated client
    const { data: documents, error: fetchError } = await supabase
      .from('uploaded_documents')
      .select('*')
      .in('id', documentIds)
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des documents' }, { status: 500 })
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'Documents non trouvés ou accès non autorisé' }, { status: 404 })
    }

    console.log('Found documents:', documents.length)

    if (type === 'cv_job_comparison' && documents.length === 2) {
      // Advanced CV-Job comparison with structured response and cover letter generation

      // Auto-identify CV and job offer based on content and metadata
      let cvDoc, jobDoc

      // First try to identify by file_type
      cvDoc = documents.find(d => d.file_type === 'cv')
      jobDoc = documents.find(d => d.file_type === 'job_offer')

      // If not found by type, try to identify by content analysis
      if (!cvDoc || !jobDoc) {
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
          }
        }
      }

      // If still not identified, assign first as CV, second as job
      if (!cvDoc || !jobDoc) {
        cvDoc = documents[0]
        jobDoc = documents[1]
      }

      // Validate we have text content
      const cvText = cvDoc.extracted_text?.trim()
      const jobText = jobDoc.extracted_text?.trim()

      if (!cvText || !jobText) {
        return NextResponse.json({
          error: 'Contenu textuel manquant dans un ou plusieurs documents. Assurez-vous que les fichiers ont été correctement traités.'
        }, { status: 400 })
      }

      console.log('Starting CV-Job comparison analysis...')

      // AI Analysis Prompt
      const analysisPrompt = `Analyse la compatibilité entre ce CV et cette offre d'emploi.

CV:
${cvText}

OFFRE D'EMPLOI:
${jobText}

INSTRUCTIONS:
1. Analyse la compatibilité globale (0-100%)
2. Détermine si le profil est compatible (true/false basé sur un seuil de 70%)
3. Identifie les forces du candidat par rapport à l'offre
4. Identifie les compétences/compétences manquantes
5. Si compatible, génère une lettre de motivation professionnelle personnalisée

RÉPONDS UNIQUEMENT avec un objet JSON valide dans ce format exact:
{
  "compatibility_score": 85,
  "is_compatible": true,
  "analysis": {
    "strengths": ["Force 1", "Force 2", "Force 3"],
    "missing_skills": ["Compétence manquante 1", "Compétence manquante 2"]
  },
  "cover_letter": "Contenu complet de la lettre de motivation professionnelle..."
}

RÈGLES IMPORTANTES:
- compatibility_score: nombre entier entre 0 et 100
- is_compatible: true si score >= 70, false sinon
- strengths: array de 3-5 points forts maximum
- missing_skills: array de compétences manquantes (vide si score élevé)
- cover_letter: lettre complète et professionnelle en français, personnalisée selon le CV et l'offre, avec ton captivant et moderne. NE PAS inclure si is_compatible est false.
- RÉPONDS UNIQUEMENT avec le JSON, rien d'autre.`

      console.log('Calling GROQ API for analysis...')

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: analysisPrompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3, // Lower temperature for more consistent structured output
        max_tokens: 2000,
      })

      const aiResponse = chatCompletion.choices[0]?.message?.content?.trim()

      if (!aiResponse) {
        console.error('No response from GROQ API')
        return NextResponse.json({ error: 'Erreur lors de l\'analyse IA' }, { status: 500 })
      }

      console.log('GROQ API response received, parsing JSON...')

      // Parse the JSON response
      let parsedResult
      try {
        // Clean the response in case there's extra text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        const cleanJson = jsonMatch ? jsonMatch[0] : aiResponse
        parsedResult = JSON.parse(cleanJson)
      } catch (parseError) {
        console.error('JSON parsing error:', parseError)
        console.error('AI Response:', aiResponse)
        return NextResponse.json({
          error: 'Erreur de format dans la réponse de l\'IA',
          details: 'L\'analyse IA n\'a pas retourné un format valide'
        }, { status: 500 })
      }

      // Validate the structure
      if (typeof parsedResult.compatibility_score !== 'number' ||
          typeof parsedResult.is_compatible !== 'boolean' ||
          !Array.isArray(parsedResult.analysis?.strengths) ||
          !Array.isArray(parsedResult.analysis?.missing_skills)) {
        console.error('Invalid response structure:', parsedResult)
        return NextResponse.json({
          error: 'Structure de réponse invalide',
          details: 'L\'analyse IA n\'a pas retourné la structure attendue'
        }, { status: 500 })
      }

      console.log('Analysis completed successfully:', {
        score: parsedResult.compatibility_score,
        compatible: parsedResult.is_compatible
      })

      return NextResponse.json({
        comparison: parsedResult,
        documents: {
          cv: {
            id: cvDoc.id,
            name: cvDoc.metadata?.original_name || cvDoc.file_name,
            type: cvDoc.file_type
          },
          job: {
            id: jobDoc.id,
            name: jobDoc.metadata?.original_name || jobDoc.file_name,
            type: jobDoc.file_type
          }
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
