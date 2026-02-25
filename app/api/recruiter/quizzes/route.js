import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// POST - Générer un quiz personnalisé
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      jobPostingId,
      title,
      description,
      quizType = 'mixed', // 'qcm', 'open', 'case-study', 'mixed'
      numQuestions = 10,
      settings = {}
    } = body

    if (!jobPostingId) {
      return NextResponse.json({ error: 'ID du poste requis' }, { status: 400 })
    }

    // Récupérer les informations du poste
    const { data: jobPosting, error: jobError } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', jobPostingId)
      .eq('recruiter_id', session.user.id)
      .single()

    if (jobError || !jobPosting) {
      return NextResponse.json({ error: 'Poste non trouvé' }, { status: 404 })
    }

    // Générer le quiz avec l'IA
    const quizPrompt = buildQuizPrompt(jobPosting, quizType, numQuestions)

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Configuration IA manquante' }, { status: 500 })
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: quizPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 4000,
    })

    const aiResponse = completion.choices[0]?.message?.content?.trim()
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Format de réponse IA invalide' }, { status: 500 })
    }

    const quizData = JSON.parse(jsonMatch[0])

    // Sauvegarder le quiz en mode brouillon (is_active: false) pour prévisualisation
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        recruiter_id: session.user.id,
        job_posting_id: jobPostingId,
        title: title || `Quiz - ${jobPosting.title}`,
        description: description || `Quiz technique pour ${jobPosting.title}`,
        quiz_type: quizType,
        questions: quizData.questions || [],
        is_active: false, // Par défaut en brouillon, le recruteur doit approuver
        settings: {
          num_questions: numQuestions,
          time_limit: settings.timeLimit || null,
          passing_score: settings.passingScore || 70,
          ...settings
        }
      })
      .select()
      .single()

    if (quizError) {
      console.error('Quiz creation error:', quizError)
      return NextResponse.json({ error: 'Erreur création quiz' }, { status: 500 })
    }

    return NextResponse.json({ quiz })

  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json({ error: 'Erreur génération quiz' }, { status: 500 })
  }
}

// GET - Lister les quiz
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobPostingId = searchParams.get('jobPostingId')

    let query = supabase
      .from('quizzes')
      .select(`
        *,
        job_posting:job_postings(title),
        quiz_results(count)
      `)
      .eq('recruiter_id', session.user.id)
      .order('created_at', { ascending: false })

    if (jobPostingId) {
      query = query.eq('job_posting_id', jobPostingId)
    }

    const { data: quizzes, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Erreur récupération quiz' }, { status: 500 })
    }

    return NextResponse.json({ quizzes: quizzes || [] })

  } catch (error) {
    console.error('Quizzes GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Helper pour construire le prompt selon le type de quiz
function buildQuizPrompt(jobPosting, quizType, numQuestions) {
  const basePrompt = `Génère un quiz d'entretien professionnel basé sur cette offre d'emploi.

OFFRE D'EMPLOI :
---
Titre: ${jobPosting.title}
Description: ${jobPosting.description}
Compétences requises: ${(jobPosting.required_skills || []).join(', ')}
Expérience requise: ${jobPosting.required_experience || 'Non spécifiée'} ans
---

INSTRUCTIONS :
Génère EXACTEMENT ${numQuestions} questions adaptées à ce poste.`

  const typePrompts = {
    qcm: `
FORMAT : Questions à choix multiples uniquement
Chaque question doit avoir :
- question: "Texte de la question"
- type: "qcm"
- options: ["Option A", "Option B", "Option C", "Option D"]
- correct_answer: index (0-3)
- explanation: "Explication de la bonne réponse"
- difficulty: "easy" | "medium" | "hard"`,

    open: `
FORMAT : Questions ouvertes uniquement
Chaque question doit avoir :
- question: "Texte de la question"
- type: "open"
- expected_keywords: ["mot-clé 1", "mot-clé 2", ...]
- sample_answer: "Exemple de bonne réponse"
- difficulty: "easy" | "medium" | "hard"`,

    'case-study': `
FORMAT : Mini-cas pratiques uniquement
Chaque question doit avoir :
- question: "Description du cas pratique/scénario"
- type: "case-study"
- context: "Contexte détaillé"
- expected_approach: "Approche attendue"
- evaluation_criteria: ["critère 1", "critère 2", ...]
- difficulty: "easy" | "medium" | "hard"`,

    mixed: `
FORMAT : Mixte (QCM, ouvertes, cas pratiques)
Répartis les questions ainsi :
- 50% QCM (questions techniques)
- 30% Questions ouvertes (compréhension)
- 20% Mini-cas pratiques (mise en situation)

Pour QCM :
- question, type: "qcm", options, correct_answer, explanation

Pour questions ouvertes :
- question, type: "open", expected_keywords, sample_answer

Pour cas pratiques :
- question, type: "case-study", context, expected_approach, evaluation_criteria`
  }

  const typePrompt = typePrompts[quizType] || typePrompts.mixed

  return `${basePrompt}

${typePrompt}

RÉPONDS UNIQUEMENT avec un objet JSON valide :
{
  "questions": [
    {
      "question": "...",
      "type": "...",
      ...
    }
  ]
}

RÈGLES :
- Questions en français
- Adaptées au niveau du poste
- Variées en difficulté
- Pertinentes pour les compétences requises
- JSON valide et parsable`
}
