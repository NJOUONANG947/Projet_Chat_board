import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Groq from 'groq-sdk'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { createClient } from '@supabase/supabase-js'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Helper pour extraire le texte d'un fichier
async function extractTextFromFile(filePath, mimeType) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: fileData, error } = await supabaseAdmin.storage
      .from('documents')
      .download(filePath)

    if (error) throw error

    const buffer = Buffer.from(await fileData.arrayBuffer())
    let text = ''

    if (mimeType === 'application/pdf') {
      const pdfData = await pdfParse(buffer)
      text = pdfData.text
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      text = buffer.toString('utf-8')
    }

    return text.trim()
  } catch (error) {
    console.error('Text extraction error:', error)
    throw error
  }
}

// POST - Créer un candidat et analyser son CV
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const recruiterId = session.user.id
    const formData = await request.formData()
    const file = formData.get('cv')
    const email = formData.get('email')
    const firstName = formData.get('firstName')
    const lastName = formData.get('lastName')
    const jobPostingId = formData.get('jobPostingId')

    if (!file || !email) {
      return NextResponse.json({ error: 'CV et email requis' }, { status: 400 })
    }

    // Upload du fichier CV
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const storagePath = `${recruiterId}/candidates/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file)

    if (uploadError) {
      return NextResponse.json({ error: 'Erreur upload fichier' }, { status: 500 })
    }

    // Extraction du texte
    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ''
    
    if (file.type === 'application/pdf') {
      const pdfData = await pdfParse(buffer)
      extractedText = pdfData.text
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else {
      extractedText = buffer.toString('utf-8')
    }

    // Sauvegarder le document
    const { data: document, error: docError } = await supabase
      .from('uploaded_documents')
      .insert({
        user_id: recruiterId,
        file_name: fileName,
        file_path: storagePath,
        file_type: 'cv',
        file_size: file.size,
        extracted_text: extractedText,
        metadata: {
          mime_type: file.type,
          original_name: file.name,
          extracted_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (docError) {
      return NextResponse.json({ error: 'Erreur sauvegarde document' }, { status: 500 })
    }

    // Créer le candidat
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        recruiter_id: recruiterId,
        email,
        first_name: firstName,
        last_name: lastName,
        cv_document_id: document.id
      })
      .select()
      .single()

    if (candidateError) {
      return NextResponse.json({ error: 'Erreur création candidat' }, { status: 500 })
    }

    // Analyser le CV avec LLM
    const analysisPrompt = `Analyse ce CV de manière professionnelle pour le recrutement.

CV À ANALYSER :
---
${extractedText}
---

INSTRUCTIONS :
- Analyse complète et objective du CV
- Identifie les compétences clés, l'expérience, la formation
- Évalue la qualité du CV
- Extrais les informations structurées

RÉPONDS UNIQUEMENT avec un objet JSON valide :
{
  "overall_score": nombre entre 0 et 100,
  "strengths": ["point fort 1", "point fort 2", ...],
  "weaknesses": ["point faible 1", "point faible 2", ...],
  "key_skills_detected": ["compétence 1", "compétence 2", ...],
  "experience_years": nombre,
  "education_level": "niveau de formation",
  "industry_fit": "description",
  "improvement_suggestions": ["suggestion 1", ...]
}`

    let cvAnalysis = null
    if (process.env.GROQ_API_KEY) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: analysisPrompt }],
          model: 'llama-3.1-8b-instant',
          temperature: 0.7,
          max_tokens: 2000,
        })

        const aiResponse = completion.choices[0]?.message?.content?.trim()
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          cvAnalysis = JSON.parse(jsonMatch[0])
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError)
      }
    }

    // Sauvegarder l'analyse
    if (cvAnalysis) {
      await supabase
        .from('cv_analyses')
        .insert({
          document_id: document.id,
          user_id: recruiterId,
          candidate_id: candidate.id,
          job_posting_id: jobPostingId || null,
          overall_score: cvAnalysis.overall_score,
          strengths: cvAnalysis.strengths || [],
          weaknesses: cvAnalysis.weaknesses || [],
          suggestions: cvAnalysis.improvement_suggestions || [],
          industry_fit: cvAnalysis.industry_fit,
          keywords_found: cvAnalysis.key_skills_detected || [],
          ai_insights: cvAnalysis
        })
    }

    // Si un poste est spécifié, calculer le score de pertinence pour ce poste
    if (jobPostingId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const RankingService = (await import('../../../lib/RankingService.js')).default
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        const rankingService = new RankingService(supabaseAdmin)
        await rankingService.calculateRelevanceScore(candidate.id, jobPostingId)
      } catch (err) {
        console.error('Relevance score calculation after add candidate:', err)
      }
    }

    return NextResponse.json({
      candidate,
      analysis: cvAnalysis,
      document
    })

  } catch (error) {
    console.error('Candidates API error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET - Lister les candidats
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobPostingId = searchParams.get('jobPostingId')
    const status = searchParams.get('status')

    let query = supabase
      .from('candidates')
      .select(`
        *,
        cv_document:uploaded_documents(*),
        cv_analyses(*),
        relevance_scores(*)
      `)
      .eq('recruiter_id', session.user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    let { data: candidates, error } = await query

    if (error) {
      console.warn('Candidates GET with joins failed, falling back to select(*):', error.message)
      let fallback = supabase
        .from('candidates')
        .select('*')
        .eq('recruiter_id', session.user.id)
        .order('created_at', { ascending: false })
      if (status) fallback = fallback.eq('status', status)
      const res = await fallback
      if (res.error) {
        return NextResponse.json({ error: 'Erreur récupération candidats' }, { status: 500 })
      }
      return NextResponse.json({ candidates: res.data ?? [] })
    }

    return NextResponse.json({ candidates: candidates ?? [] })

  } catch (error) {
    console.error('Candidates GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
