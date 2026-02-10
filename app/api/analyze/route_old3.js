import { NextResponse } from 'next/server'
import { supabase } from '../../../backend/lib/supabase'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { type, documentIds } = body

    if (!type || !documentIds || documentIds.length === 0) {
      return NextResponse.json({
        error: 'Type et IDs de documents requis'
      }, { status: 400 })
    }

    // Fetch documents
    const { data: documents, error: fetchError } = await supabase
      .from('uploaded_documents')
      .select('*')
      .in('id', documentIds)
      .eq('user_id', user.id)

    if (fetchError || !documents) {
      return NextResponse.json({ error: 'Documents non trouvés' }, { status: 404 })
    }

    let analysis = ''

    if (type === 'cv_analysis') {
      // Analyze CV
      const cv = documents[0]
      const prompt = `Analyse ce CV et donne des suggestions d'amélioration:

CV: ${cv.extracted_text}

Fournis une analyse structurée avec:
1. Points forts
2. Points à améliorer
3. Suggestions concrètes
4. Score global sur 10`

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 800,
      })

      analysis = chatCompletion.choices[0]?.message?.content || 'Analyse non disponible'

    } else if (type === 'job_analysis') {
      // Analyze job offer
      const job = documents[0]
      const prompt = `Analyse cette offre d'emploi et extrait les informations clés:

Offre: ${job.extracted_text}

Fournis:
1. Poste proposé
2. Entreprise
3. Compétences requises
4. Expérience demandée
5. Avantages mentionnés`

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 600,
      })

      analysis = chatCompletion.choices[0]?.message?.content || 'Analyse non disponible'

    } else if (type === 'cv_job_match' && documents.length === 2) {
      // Compare CV and job offer
      const cv = documents.find(d => d.file_type === 'cv')
      const job = documents.find(d => d.file_type === 'job_offer')

      if (!cv || !job) {
        return NextResponse.json({ error: 'CV et offre d\'emploi requis pour la comparaison' }, { status: 400 })
      }

      const prompt = `Compare ce CV avec cette offre d'emploi et donne un pourcentage de correspondance:

CV: ${cv.extracted_text}

Offre d'emploi: ${job.extracted_text}

Fournis:
1. Pourcentage de correspondance global
2. Compétences matching
3. Compétences manquantes
4. Expérience correspondante
5. Recommandations pour améliorer le matching`

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 1000,
      })

      analysis = chatCompletion.choices[0]?.message?.content || 'Comparaison non disponible'

    } else if (type === 'cv_job_comparison' && documents.length === 2) {
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

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: analysisPrompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3, // Lower temperature for more consistent structured output
        max_tokens: 2000,
      })

      const aiResponse = chatCompletion.choices[0]?.message?.content?.trim()

      if (!aiResponse) {
        return NextResponse.json({ error: 'Erreur lors de l\'analyse IA' }, { status: 500 })
      }

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

    return NextResponse.json({ analysis })

  } catch (error) {
    console.error('Analysis Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de l\'analyse'
    }, { status: 500 })
  }
}
