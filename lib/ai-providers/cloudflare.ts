import 'server-only'
import type { AIProvider, ChatRequest, ChatResponse } from './types'
import { AIProviderError } from './types'

// Cloudflare Workers AI — confirmed via
// https://developers.cloudflare.com/workers-ai/get-started/rest-api/ and the
// per-model schema page (e.g.
// https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/):
//   - Endpoint: https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}
//     — needs BOTH an account id (in the URL) and a bearer API token, unlike
//     the other providers here which need only a key.
//   - Request body: chat-capable models accept a "messages" array of
//     { role, content } objects (same shape as OpenAI's), plus max_tokens.
//   - Response body: { result: { response: "..." }, success: true }. The
//     model schema page documents a "usage" object on the result ("usage
//     statistics for the inference request") but does not publish the exact
//     field names, and the REST API guide's own example response has no
//     usage field at all — so presence/shape is not guaranteed for every
//     model. We read it defensively (trying the field names Cloudflare uses
//     elsewhere in its docs) and fall back to a documented-as-approximate
//     chars/4 estimate for outputTokens when it's absent. That estimate
//     feeds the wallet debit math, so it is clearly not exact — flagged here
//     and at the point of use.
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4/accounts'

interface CloudflareRunResponse {
  result?: {
    response?: string
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
      input_tokens?: number
      output_tokens?: number
    }
  }
  success: boolean
  errors?: { message?: string }[]
}

// Rough, clearly-labeled estimate — NOT an exact token count. Used only when
// Cloudflare's response omits usage stats. ~4 chars/token is a commonly cited
// approximation for English text; this is not model-specific tokenization.
function estimateTokensFromChars(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}

export const cloudflareProvider: AIProvider = {
  name: 'cloudflare',

  isConfigured() {
    return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID) && Boolean(process.env.CLOUDFLARE_API_TOKEN)
  },

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = process.env.CLOUDFLARE_API_TOKEN
    if (!accountId || !apiToken) {
      throw new AIProviderError(
        'cloudflare',
        503,
        'Cloudflare Workers AI is not configured (missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN).'
      )
    }

    const url = `${CLOUDFLARE_API_BASE}/${accountId}/ai/run/${req.model}`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: req.messages,
        max_tokens: req.maxTokens ?? 1024,
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const error = await res.text()
      throw new AIProviderError('cloudflare', res.status, `Cloudflare Workers AI Error ${res.status}: ${error.slice(0, 500)}`)
    }

    const data = (await res.json()) as CloudflareRunResponse

    if (!data.success) {
      const message = data.errors?.[0]?.message ?? 'Unknown error from Cloudflare Workers AI.'
      throw new AIProviderError('cloudflare', 502, `Cloudflare Workers AI Error: ${message}`)
    }

    const content = data.result?.response ?? ''
    const usage = data.result?.usage

    // If usage is present but a specific field is missing, trust the 0 (the
    // model may have genuinely used none of that side). Only fall back to
    // the chars/4 estimate when Cloudflare returned no usage object at all.
    const inputTokens =
      usage?.prompt_tokens ??
      usage?.input_tokens ??
      (usage ? 0 : estimateTokensFromChars(req.messages.map((m) => m.content).join('\n')))
    const outputTokens = usage?.completion_tokens ?? usage?.output_tokens ?? (usage ? 0 : estimateTokensFromChars(content))

    return {
      content,
      usage: { inputTokens, outputTokens },
    }
  },
}
