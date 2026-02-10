import Groq from 'groq-sdk'

class AIService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
    this.agents = new Map()
    this.initializeAgents()
  }

  initializeAgents() {
    // Register available AI agents
    this.agents.set('cv_writer', this.cvWriterAgent.bind(this))
    this.agents.set('industry_analyst', this.industryAnalystAgent.bind(this))
    this.agents.set('style_formatter', this.styleFormatterAgent.bind(this))
    this.agents.set('document_analyzer', this.documentAnalyzerAgent.bind(this))
    this.agents.set('career_advisor', this.careerAdvisorAgent.bind(this))
  }

  async orchestrateAgent(agentName, context, options = {}) {
    const agent = this.agents.get(agentName)
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`)
    }

    try {
      const result = await agent(context, options)
      return {
        success: true,
        data: result,
        agent: agentName,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Agent ${agentName} error:`, error)
      return {
        success: false,
        error: error.message,
        agent: agentName,
        timestamp: new Date().toISOString()
      }
    }
  }

  async cvWriterAgent(context, options = {}) {
    const { personalInfo, experience, education, skills, targetPosition, industry, requestType } = context

    // Handle summary-only requests
    if (requestType === 'summary_only') {
      const summaryPrompt = `
You are a professional CV writer. Create a compelling professional summary for a CV.

PERSONAL INFO: ${JSON.stringify(personalInfo)}
EXPERIENCE: ${JSON.stringify(experience)}
EDUCATION: ${JSON.stringify(education)}
SKILLS: ${JSON.stringify(skills)}

Create a professional summary (2-3 sentences) that highlights the candidate's key strengths, experience, and career goals. Make it engaging and tailored for professional opportunities.

Return only the summary text, no additional formatting or headers.
`

      const summary = await this.callAI(summaryPrompt, {
        temperature: 0.7,
        max_tokens: 200,
        ...options
      })

      return { summary: summary.trim() }
    }

    const prompt = `
You are a professional CV writer specializing in ${industry || 'various industries'}.
Create compelling CV content for a ${targetPosition} position.

PERSONAL INFO: ${JSON.stringify(personalInfo)}
EXPERIENCE: ${JSON.stringify(experience)}
EDUCATION: ${JSON.stringify(education)}
SKILLS: ${JSON.stringify(skills)}

Create professional CV content with:
1. Professional Summary (3-4 sentences)
2. Key Achievements (bullet points)
3. Skills section (categorized)
4. Professional Experience (detailed descriptions)

Focus on quantifiable achievements and industry-specific terminology.
Make it ATS-friendly and compelling for recruiters.
`

    const response = await this.callAI(prompt, {
      temperature: 0.7,
      max_tokens: 1500,
      ...options
    })

    return this.parseCVContent(response)
  }

  // ... rest of the methods remain the same
}

export default AIService
