import { NextResponse } from 'next/server'
import { isTavilyConfigured } from '@/lib/tools/tavily-search'

export const dynamic = 'force-dynamic'

// Public read, no auth — matches the models route's public-read pattern.
// Lets the frontend know whether to show the "search the web" toggle
// without changing the shape of /api/ai-subscriptions/models.
export async function GET() {
  return NextResponse.json({ searchAvailable: isTavilyConfigured() })
}
