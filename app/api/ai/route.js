import { NextResponse } from 'next/server'
import { authenticateRequest } from '../../../backend/lib/auth.js'
import AIService from '../../../backend/services/AIService.js'

const aiService = new AIService()

export async function POST(request) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { agent, context, options = {} } = body

    if (!agent || !context) {
      return NextResponse.json({
        error: 'Agent et contexte requis'
      }, { status: 400 })
    }

    // Use AI service to orchestrate the agent
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
