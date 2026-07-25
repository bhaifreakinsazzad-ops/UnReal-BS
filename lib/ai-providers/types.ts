export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  model: string
  messages: ChatMessage[]
  maxTokens?: number
}

export interface ChatUsage {
  inputTokens: number
  outputTokens: number
}

export interface ChatResponse {
  content: string
  usage: ChatUsage
}

export interface AIProvider {
  name: string
  isConfigured(): boolean
  chat(req: ChatRequest): Promise<ChatResponse>
}

// Mirrors the shape/spirit of lib/ghl/client.ts's GHLRequestError — a typed
// error carrying the upstream provider's HTTP status and response body so
// callers can log and respond appropriately without re-parsing text.
export class AIProviderError extends Error {
  constructor(
    public readonly provider: string,
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}
