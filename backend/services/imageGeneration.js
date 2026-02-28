/**
 * Image generation: Hugging Face (gratuit) ou OpenAI DALL-E (payant).
 * - Si HUGGINGFACE_TOKEN est défini → API gratuite (Stable Diffusion)
 * - Sinon si OPENAI_API_KEY est défini → DALL-E 3
 */

const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN || process.env.HF_TOKEN
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const HF_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0'
const HF_INFERENCE_URL = 'https://router.huggingface.co/hf-inference'

/**
 * Génère une image via Hugging Face (gratuit).
 * Utilise router.huggingface.co/hf-inference (ancienne api-inference dépréciée).
 * Retourne une data URL base64 pour affichage direct.
 */
async function generateImageHuggingFace(prompt) {
  const res = await fetch(
    `${HF_INFERENCE_URL}/models/${HF_MODEL}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
        'x-wait-for-model': 'true',
      },
      body: JSON.stringify({
        inputs: (prompt || 'abstract art').slice(0, 1000),
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    let errMsg = `Hugging Face API: ${res.status}`
    try {
      const j = JSON.parse(text)
      if (j.error) errMsg = j.error
    } catch (_) {}
    throw new Error(errMsg)
  }

  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const url = `data:image/png;base64,${base64}`
  return { url }
}

/**
 * Génère une image via OpenAI DALL-E 3 (payant).
 */
async function generateImageOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: (prompt || 'abstract art').slice(0, 1000),
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI API: ${res.status}`)
  }

  const data = await res.json()
  const url = data.data?.[0]?.url
  if (!url) throw new Error('No image URL in OpenAI response')
  return { url }
}

/**
 * Génère une image à partir d’un prompt.
 * Utilise Hugging Face si HUGGINGFACE_TOKEN est défini, sinon OpenAI si OPENAI_API_KEY est défini.
 * @returns {Promise<{ url: string }>} - URL de l’image (https ou data:image/...;base64,...)
 */
async function generateImage(prompt) {
  if (HUGGINGFACE_TOKEN) {
    return generateImageHuggingFace(prompt)
  }
  if (OPENAI_API_KEY) {
    return generateImageOpenAI(prompt)
  }
  throw new Error(
    'Aucune clé configurée. Ajoutez HUGGINGFACE_TOKEN (gratuit) ou OPENAI_API_KEY dans .env pour activer la génération d’images.'
  )
}

export { generateImage }
