/**
 * Service de classement intelligent des candidats
 * Calcule les scores de pertinence et classe les candidats selon des critères configurables
 */

class RankingService {
  constructor(supabase) {
    this.supabase = supabase
  }

  /**
   * Calcule le score de pertinence d'un candidat pour un poste
   * @param {string} candidateId - ID du candidat
   * @param {string} jobPostingId - ID du poste
   * @param {object} weights - Pondération {skills: 0.3, experience: 0.2, quiz: 0.3, cv_quality: 0.2}
   * @returns {Promise<object>} Score de pertinence calculé
   */
  async calculateRelevanceScore(candidateId, jobPostingId, weights = null) {
    try {
      // Récupérer les données nécessaires
      const [candidate, jobPosting, cvAnalysisResult, quizResults] = await Promise.all([
        this.supabase.from('candidates').select('*').eq('id', candidateId).single(),
        this.supabase.from('job_postings').select('*').eq('id', jobPostingId).single(),
        this.supabase.from('cv_analyses').select('*').eq('candidate_id', candidateId).eq('job_posting_id', jobPostingId).maybeSingle(),
        this.supabase.from('quiz_results').select('*').eq('candidate_id', candidateId).order('completed_at', { ascending: false }).limit(1).maybeSingle()
      ])

      const cvAnalysis = cvAnalysisResult.data ?? (await this.supabase.from('cv_analyses').select('*').eq('candidate_id', candidateId).order('created_at', { ascending: false }).limit(1).maybeSingle()).data

      if (!candidate.data || !jobPosting.data) {
        throw new Error('Candidat ou poste non trouvé')
      }

      // Pondération par défaut
      const defaultWeights = {
        skills: 0.35,
        experience: 0.25,
        quiz: 0.25,
        cv_quality: 0.15
      }
      const finalWeights = weights || defaultWeights

      // 1. Score de compétences (skills)
      const skillsScore = this.calculateSkillsScore(
        cvAnalysis?.keywords_found || [],
        jobPosting.data.required_skills || []
      )

      // 2. Score d'expérience
      const experienceScore = this.calculateExperienceScore(
        cvAnalysis?.ai_insights?.experience_years || 0,
        jobPosting.data.required_experience || 0
      )

      // 3. Score du quiz
      const quizScore = quizResults.data?.score ?? 0

      // 4. Score de qualité du CV
      const cvQualityScore = cvAnalysis?.overall_score ?? 50

      // Calcul du score global pondéré
      const overallScore = (
        skillsScore * finalWeights.skills +
        experienceScore * finalWeights.experience +
        quizScore * finalWeights.quiz +
        cvQualityScore * finalWeights.cv_quality
      )

      // Sauvegarder le score
      const { data: relevanceScore, error } = await this.supabase
        .from('relevance_scores')
        .upsert({
          candidate_id: candidateId,
          job_posting_id: jobPostingId,
          recruiter_id: candidate.data.recruiter_id,
          overall_score: Math.round(overallScore * 100) / 100,
          skills_score: Math.round(skillsScore * 100) / 100,
          experience_score: Math.round(experienceScore * 100) / 100,
          quiz_score: Math.round(quizScore * 100) / 100,
          cv_quality_score: Math.round(cvQualityScore * 100) / 100,
          weights: finalWeights
        }, {
          onConflict: 'candidate_id,job_posting_id'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        ...relevanceScore,
        breakdown: {
          skills: { score: skillsScore, weight: finalWeights.skills },
          experience: { score: experienceScore, weight: finalWeights.experience },
          quiz: { score: quizScore, weight: finalWeights.quiz },
          cv_quality: { score: cvQualityScore, weight: finalWeights.cv_quality }
        }
      }

    } catch (error) {
      console.error('Relevance score calculation error:', error)
      throw error
    }
  }

  /**
   * Calcule le score de correspondance des compétences
   */
  calculateSkillsScore(candidateSkills, requiredSkills) {
    if (!requiredSkills || requiredSkills.length === 0) return 100
    if (!candidateSkills || candidateSkills.length === 0) return 0

    // Normaliser les compétences (lowercase, trim)
    const normalizedRequired = requiredSkills.map(s => s.toLowerCase().trim())
    const normalizedCandidate = candidateSkills.map(s => s.toLowerCase().trim())

    // Compter les correspondances
    const matches = normalizedRequired.filter(req => 
      normalizedCandidate.some(cand => 
        cand.includes(req) || req.includes(cand)
      )
    ).length

    // Score basé sur le pourcentage de correspondance
    return (matches / normalizedRequired.length) * 100
  }

  /**
   * Calcule le score d'expérience
   */
  calculateExperienceScore(candidateYears, requiredYears) {
    if (!requiredYears || requiredYears === 0) return 100
    if (!candidateYears || candidateYears === 0) return 0

    if (candidateYears >= requiredYears) {
      return 100 // Expérience suffisante ou supérieure
    } else {
      // Score proportionnel avec pénalité
      const ratio = candidateYears / requiredYears
      return Math.max(0, ratio * 80) // Max 80% si expérience insuffisante
    }
  }

  /**
   * Classe tous les candidats pour un poste
   * @param {string} jobPostingId - ID du poste
   * @param {object} weights - Pondération optionnelle
   * @returns {Promise<array>} Liste classée des candidats
   */
  async rankCandidatesForJob(jobPostingId, weights = null) {
    try {
      // Récupérer tous les candidats associés au poste
      const { data: candidates, error: candidatesError } = await this.supabase
        .from('candidates')
        .select('id')
        .eq('recruiter_id', (await this.supabase.from('job_postings').select('recruiter_id').eq('id', jobPostingId).single()).data.recruiter_id)

      if (candidatesError) throw candidatesError

      // Calculer les scores pour tous les candidats
      const scores = await Promise.all(
        candidates.map(candidate => 
          this.calculateRelevanceScore(candidate.id, jobPostingId, weights)
            .catch(err => {
              console.error(`Error calculating score for candidate ${candidate.id}:`, err)
              return null
            })
        )
      )

      // Filtrer les scores valides et trier
      const validScores = scores.filter(s => s !== null)
      validScores.sort((a, b) => b.overall_score - a.overall_score)

      // Mettre à jour les classements
      const rankings = await Promise.all(
        validScores.map((score, index) =>
          this.supabase
            .from('candidate_rankings')
            .upsert({
              job_posting_id: jobPostingId,
              recruiter_id: score.recruiter_id,
              candidate_id: score.candidate_id,
              rank_position: index + 1,
              relevance_score_id: score.id
            }, {
              onConflict: 'job_posting_id,candidate_id'
            })
        )
      )

      return validScores.map((score, index) => ({
        rank: index + 1,
        candidate_id: score.candidate_id,
        overall_score: score.overall_score,
        breakdown: score.breakdown
      }))

    } catch (error) {
      console.error('Ranking error:', error)
      throw error
    }
  }

  /**
   * Récupère le classement actuel pour un poste
   */
  async getRankingForJob(jobPostingId) {
    try {
      const { data: rankings, error } = await this.supabase
        .from('candidate_rankings')
        .select(`
          *,
          candidate:candidates(*),
          relevance_score:relevance_scores(*)
        `)
        .eq('job_posting_id', jobPostingId)
        .order('rank_position', { ascending: true })

      if (error) throw error

      return rankings || []

    } catch (error) {
      console.error('Get ranking error:', error)
      throw error
    }
  }
}

export default RankingService
