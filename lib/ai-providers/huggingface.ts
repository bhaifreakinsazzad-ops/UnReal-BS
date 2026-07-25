import 'server-only'
import type { AIProvider, ChatRequest, ChatResponse } from './types'
import { AIProviderError } from './types'

// Hugging Face Inference Providers — OpenAI-chat-completions-compatible
// router. Confirmed via https://huggingface.co/docs/inference-providers/en/index:
//   - Endpoint: https://router.huggingface.co/v1/chat/completions
//   - Auth: `Authorization: Bearer $HF_TOKEN`
//   - Request body matches OpenAI's: { model, messages, ... } (max_tokens
//     supported the same way).
//   - Response body matches OpenAI's: choices[0].message.content and
//     usage.{prompt_tokens,completion_tokens}.
//   - Model IDs are Hub repo ids (e.g. "meta-llama/Llama-3.3-70B-Instruct");
//     an optional ":provider" or ":fastest"/":cheapest" suffix selects the
//     upstream inference provider — confirmed in the same doc.
const HUGGINGFACE_API_URL = 'https://router.huggingface.co/v1/chat/completions'

interface HuggingFaceChatCompletionResponse {
  choices: { message: { content: string | null } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

export const huggingfaceProvider: AIProvider = {
  name: 'huggingface',

  isConfigured() {
    return Boolean(process.env.HUGGINGFACE_API_KEY)
  },

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const apiKey = process.env.HUGGINGFACE_API_KEY
    if (!apiKey) {
      throw new AIProviderError('huggingface', 503, 'Hugging Face is not configured (missing HUGGINGFACE_API_KEY).')
    }

    const res = await fetch(HUGGINGFACE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        max_tokens: req.maxTokens ?? 1024,
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const error = await res.text()
      throw new AIProviderError('huggingface', res.status, `Hugging Face API Error ${res.status}: ${error.slice(0, 500)}`)
    }

    const data = (await res.json()) as HuggingFaceChatCompletionResponse
    const content = data.choices?.[0]?.message?.content ?? ''

    return {
      content,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
    }
  },
}
