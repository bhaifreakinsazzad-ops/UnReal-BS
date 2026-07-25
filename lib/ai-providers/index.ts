import 'server-only'
import type { AIProvider } from './types'
import { openaiProvider } from './openai'
import { anthropicProvider } from './anthropic'
import { googleProvider } from './google'
import { moonshotProvider } from './moonshot'
import { openrouterProvider } from './openrouter'
import { cohereProvider } from './cohere'
import { cerebrasProvider } from './cerebras'
import { cloudflareProvider } from './cloudflare'
import { huggingfaceProvider } from './huggingface'

const providers: Record<string, AIProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
  moonshot: moonshotProvider,
  openrouter: openrouterProvider,
  cohere: cohereProvider,
  cerebras: cerebrasProvider,
  cloudflare: cloudflareProvider,
  huggingface: huggingfaceProvider,
}

export function getProvider(name: string): AIProvider {
  const provider = providers[name]
  if (!provider) {
    throw new Error(`Unknown AI provider: ${name}`)
  }
  return provider
}

export function isProviderConfigured(name: string): boolean {
  const provider = providers[name]
  return provider ? provider.isConfigured() : false
}

export type { AIProvider, ChatMessage, ChatRequest, ChatResponse, ChatUsage } from './types'
export { AIProviderError } from './types'
