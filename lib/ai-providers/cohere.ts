import 'server-only'
import type { AIProvider, ChatRequest, ChatResponse } from './types'
import { AIProviderError } from './types'

// Cohere's Chat API v2 is NOT OpenAI-chat-completions-compatible in its
// response shape (though the request's "messages" array is similarly
// shaped). Confirmed against https://docs.cohere.com/reference/chat:
//   - response text lives at message.content[].text (an array of typed
//     content blocks, not a flat string)
//   - usage lives at usage.tokens.{input_tokens,output_tokens}, not
//     usage.{prompt_tokens,completion_tokens}
const COHERE_API_URL = 'https://api.cohere.com/v2/chat'

interface CohereChatResponse {
  message: { content: { type: string; text: string }[] }
  usage?: {
    tokens?: { input_tokens?: number; output_tokens?: number }
  }
}

export const cohereProvider: AIProvider = {
  name: 'cohere',

  isConfigured() {
    return Boolean(process.env.COHERE_API_KEY)
  },

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const apiKey = process.env.COHERE_API_KEY
    if (!apiKey) {
      throw new AIProviderError('cohere', 503, 'Cohere is not configured (missing COHERE_API_KEY).')
    }

    const res = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        max_tokens: req.maxTokens ?? 1024,
        stream: false,
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const error = await res.text()
      throw new AIProviderError('cohere', res.status, `Cohere API Error ${res.status}: ${error.slice(0, 500)}`)
    }

    const data = (await res.json()) as CohereChatResponse
    const content = (data.message?.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')

    return {
      content,
      usage: {
        inputTokens: data.usage?.tokens?.input_tokens ?? 0,
        outputTokens: data.usage?.tokens?.output_tokens ?? 0,
      },
    }
  },
}
