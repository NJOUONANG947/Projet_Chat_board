import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }
  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return null
  }
  return user
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const body = await request.json()
    const { name, education, experiences, skills, targetPosition } = body

    // Validate required fields
    if (!education || !experiences || !skills || !targetPosition) {
      return NextResponse.json({
        error: 'Les champs formation, expériences, compétences et poste visé sont obligatoires'
      }, { status: 400 })
    }

    // Create structured prompt for AI
    const prompt = `
Générez un profil professionnel complet pour cette personne :

NOM: ${name || 'Non spécifié'}
FORMATION: ${education}
EXPÉRIENCES: ${experiences}
COMPÉTENCES: ${skills}
POSTE VISÉ: ${targetPosition}

Veuillez fournir une réponse structurée avec exactement ces 3 sections :

1. CV - Rédigez un CV professionnel avec les sections suivantes :
   - Profil professionnel
   - Formation
   - Expériences professionnelles
   - Compétences
   - Objectif professionnel

2. LETTRE - Rédigez une lettre de motivation pour le poste visé

3. CONSEILS - Donnez 5 conseils concrets pour améliorer ses chances d'obtenir ce poste

Format de réponse attendu :
CV:
[contenu du CV]

LETTRE:
[contenu de la lettre]

CONSEILS:
[liste des conseils]
`

    // Generate AI response
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 2000,
    })

    const aiResponse = chatCompletion.choices[0]?.message?.content || 'Erreur de génération'

    // Parse the AI response to extract CV, letter, and suggestions
    const cvMatch = aiResponse.match(/CV:\s*([\s\S]*?)(?=LETTRE:|$)/i)
    const letterMatch = aiResponse.match(/LETTRE:\s*([\s\S]*?)(?=CONSEILS:|$)/i)
    const suggestionsMatch = aiResponse.match(/CONSEILS:\s*([\s\S]*)$/i)

    const generatedCV = cvMatch ? cvMatch[1].trim() : 'CV non généré'
    const generatedLetter = letterMatch ? letterMatch[1].trim() : 'Lettre non générée'
    const suggestions = suggestionsMatch ? suggestionsMatch[1].trim() : 'Conseils non générés'

    // Save to Supabase
    const { data: careerProfile, error } = await supabase
      .from('user_cvs')
      .insert({
        user_id: user.id,
        title: `CV - ${targetPosition}`,
        content: {
          name,
          education,
          experiences,
          skills,
          targetPosition
        },
        generated_content: generatedCV,
        is_draft: false
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Failed to save career profile')
    }

    return NextResponse.json({
      id: careerProfile.id,
      cv: generatedCV,
      letter: generatedLetter,
      suggestions,
      createdAt: careerProfile.created_at,
    })

  } catch (error) {
    console.error('Career API Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de la génération du profil professionnel'
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: profiles, error } = await supabase
      .from('user_cvs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Failed to fetch career profiles')
    }

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Error fetching career profiles:', error)
    return NextResponse.json({
      error: 'Erreur lors de la récupération des profils'
    }, { status: 500 })
  }
}
