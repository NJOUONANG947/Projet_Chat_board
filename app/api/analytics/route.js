import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = session.user

    // Get application statistics
    const { data: applications, error: appsError } = await supabase
      .from('job_applications')
      .select('application_status, applied_date, created_at')
      .eq('user_id', user.id)

    if (appsError) {
      console.error('Error fetching applications:', appsError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des statistiques' }, { status: 500 })
    }

    // Get CV statistics
    const { data: cvs, error: cvsError } = await supabase
      .from('user_cvs')
      .select('created_at, is_draft')
      .eq('user_id', user.id)

    if (cvsError) {
      console.error('Error fetching CVs:', cvsError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des statistiques CV' }, { status: 500 })
    }

    // Get CV analyses
    const { data: analyses, error: analysesError } = await supabase
      .from('cv_analyses')
      .select('overall_score, created_at')
      .eq('user_id', user.id)

    if (analysesError) {
      console.error('Error fetching analyses:', analysesError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des analyses' }, { status: 500 })
    }

    // Calculate statistics
    const totalApplications = applications?.length || 0
    const statusCounts = {
      saved: 0,
      applied: 0,
      interview: 0,
      rejected: 0,
      accepted: 0
    }

    applications?.forEach(app => {
      statusCounts[app.application_status] = (statusCounts[app.application_status] || 0) + 1
    })

    const totalCVs = cvs?.length || 0
    const publishedCVs = cvs?.filter(cv => !cv.is_draft).length || 0

    const avgScore = analyses?.length > 0
      ? Math.round(analyses.reduce((sum, analysis) => sum + (analysis.overall_score || 0), 0) / analyses.length)
      : 0

    // Monthly application trend (last 6 months)
    const monthlyData = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      const count = applications?.filter(app => {
        const appDate = new Date(app.applied_date || app.created_at)
        return appDate.getMonth() === date.getMonth() && appDate.getFullYear() === date.getFullYear()
      }).length || 0
      monthlyData.push({ month: monthName, applications: count })
    }

    // Success rate calculation
    const successfulApps = (statusCounts.interview + statusCounts.accepted) || 0
    const successRate = totalApplications > 0 ? Math.round((successfulApps / totalApplications) * 100) : 0

    const analytics = {
      overview: {
        totalApplications,
        totalCVs,
        publishedCVs,
        avgScore,
        successRate
      },
      statusBreakdown: statusCounts,
      monthlyTrend: monthlyData,
      recentActivity: applications?.slice(0, 5).map(app => ({
        id: app.id,
        company: app.company_name,
        position: app.position_title,
        status: app.application_status,
        date: app.applied_date || app.created_at
      })) || []
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Analytics API Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de la récupération des analytics'
    }, { status: 500 })
  }
}
