import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

async function createConversation(title, userId, supabase) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ title, user_id: userId }])
      .select()
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating conversation:', error)
    throw new Error('Failed to create conversation')
  }
}

async function getAllConversations(userId, supabase) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting conversations:', error)
    throw new Error('Failed to get conversations')
  }
}

async function saveMessage(content, role, conversationId, userId, supabase) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ content, role, conversation_id: conversationId, user_id: userId }])
      .select()
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving message:', error)
    throw new Error('Failed to save message')
  }
}

async function getMessagesByConversation(conversationId, userId, supabase) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting messages:', error)
    throw new Error('Failed to get messages')
  }
}

async function generateResponse(userMessage) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: userMessage }],
      model: 'llama-3.1-8b-instant',
      max_tokens: 500,
    })

    const response = chatCompletion.choices?.[0]?.message?.content

    if (!response) {
      throw new Error('No content in AI response')
    }

    return response
  } catch (error) {
    console.error('Groq API Error:', error.message)
    // Return a user-friendly fallback response instead of crashing
    return `Désolé, je n'ai pas pu générer une réponse pour le moment. Veuillez réessayer plus tard.`
  }
}

async function generateStreamingResponse(message, conversationHistory, onChunk, onFinish, imageBase64List = [], documentText = '') {
  const hasImages = Array.isArray(imageBase64List) && imageBase64List.length > 0
  const hasDocument = typeof documentText === 'string' && documentText.trim().length > 0
  const model = hasImages ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.1-8b-instant'

  try {
    let userContent
    if (hasImages) {
      userContent = [
        { type: 'text', text: message || 'Décris cette image.' }
      ]
      for (const img of imageBase64List.slice(0, 5)) {
        const url = typeof img === 'string' ? img : (img.url || (img.data ? `data:${img.mimeType || 'image/jpeg'};base64,${img.data}` : null))
        if (url) {
          userContent.push({ type: 'image_url', image_url: { url } })
        }
      }
    } else {
      userContent = message
    }

    const systemContent = hasDocument
      ? `You are a helpful AI assistant. The user has attached a document. Use the following document content to answer their questions accurately. If the question is not related to the document, you may answer from general knowledge.\n\n--- Document content ---\n${documentText.trim()}\n--- End of document ---\n\nProvide clear, accurate, and helpful responses. For CV-related queries, be professional and provide actionable advice.`
      : 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses. For CV-related queries, be professional and provide actionable advice. When the user sends images, describe or analyze them as requested.'

    const messages = [
      {
        role: 'system',
        content: systemContent,
      },
      ...conversationHistory.map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: userContent }
    ]

    const response = await groq.chat.completions.create({
      messages,
      model,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    })

    let fullResponse = ''

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        fullResponse += content
        onChunk(content)
      }
    }

    onFinish()
  } catch (error) {
    console.error('Error generating streaming response:', error)
    throw new Error('Failed to generate AI response')
  }
}

export {
  createConversation,
  getAllConversations,
  saveMessage,
  getMessagesByConversation,
  generateResponse,
  generateStreamingResponse,
}
