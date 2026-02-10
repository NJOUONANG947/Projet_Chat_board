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
    }

    return NextResponse.json({ analysis })

  } catch (error) {
    console.error('Analysis Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de l\'analyse'
    }, { status: 500 })
  }
}
