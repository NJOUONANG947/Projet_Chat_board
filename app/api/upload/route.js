import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

const ALT_BUCKETS = ['files', 'uploads', 'storage', 'assets']

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(request) {
  try {
    // Create authenticated Supabase client using cookies
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('Authentication error:', sessionError)
      return NextResponse.json({ error: 'Non autorisé - Veuillez vous reconnecter' }, { status: 401 })
    }

    const user = session.user
    console.log('Authenticated user for upload:', user.id)

    const formData = await request.formData()
    const file = formData.get('file')
    const fileType = formData.get('fileType') || 'document'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Generate unique filename with user-specific path
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const storagePath = `${user.id}/${fileName}`

    // Try to upload file to Supabase Storage
    let uploadData, uploadError

    try {
      // First try the 'documents' bucket
      const result = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false
        })
      uploadData = result.data
      uploadError = result.error
    } catch (bucketError) {
      console.log('Documents bucket not found, trying default bucket...')

      try {
        // Try alternative bucket names that might exist
        for (const bucketName of ALT_BUCKETS) {
          try {
            const result = await supabase.storage
              .from(bucketName)
              .upload(storagePath, file, {
                contentType: file.type,
                upsert: false
              })
            if (!result.error) {
              uploadData = result.data
              uploadError = null
              console.log(`Successfully uploaded to ${bucketName} bucket`)
              break
            }
          } catch (e) {
            continue
          }
        }

        // If still no success, try to create the documents bucket
        if (!uploadData) {
          try {
            console.log('Attempting to create documents bucket...')
            const { error: createError } = await supabase.storage.createBucket('documents', {
              public: false,
              allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
              fileSizeLimit: 10485760 // 10MB
            })

            if (!createError) {
              console.log('Documents bucket created successfully')
              // Now try upload again
              const result = await supabase.storage
                .from('documents')
                .upload(storagePath, file, {
                  contentType: file.type,
                  upsert: false
                })
              uploadData = result.data
              uploadError = result.error
            }
          } catch (createError) {
            console.error('Failed to create bucket:', createError)
          }
        }
      } catch (altError) {
        console.error('All upload attempts failed:', altError)
        uploadError = altError
      }
    }

    if (uploadError || !uploadData) {
      console.error('Final upload error:', uploadError)
      return NextResponse.json({
        error: 'Failed to upload file - storage bucket not configured. Please create a "documents" bucket in your Supabase Storage dashboard.'
      }, { status: 500 })
    }

    // Extract text content
    let extractedText = ''
    try {
      if (file.type === 'application/pdf') {
        const buffer = Buffer.from(await file.arrayBuffer())
        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const buffer = Buffer.from(await file.arrayBuffer())
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
      } else if (file.type === 'text/plain') {
        extractedText = await file.text()
      }
    } catch (extractError) {
      console.error('Text extraction error:', extractError)
      // Continue without extracted text
    }

    // Save document metadata to database - CORRECTED COLUMN NAMES
    const { data: docData, error: dbError } = await supabase
      .from('uploaded_documents')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_path: storagePath,
        file_type: fileType,
        file_size: file.size,
        extracted_text: extractedText,
        metadata: {
          mime_type: file.type,
          original_name: file.name,
          extracted_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to clean up uploaded file
      try {
        await supabase.storage.from('documents').remove([storagePath])
      } catch {
        for (const bucketName of ALT_BUCKETS) {
          try {
            await supabase.storage.from(bucketName).remove([storagePath])
          } catch {
            continue
          }
        }
      }
      return NextResponse.json({ error: 'Failed to save document metadata' }, { status: 500 })
    }

    return NextResponse.json({
      document: docData,
      extractedText: extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : '')
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('Authentication error:', sessionError)
      return NextResponse.json({ error: 'Non autorisé - Veuillez vous reconnecter' }, { status: 401 })
    }

    const user = session.user
    let documentId = null

    // documentId : priorité à l'URL (query) pour DELETE, puis body JSON
    try {
      const url = new URL(request.url)
      documentId = url.searchParams.get('documentId')
    } catch (_) {}
    if (!documentId) {
      try {
        const contentType = request.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const body = await request.json()
          documentId = body?.documentId
        }
      } catch {
        // body vide ou invalide
      }
    }
    if (!documentId && request.nextUrl) {
      documentId = request.nextUrl.searchParams.get('documentId')
    }

    if (!documentId) {
      return NextResponse.json({ error: 'documentId requis' }, { status: 400 })
    }

    // Récupérer le document pour vérifier la propriété (avec le client utilisateur)
    const { data: document, error: fetchError } = await supabase
      .from('uploaded_documents')
      .select('id, user_id, file_path')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      console.error('Document not found for deletion:', fetchError)
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    }

    if (document.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const filePath = document.file_path
    const supabaseAdmin = getSupabaseAdmin()

    if (!supabaseAdmin) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set. Document delete requires it to bypass RLS.')
      return NextResponse.json(
        { error: 'Configuration serveur manquante. Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local (voir SETUP_CAMPAIGNS.md).' },
        { status: 500 }
      )
    }

    // Suppression réelle avec le client admin (contourne RLS) : storage puis BDD
    try {
      await supabaseAdmin.storage.from('documents').remove([filePath])
    } catch (err) {
      console.warn('Storage remove documents bucket:', err?.message)
      for (const bucketName of ALT_BUCKETS) {
        try {
          await supabaseAdmin.storage.from(bucketName).remove([filePath])
          break
        } catch {
          continue
        }
      }
    }

    const { data: deletedRows, error: deleteError } = await supabaseAdmin
      .from('uploaded_documents')
      .delete()
      .eq('id', documentId)
      .select('id')

    if (deleteError) {
      console.error('Failed to delete document row (admin):', deleteError)
      const msg = deleteError?.message || deleteError?.code || 'Erreur base de données'
      return NextResponse.json(
        { error: `Erreur lors de la suppression du document: ${msg}` },
        { status: 500 }
      )
    }
    if (!deletedRows || deletedRows.length === 0) {
      console.error('Delete affected 0 rows:', documentId)
      return NextResponse.json(
        { error: 'Aucune ligne supprimée en base (contrainte ou RLS?).' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete document API error:', error)
    const msg = error?.message || 'Erreur interne'
    return NextResponse.json(
      { error: `Erreur interne lors de la suppression: ${msg}` },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    // Create authenticated Supabase client using cookies
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('Authentication error:', sessionError)
      return NextResponse.json({ error: 'Non autorisé - Veuillez vous reconnecter' }, { status: 401 })
    }

    const user = session.user
    console.log('Authenticated user for document fetch:', user.id)

    const { data: documents, error } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch documents error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json({ documents }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
