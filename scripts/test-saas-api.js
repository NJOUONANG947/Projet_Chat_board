/**
 * Script de test pour les APIs du SaaS Recruteur
 * Usage: node scripts/test-saas-api.js
 * 
 * Note: Vous devez être authentifié et avoir un cookie de session valide
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

// Remplacez par votre cookie de session
const SESSION_COOKIE = process.env.TEST_SESSION_COOKIE || ''

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': SESSION_COOKIE
      }
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const data = await response.json()

    console.log(`\n${method} ${endpoint}`)
    console.log(`Status: ${response.status}`)
    console.log('Response:', JSON.stringify(data, null, 2))

    return { success: response.ok, data }
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🧪 Tests du SaaS Recruteur\n')
  console.log('='.repeat(50))

  if (!SESSION_COOKIE) {
    console.log('⚠️  SESSION_COOKIE non défini')
    console.log('   Définissez TEST_SESSION_COOKIE dans votre .env.local')
    console.log('   Ou modifiez SESSION_COOKIE dans ce fichier')
    return
  }

  // Test 1: Créer un poste
  console.log('\n📝 Test 1: Création d\'un poste')
  const jobResult = await testAPI('/api/recruiter/job-postings', 'POST', {
    title: 'Développeur Full Stack - Test',
    description: 'Recherche développeur React/Node.js avec 3 ans d\'expérience minimum. Compétences requises: React, Node.js, PostgreSQL, TypeScript.',
    required_skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
    required_experience: 3,
    location: 'Paris',
    employment_type: 'full-time',
    status: 'open'
  })

  if (!jobResult.success) {
    console.log('❌ Échec de la création du poste')
    return
  }

  const jobPostingId = jobResult.data?.jobPosting?.id
  console.log(`✅ Poste créé: ${jobPostingId}`)

  // Test 2: Lister les postes
  console.log('\n📋 Test 2: Liste des postes')
  await testAPI('/api/recruiter/job-postings')

  // Test 3: Générer un quiz
  console.log('\n📝 Test 3: Génération d\'un quiz')
  const quizResult = await testAPI('/api/recruiter/quizzes', 'POST', {
    jobPostingId,
    quizType: 'mixed',
    numQuestions: 5,
    settings: {
      timeLimit: 1800,
      passingScore: 70
    }
  })

  if (!quizResult.success) {
    console.log('❌ Échec de la génération du quiz')
    return
  }

  const quizId = quizResult.data?.quiz?.id
  console.log(`✅ Quiz généré: ${quizId}`)
  console.log(`   Questions: ${quizResult.data?.quiz?.questions?.length || 0}`)

  // Test 4: Lister les quiz
  console.log('\n📚 Test 4: Liste des quiz')
  await testAPI('/api/recruiter/quizzes')

  // Test 5: Calculer un score de pertinence (nécessite un candidat)
  console.log('\n📊 Test 5: Calcul de score de pertinence')
  console.log('   ⚠️  Nécessite un candidat existant')
  console.log('   Créez d\'abord un candidat via l\'interface')

  // Test 6: Classer les candidats
  console.log('\n🏆 Test 6: Classement des candidats')
  console.log('   ⚠️  Nécessite des candidats existants')
  console.log('   Créez d\'abord des candidats via l\'interface')

  console.log('\n' + '='.repeat(50))
  console.log('✅ Tests de base terminés')
  console.log('\n📝 Prochaines étapes:')
  console.log('   1. Testez l\'ajout de candidats via l\'interface')
  console.log('   2. Testez le classement avec plusieurs candidats')
  console.log('   3. Vérifiez les scores de pertinence')
}

// Exécuter les tests
runTests().catch(console.error)
