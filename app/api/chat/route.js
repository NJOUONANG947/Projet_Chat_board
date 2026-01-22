import { NextResponse } from 'next/server'
import { saveMessage, getAllMessages, generateResponse } from '../../../backend/services/chat.js'

export async function GET() {
  try {
    const messages = await getAllMessages()
    return NextResponse.json({ messages })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { message } = await request.json()

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Save user message
    await saveMessage(message, 'user')

    // Generate AI response
    const aiResponse = await generateResponse(message)

    // Save AI response
    await saveMessage(aiResponse, 'assistant')

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
