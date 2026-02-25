/**
 * Script pour appliquer le schéma SQL dans Supabase
 * Usage: node scripts/apply-schema.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applySchema() {
  try {
    console.log('📖 Lecture du fichier SQL...')
    const schemaPath = join(__dirname, '..', 'supabase-schema-saas.sql')
    const sql = readFileSync(schemaPath, 'utf-8')

    console.log('🚀 Application du schéma dans Supabase...')
    
    // Diviser le SQL en requêtes individuelles
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'))

    let successCount = 0
    let errorCount = 0

    for (const query of queries) {
      try {
        // Utiliser rpc pour exécuter du SQL brut (nécessite une fonction SQL personnalisée)
        // Note: Supabase JS ne supporte pas directement l'exécution SQL brut
        // Il faut utiliser l'API REST ou créer une fonction SQL wrapper
        
        console.log(`   ⏳ Exécution: ${query.substring(0, 50)}...`)
        
        // Pour l'instant, on affiche juste les requêtes
        // L'utilisateur devra les exécuter manuellement dans Supabase Dashboard
        successCount++
      } catch (error) {
        console.error(`   ❌ Erreur: ${error.message}`)
        errorCount++
      }
    }

    console.log('\n✅ Schéma prêt à être appliqué!')
    console.log(`   ${successCount} requêtes préparées`)
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} erreurs`)
    }
    
    console.log('\n📝 Instructions:')
    console.log('   1. Ouvrez Supabase Dashboard > SQL Editor')
    console.log('   2. Copiez le contenu de supabase-schema-saas.sql')
    console.log('   3. Collez et exécutez dans l\'éditeur SQL')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application du schéma:', error)
    process.exit(1)
  }
}

// Alternative: Utiliser l'API REST de Supabase
async function applySchemaViaREST() {
  try {
    console.log('📖 Lecture du fichier SQL...')
    const schemaPath = join(__dirname, '..', 'supabase-schema-saas.sql')
    const sql = readFileSync(schemaPath, 'utf-8')

    console.log('🚀 Application du schéma via API REST...')
    
    // Note: L'API REST de Supabase ne supporte pas directement l'exécution SQL
    // Il faut utiliser Supabase CLI ou l'interface web
    
    console.log('\n⚠️  L\'exécution SQL directe n\'est pas supportée via l\'API JS.')
    console.log('📝 Veuillez utiliser l\'une des méthodes suivantes:')
    console.log('   1. Supabase Dashboard > SQL Editor (recommandé)')
    console.log('   2. Supabase CLI: supabase db push')
    console.log('   3. psql directement')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

// Exécuter
applySchemaViaREST()
