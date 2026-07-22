'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type PuterStatus = 'loading' | 'ready' | 'error'

interface PuterChatResponse {
  message?: { content?: Array<{ text?: string }> }
  content?: Array<{ text?: string }>
  text?: string
  choices?: Array<{ message?: { content?: string } }>
}

function extractText(res: unknown): string {
  if (typeof res === 'string') return res
  const r = res as PuterChatResponse
  if (r?.message?.content?.[0]?.text) return r.message.content[0].text
  if (r?.content?.[0]?.text) return r.content[0].text
  if (r?.text) return r.text
  if (r?.choices?.[0]?.message?.content) return r.choices[0].message.content
  return String(res)
}

export function usePuterAI() {
  const [status, setStatus] = useState<PuterStatus>('loading')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const check = () => {
      if (typeof window !== 'undefined' && window.puter?.ai) {
        setStatus('ready')
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
    check()
    intervalRef.current = setInterval(check, 400)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const sendMessage = useCallback(
    async (
      userPrompt: string,
      systemPrompt?: string,
      model = 'claude-sonnet-5'
    ): Promise<string> => {
      if (!window.puter?.ai) throw new Error('Puter AI not ready')

      const messages: Array<{ role: string; content: string }> = []
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
      messages.push({ role: 'user', content: userPrompt })

      try {
        const res = await window.puter.ai.chat(messages, { model })
        return extractText(res)
      } catch {
        // Fallback to gpt-4o if claude model fails
        try {
          const res = await window.puter.ai.chat(messages, { model: 'gpt-4o' })
          return extractText(res)
        } catch (err2) {
          throw err2
        }
      }
    },
    []
  )

  return { status, isReady: status === 'ready', sendMessage }
}
