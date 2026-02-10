import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

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
        const altBuckets = ['files', 'uploads', 'storage', 'assets']
        for (const bucketName of altBuckets) {
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
      await supabase.storage.from('documents').remove([storagePath])
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

    return NextResponse.json({ documents })

  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
