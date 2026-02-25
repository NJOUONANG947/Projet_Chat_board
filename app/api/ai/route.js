import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { authenticateRequest } = await import('../../../backend/lib/auth.js')
    const AIService = (await import('../../../backend/services/AIService.js')).default

    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const aiService = new AIService()
    const body = await request.json()
    const { agent, context, options = {} } = body

    if (!agent || !context) {
      return NextResponse.json({
        error: 'Agent et contexte requis'
      }, { status: 400 })
    }

    const result = await aiService.orchestrateAgent(agent, context, options)

    if (!result.success) {
      return NextResponse.json({
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      content: result.data,
      agent: result.agent,
      timestamp: result.timestamp
    })

  } catch (error) {
    console.error('AI Orchestration Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de l\'orchestration IA'
    }, { status: 500 })
  }
}
