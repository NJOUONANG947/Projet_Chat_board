import AIService from './AIService.js'

class CVService {
  constructor() {
    this.aiService = new AIService()
  }

  async generateCV(userData, options = {}) {
    try {
      const pipeline = [
        this.analyzeInput.bind(this),
        this.adaptToIndustry.bind(this),
        this.enhanceContent.bind(this),
        this.applyStyling.bind(this),
        this.qualityAssurance.bind(this)
      ]

      let cvData = { ...userData }

      for (const step of pipeline) {
        cvData = await step(cvData, options)
        if (cvData.error) {
          throw new Error(`Pipeline step failed: ${cvData.error}`)
        }
      }

      return {
        success: true,
        cv: cvData,
        metadata: {
          generatedAt: new Date().toISOString(),
          pipeline: 'advanced',
          version: '2.0'
        }
      }
    } catch (error) {
      console.error('CV Generation Error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async analyzeInput(userData, options) {
    // Step 1: Analyze and structure input data
    const { personal, experience, education, skills, targetPosition } = userData

    // Validate required fields
    if (!personal || !experience || !skills || !targetPosition) {
      return { ...userData, error: 'Missing required fields' }
    }

    // Extract industry from target position
    const industry = this.inferIndustry(targetPosition)

    return {
      ...userData,
      industry,
      analysis: {
        completeness: this.calculateCompleteness(userData),
        industry: industry,
        experienceLevel: this.assessExperienceLevel(experience)
      }
    }
  }

  async adaptToIndustry(userData, options) {
    // Step 2: Adapt content for specific industry
    const { industry, experience, skills, targetPosition } = userData

    const industryContext = {
      industry,
      targetPosition,
      currentContent: JSON.stringify({ experience, skills })
    }

    const industryAnalysis = await this.aiService.orchestrateAgent(
      'industry_analyst',
      industryContext,
      { max_tokens: 600 }
    )

    if (!industryAnalysis.success) {
      return { ...userData, error: 'Industry analysis failed' }
    }

    return {
      ...userData,
      industryAdaptation: {
        keywords: this.extractKeywords(industryAnalysis.data),
        recommendedSkills: this.extractSkills(industryAnalysis.data),
        tailoring: industryAnalysis.data
      }
    }
  }

  async enhanceContent(userData, options) {
    // Step 3: Enhance content with AI writing
    const { personal, experience, education, skills, targetPosition, industry } = userData

    const writerContext = {
      personalInfo: personal,
      experience,
      education,
      skills,
      targetPosition,
      industry
    }

    const cvContent = await this.aiService.orchestrateAgent(
      'cv_writer',
      writerContext,
      { max_tokens: 1500 }
    )

    if (!cvContent.success) {
      return { ...userData, error: 'Content enhancement failed' }
    }

    return {
      ...userData,
      enhancedContent: cvContent.data,
      rawContent: cvContent.data
    }
  }

  async applyStyling(userData, options) {
    // Step 4: Apply professional styling and formatting
    const { enhancedContent, template = 'modern' } = userData
    const style = options.style || 'professional'

    const stylingContext = {
      content: typeof enhancedContent === 'string'
        ? enhancedContent
        : JSON.stringify(enhancedContent),
      style,
      template
    }

    const formattedContent = await this.aiService.orchestrateAgent(
      'style_formatter',
      stylingContext,
      { max_tokens: 1200, temperature: 0.3 }
    )

    if (!formattedContent.success) {
      return { ...userData, error: 'Styling failed' }
    }

    return {
      ...userData,
      formattedContent: formattedContent.data,
      template,
      style
    }
  }

  async qualityAssurance(userData, options) {
    // Step 5: Final quality check and optimization
    const { formattedContent, targetPosition, industry } = userData

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(userData)

    // Generate final optimizations
    const optimizations = await this.generateOptimizations(userData)

    return {
      ...userData,
      finalContent: formattedContent,
      qualityScore,
      optimizations,
      readyForExport: true
    }
  }

  inferIndustry(targetPosition) {
    const industries = {
      'développeur': 'technology',
      'ingénieur': 'engineering',
      'designer': 'design',
      'manager': 'management',
      'consultant': 'consulting',
      'analyste': 'analytics',
      'chef': 'management',
      'directeur': 'executive',
      'technicien': 'technical',
      'commercial': 'sales'
    }

    const position = targetPosition.toLowerCase()
    for (const [key, industry] of Object.entries(industries)) {
      if (position.includes(key)) {
        return industry
      }
    }

    return 'general'
  }

  calculateCompleteness(userData) {
    const required = ['personal', 'experience', 'skills', 'targetPosition']
    const present = required.filter(field => userData[field] && userData[field].length > 0)
    return Math.round((present.length / required.length) * 100)
  }

  assessExperienceLevel(experience) {
    if (!experience || experience.length === 0) return 'entry'

    const totalYears = experience.reduce((total, exp) => {
      const duration = exp.duration || exp.endDate - exp.startDate
      return total + (duration / 12) // Convert to years
    }, 0)

    if (totalYears < 2) return 'entry'
    if (totalYears < 5) return 'junior'
    if (totalYears < 10) return 'mid'
    return 'senior'
  }

  extractKeywords(text) {
    // Simple keyword extraction - can be enhanced with NLP
    const commonKeywords = [
      'leadership', 'management', 'development', 'design', 'analysis',
      'communication', 'teamwork', 'project', 'strategy', 'innovation'
    ]

    return commonKeywords.filter(keyword =>
      text.toLowerCase().includes(keyword)
    )
  }

  extractSkills(text) {
    // Extract skills from AI response
    const skills = []
    const lines = text.split('\n')

    for (const line of lines) {
      if (line.toLowerCase().includes('skill') ||
          line.toLowerCase().includes('compétence') ||
          line.includes('-')) {
        const skill = line.replace(/^[-•*]\s*/, '').trim()
        if (skill.length > 2) {
          skills.push(skill)
        }
      }
    }

    return skills.slice(0, 10) // Limit to top 10
  }

  calculateQualityScore(userData) {
    let score = 50 // Base score

    // Completeness bonus
    if (userData.analysis?.completeness >= 80) score += 15
    else if (userData.analysis?.completeness >= 60) score += 10

    // Industry adaptation bonus
    if (userData.industryAdaptation) score += 10

    // Content enhancement bonus
    if (userData.enhancedContent) score += 10

    // Formatting bonus
    if (userData.formattedContent) score += 10

    // Experience level bonus
    const expLevel = userData.analysis?.experienceLevel
    if (expLevel === 'senior') score += 5
    else if (expLevel === 'mid') score += 3

    return Math.min(score, 100)
  }

  async generateOptimizations(userData) {
    // Generate final optimization suggestions
    const optimizations = []

    if (userData.qualityScore < 80) {
      optimizations.push('Consider adding more quantifiable achievements')
    }

    if (!userData.industryAdaptation?.keywords?.length) {
      optimizations.push('Add more industry-specific keywords')
    }

    if (userData.analysis?.completeness < 100) {
      optimizations.push('Complete missing profile sections for better results')
    }

    return optimizations
  }
}

export default CVService
