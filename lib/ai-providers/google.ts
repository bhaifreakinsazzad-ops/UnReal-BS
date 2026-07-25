import 'server-only'
import type { AIProvider, ChatRequest, ChatResponse } from './types'
import { AIProviderError } from './types'

const GOOGLE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

interface GeminiGenerateContentResponse {
  candidates: { content: { parts: { text?: string }[] } }[]
  usageMetadata: { promptTokenCount: number; candidatesTokenCount: number }
}

export const googleProvider: AIProvider = {
  name: 'google',

  isConfigured() {
    return Boolean(process.env.GOOGLE_AI_API_KEY)
  },

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new AIProviderError('google', 503, 'Google AI is not configured (missing GOOGLE_AI_API_KEY).')
    }

    // Gemini's request shape differs from OpenAI's: messages become
    // `contents` with role 'user'|'model' (not 'assistant'), and system
    // messages go into a separate `systemInstruction` field, not `contents`.
    const systemText = req.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n')
    const contents = req.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const url = `${GOOGLE_API_BASE}/${encodeURIComponent(req.model)}:generateContent?key=${apiKey}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
        generationConfig: { maxOutputTokens: req.maxTokens ?? 1024 },
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const error = await res.text()
      throw new AIProviderError('google', res.status, `Google AI API Error ${res.status}: ${error.slice(0, 500)}`)
    }

    const data = (await res.json()) as GeminiGenerateContentResponse
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    return {
      content,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      },
    }
  },
}
