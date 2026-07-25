import 'server-only'

// Tavily — a web search API, not a chat/completion API. This is a tool the
// chat route can optionally invoke for grounding, not an AIProvider — it
// must NOT be registered in lib/ai-providers/index.ts.
//
// Confirmed via https://docs.tavily.com/documentation/api-reference/endpoint/search:
//   - Endpoint: POST https://api.tavily.com/search
//   - Auth: `Authorization: Bearer tvly-...`
//   - Request body: { query, max_results, ... }
//   - Response body: { results: [{ title, url, content, score, ... }], ... }
const TAVILY_API_URL = 'https://api.tavily.com/search'

export interface TavilySearchResult {
  title: string
  url: string
  content: string
}

interface TavilySearchApiResponse {
  results: { title: string; url: string; content: string }[]
}

// Mirrors the shape/spirit of AIProviderError (lib/ai-providers/types.ts) —
// a typed error carrying the upstream status and body. Defined locally
// rather than importing from lib/ai-providers to avoid an awkward
// cross-module dependency between a search tool and the chat-provider layer.
export class TavilySearchError extends Error {
  constructor(
    public readonly provider: 'tavily',
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'TavilySearchError'
  }
}

export function isTavilyConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY)
}

export async function tavilySearch(query: string): Promise<{ results: TavilySearchResult[] }> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new TavilySearchError('tavily', 503, 'Tavily is not configured (missing TAVILY_API_KEY).')
  }

  const res = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      max_results: 5,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const error = await res.text()
    throw new TavilySearchError('tavily', res.status, `Tavily API Error ${res.status}: ${error.slice(0, 500)}`)
  }

  const data = (await res.json()) as TavilySearchApiResponse
  const results = (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
  }))

  return { results }
}
