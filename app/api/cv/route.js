import { NextResponse } from 'next/server'
import { authenticateRequest } from '../../../backend/lib/auth.js'
import PersistenceService from '../../../backend/services/PersistenceService.js'

const persistenceService = new PersistenceService()

export async function POST(request) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { cvData, title = 'Mon CV' } = body

    // Validate required data
    if (!cvData || !cvData.personal) {
      return NextResponse.json({
        error: 'Données CV manquantes'
      }, { status: 400 })
    }

    // Prepare CV data for persistence service
    const cvToSave = {
      title,
      content: cvData,
      templateId: cvData.template,
      isDraft: true,
      originalName: `${cvData.personal.firstName} ${cvData.personal.lastName}`.trim() || 'CV'
    }

    // Save CV using persistence service
    const result = await persistenceService.saveCV(auth.user.id, cvToSave)

    if (!result.success) {
      return NextResponse.json({
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      id: result.cv.id,
      message: 'CV sauvegardé avec succès'
    })

  } catch (error) {
    console.error('CV Save Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de la sauvegarde du CV'
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Get user CVs using persistence service
    const result = await persistenceService.getUserCVs(auth.user.id)

    if (!result.success) {
      return NextResponse.json({
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({ cvs: result.cvs })

  } catch (error) {
    console.error('CV Fetch Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de la récupération des CVs'
    }, { status: 500 })
  }
}

async function getOrCreateTemplate(supabase, templateId) {
  // Check if template exists
  const { data: existingTemplate } = await supabase
    .from('cv_templates')
    .select('id')
    .eq('id', templateId)
    .single()

  if (existingTemplate) {
    return existingTemplate.id
  }

  // Create default template if not exists
  const templates = {
    classic: { name: 'Classique Professionnel', style: 'classic', structure: '{}' },
    modern: { name: 'Moderne', style: 'modern', structure: '{}' },
    minimal: { name: 'Minimal', style: 'minimal', structure: '{}' },
    creative: { name: 'Créatif', style: 'creative', structure: '{}' }
  }

  const templateData = templates[templateId] || templates.modern

  const { data: newTemplate, error } = await supabase
    .from('cv_templates')
    .insert({
      id: templateId,
      name: templateData.name,
      style: templateData.style,
      structure: templateData.structure,
      is_active: true
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return newTemplate.id
}
