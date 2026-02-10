import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'

class DocumentService {
  constructor() {
    this.supportedTypes = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'text/plain': 'txt'
    }
  }

  async processFile(fileBuffer, mimeType, originalName) {
    try {
      const fileType = this.supportedTypes[mimeType]
      if (!fileType) {
        throw new Error(`Unsupported file type: ${mimeType}`)
      }

      let extractedText = ''
      let metadata = {}

      switch (fileType) {
        case 'pdf':
          const pdfResult = await this.processPDF(fileBuffer)
          extractedText = pdfResult.text
          metadata = pdfResult.metadata
          break

        case 'docx':
          const docxResult = await this.processDOCX(fileBuffer)
          extractedText = docxResult.text
          metadata = docxResult.metadata
          break

        case 'txt':
          extractedText = fileBuffer.toString('utf-8')
          metadata = { type: 'text', encoding: 'utf-8' }
          break

        default:
          throw new Error(`Processing not implemented for ${fileType}`)
      }

      // Clean and validate extracted text
      const cleanedText = this.cleanExtractedText(extractedText)
      const validation = this.validateContent(cleanedText, fileType)

      return {
        success: true,
        extractedText: cleanedText,
        metadata: {
          ...metadata,
          originalName,
          mimeType,
          fileType,
          processedAt: new Date().toISOString(),
          textLength: cleanedText.length,
          validation
        }
      }
    } catch (error) {
      console.error('Document processing error:', error)
      return {
        success: false,
        error: error.message,
        metadata: {
          originalName,
          mimeType,
          processedAt: new Date().toISOString()
        }
      }
    }
  }

  async processPDF(buffer) {
    try {
      const data = await pdfParse(buffer)
      return {
        text: data.text,
        metadata: {
          pages: data.numpages,
          info: data.info,
          version: data.version,
          type: 'pdf'
        }
      }
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`)
    }
  }

  async processDOCX(buffer) {
    try {
      // Write buffer to temporary file for mammoth
      const tempPath = path.join(process.cwd(), 'temp', `temp_${Date.now()}.docx`)
      await writeFile(tempPath, buffer)

      try {
        const result = await mammoth.extractRawText({ path: tempPath })
        await unlink(tempPath)

        return {
          text: result.value,
          metadata: {
            messages: result.messages,
            type: 'docx'
          }
        }
      } catch (mammothError) {
        await unlink(tempPath)
        throw mammothError
      }
    } catch (error) {
      throw new Error(`DOCX processing failed: ${error.message}`)
    }
  }

  cleanExtractedText(text) {
    if (!text) return ''

    return text
      .replace(/\s+/g, ' ')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  validateContent(text, fileType) {
    const validation = {
      isValid: true,
      issues: [],
      score: 100
    }

    if (text.length < 50) {
      validation.issues.push('Content too short')
      validation.score -= 30
    }

    const readableChars = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').length
    const totalChars = text.length

    if (totalChars > 0 && (readableChars / totalChars) < 0.3) {
      validation.issues.push('Low readable text ratio - possible OCR issues')
      validation.score -= 20
    }

    if (text.includes('�')) {
      validation.issues.push('Encoding issues detected')
      validation.score -= 15
    }

    if (fileType === 'pdf' && text.length < 100) {
      validation.issues.push('PDF may contain images or scanned content')
      validation.score -= 25
    }

    validation.isValid = validation.score >= 60

    return validation
  }

  async analyzeDocument(extractedText, documentType, analysisType) {
    try {
      const analysis = {
        type: analysisType,
        documentType,
        timestamp: new Date().toISOString(),
        metrics: this.calculateMetrics(extractedText),
        insights: {}
      }

      if (analysisType === 'cv') {
        analysis.insights = await this.analyzeCV(extractedText)
      } else if (analysisType === 'job_offer') {
        analysis.insights = await this.analyzeJobOffer(extractedText)
      } else if (analysisType === 'general') {
        analysis.insights = await this.analyzeGeneral(extractedText)
      }

      return {
        success: true,
        analysis
      }
    } catch (error) {
      console.error('Document analysis error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  calculateMetrics(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
      readabilityScore: this.calculateReadabilityScore(text)
    }
  }

  calculateReadabilityScore(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)

    if (sentences.length === 0) return 0

    const avgWordsPerSentence = words.length / sentences.length
    const longWords = words.filter(word => word.length > 6).length
    const longWordRatio = words.length > 0 ? longWords / words.length : 0

    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * longWordRatio)
    return Math.max(0, Math.min(100, score))
  }

  async analyzeCV(text) {
    const insights = {
      sections: this.identifySections(text),
      skills: this.extractSkills(text),
      experience: this.extractExperience(text),
      education: this.extractEducation(text),
      completeness: this.assessCompleteness(text)
    }

    return insights
  }

  async analyzeJobOffer(text) {
    const insights = {
      requirements: this.extractRequirements(text),
      responsibilities: this.extractResponsibilities(text),
      benefits: this.extractBenefits(text),
      company: this.extractCompanyInfo(text)
    }

    return insights
  }

  async analyzeGeneral(text) {
    return {
      summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      keywords: this.extractKeywords(text),
      sentiment: this.analyzeSentiment(text)
    }
  }

  identifySections(text) {
    const sections = []
    const lines = text.split('\n')

    for (const line of lines) {
      const upperLine = line.toUpperCase().trim()
      if (upperLine.includes('EXPERIENCE') || upperLine.includes('EXPÉRIENCE')) {
        sections.push('experience')
      } else if (upperLine.includes('EDUCATION') || upperLine.includes('FORMATION')) {
        sections.push('education')
      } else if (upperLine.includes('SKILLS') || upperLine.includes('COMPÉTENCES')) {
        sections.push('skills')
      } else if (upperLine.includes('SUMMARY') || upperLine.includes('RÉSUMÉ')) {
        sections.push('summary')
      }
    }

    return [...new Set(sections)]
  }

  extractSkills(text) {
    const skillKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'sql', 'git',
      'communication', 'leadership', 'management', 'design', 'marketing'
    ]

    const foundSkills = skillKeywords.filter(skill =>
      text.toLowerCase().includes(skill.toLowerCase())
    )

    return [...new Set(foundSkills)]
  }

  extractExperience(text) {
    const experiencePatterns = [
      /(\d+)\s*(?:ans?|years?)/gi,
      /(\d+)\s*(?:mois|months)/gi
    ]

    const experiences = []
    for (const pattern of experiencePatterns) {
      const matches = text.match(pattern)
      if (matches) {
        experiences.push(...matches)
      }
    }

    return [...new Set(experiences)]
  }

  extractEducation(text) {
    const educationKeywords = [
      'baccalauréat', 'licence', 'master', 'doctorat', 'diplôme',
      'bachelor', 'master', 'phd', 'degree'
    ]

    return educationKeywords.filter(edu =>
      text.toLowerCase().includes(edu.toLowerCase())
    )
  }

  assessCompleteness(text) {
    const sections = this.identifySections(text)
    const requiredSections = ['experience', 'education', 'skills']
    const presentSections = requiredSections.filter(section =>
      sections.includes(section)
    )

    return Math.round((presentSections.length / requiredSections.length) * 100)
  }

  extractRequirements(text) {
    const requirements = []
    const lines = text.split('\n')

    for (const line of lines) {
      if (line.toLowerCase().includes('requis') ||
          line.toLowerCase().includes('required') ||
          line.toLowerCase().includes('must') ||
          line.includes('•') || line.includes('-')) {
        const req = line.replace(/^[•\-]\s*/, '').trim()
        if (req.length > 10) {
          requirements.push(req)
        }
      }
    }

    return requirements.slice(0, 10)
  }

  extractResponsibilities(text) {
    const responsibilities = []
    const lines = text.split('\n')

    for (const line of lines) {
      if (line.toLowerCase().includes('responsable') ||
          line.toLowerCase().includes('responsibilities') ||
          line.toLowerCase().includes('will') ||
          (line.includes('•') || line.includes('-'))) {
        const resp = line.replace(/^[•\-]\s*/, '').trim()
        if (resp.length > 10) {
          responsibilities.push(resp)
        }
      }
    }

    return responsibilities.slice(0, 10)
  }

  extractBenefits(text) {
    const benefits = []
    const benefitKeywords = [
      'salaire', 'salary', 'avantages', 'benefits', 'assurance', 'insurance',
      'vacances', 'vacation', 'formation', 'training', 'télétravail', 'remote'
    ]

    return benefitKeywords.filter(benefit =>
      text.toLowerCase().includes(benefit.toLowerCase())
    )
  }

  extractCompanyInfo(text) {
    return {
      size: text.toLowerCase().includes('startup') ? 'startup' :
            text.toLowerCase().includes('enterprise') ? 'enterprise' : 'unknown',
      industry: this.inferIndustry(text)
    }
  }

  extractKeywords(text) {
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 4)
    const wordCount = {}

    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word)
  }

  analyzeSentiment(text) {
    const positiveWords = ['excellent', 'great', 'good', 'amazing', 'fantastic', 'wonderful']
    const negativeWords = ['poor', 'bad', 'terrible', 'awful', 'horrible', 'disappointing']

    const lowerText = text.toLowerCase()
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  inferIndustry(text) {
    const industries = {
      technology: ['tech', 'software', 'digital', 'it', 'développement'],
      finance: ['finance', 'bank', 'investment', 'trading'],
      healthcare: ['health', 'medical', 'hospital', 'clinic'],
      education: ['education', 'school', 'university', 'teaching'],
      marketing: ['marketing', 'advertising', 'brand', 'campaign']
    }

    const lowerText = text.toLowerCase()

    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return industry
      }
    }

    return 'general'
  }
}

export default DocumentService
