import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { saveMessage, getMessagesByConversation, generateResponse, createConversation, getAllConversations, generateStreamingResponse } from '../../../backend/services/chat.js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use service key if available

export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }
  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return null
  }
  return user
}

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      const messages = await getMessagesByConversation(conversationId, user.id, supabase)
      return NextResponse.json({ messages })
    } else {
      const conversations = await getAllConversations(user.id, supabase)
      return NextResponse.json({ conversations })
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const body = await request.json()
    const { message, conversationId, action, title } = body

    // Handle conversation creation
    if (action === 'createConversation') {
      if (!title || title.trim() === '') {
        return NextResponse.json({ error: 'Title is required for conversation creation' }, { status: 400 })
      }
      const conversation = await createConversation(title, user.id, supabase)
      return NextResponse.json({ conversation })
    }

    // Handle message sending
    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Save user message
    await saveMessage(message, 'user', conversationId, user.id, supabase)

    // Generate AI response
    const aiResponse = await generateResponse(message)

    // Save AI response
    await saveMessage(aiResponse, 'assistant', conversationId, user.id, supabase)

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

// Streaming endpoint for real-time responses
export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const body = await request.json()
    const { message, conversationId, images, generateImage: wantGenerateImage, documentText } = body

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    const hasImages = Array.isArray(images) && images.length > 0
    const messageText = (message || '').trim()
    const hasDocument = typeof documentText === 'string' && documentText.trim().length > 0
    if (!messageText && !hasImages && !wantGenerateImage && !hasDocument) {
      return NextResponse.json({ error: 'Message, image, document or image generation is required' }, { status: 400 })
    }

    const textToSave = messageText || (wantGenerateImage ? 'Générer une image' : hasDocument ? ' [Document joint]' : ' [Image(s)]')
    await saveMessage(textToSave, 'user', conversationId, user.id, supabase)

    if (wantGenerateImage) {
      const { generateImage: genImg } = await import('../../../backend/services/imageGeneration.js')
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const prompt = messageText || 'abstract art'
            const { url } = await genImg(prompt)
            const text = 'Voici l\'image générée :\n\n'
            for (const ch of text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: ch })}\n\n`))
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ imageUrl: url })}\n\n`))
            await saveMessage(`Voici l'image générée :\n\n![image](${url})`, 'assistant', conversationId, user.id, supabase)
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (err) {
            console.error('Image generation error:', err)
            const msg = err.message || 'Impossible de générer l\'image.'
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: msg })}\n\n`))
            await saveMessage(msg, 'assistant', conversationId, user.id, supabase)
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        },
      })
      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      })
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get conversation history for context
          const messages = await getMessagesByConversation(conversationId, user.id, supabase)
          const conversationHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))

          let fullResponse = ''

          const streamCallback = (chunk) => {
            fullResponse += chunk
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
          }

          const finishCallback = async () => {
            await saveMessage(fullResponse, 'assistant', conversationId, user.id, supabase)
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }

          const imageList = (images || []).slice(0, 5).map(img => {
            if (typeof img === 'string') return img
            if (img?.url) return img.url
            if (img?.data) return `data:${img.mimeType || 'image/jpeg'};base64,${img.data}`
            return null
          }).filter(Boolean)

          await generateStreamingResponse(messageText || 'Posez une question sur ce document.', conversationHistory, streamCallback, finishCallback, imageList, documentText || '')

        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Streaming API Error:', error)
    return NextResponse.json({ error: 'Failed to start streaming' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId requis' }, { status: 400 })
    }

    // Vérifier que la conversation appartient bien à l'utilisateur
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .single()

    if (fetchError || !conversation) {
      return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (deleteError) {
      console.error('Error deleting conversation:', deleteError)
      return NextResponse.json({ error: 'Erreur lors de la suppression de la conversation' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Conversation DELETE API Error:', error)
    return NextResponse.json({ error: 'Erreur interne lors de la suppression de la conversation' }, { status: 500 })
  }
}
