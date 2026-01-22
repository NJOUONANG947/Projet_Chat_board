import Groq from 'groq-sdk'
import prisma from '../lib/db.js'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

async function saveMessage(content, role) {
  return await prisma.message.create({
    data: {
      content,
      role,
    },
  })
}

async function getAllMessages() {
  return await prisma.message.findMany({
    orderBy: {
      createdAt: 'asc',
    },
  })
}

async function generateResponse(userMessage) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      model: 'llama-3.1-8b-instant',
    })

    return chatCompletion.choices[0]?.message?.content || 'No response'
  } catch (error) {
    console.error('Error generating response:', error)
    throw new Error('Failed to generate AI response')
  }
}

export {
  saveMessage,
  getAllMessages,
  generateResponse,
}
