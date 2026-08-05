// Lesson video is an embed, never an upload.
//
// Hosting video would cost more per course than the platform earns on it, and
// a self-hosted MP4 is slower on Bangladeshi mobile data than YouTube, which
// is already cached in-country. Sellers here also already keep their footage
// on YouTube — asking them to re-upload would lose most of them at step one.
//
// Only YouTube and Vimeo are accepted, and the URL is parsed rather than
// trusted: whatever a seller pastes ends up inside an <iframe src>, so an
// arbitrary URL would be an arbitrary embedded page on our origin's tab.
// Anything that is not a recognised video URL returns null and is refused.
//
// Pure and unit-tested in video.test.ts.

export type VideoProvider = 'youtube' | 'vimeo'

export interface ParsedVideo {
  provider: VideoProvider
  /** The provider's own id, e.g. dQw4w9WgXcQ or 76979871. */
  id: string
  /** Ready to drop into an iframe src. */
  embedUrl: string
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/
const VIMEO_ID = /^\d{6,12}$/

function youtube(id: string): ParsedVideo | null {
  if (!YOUTUBE_ID.test(id)) return null
  // nocookie: no tracking cookie is set on a buyer who is just watching a
  // lesson, which is both the decent default and one less consent problem.
  return { provider: 'youtube', id, embedUrl: `https://www.youtube-nocookie.com/embed/${id}` }
}

function vimeo(id: string): ParsedVideo | null {
  if (!VIMEO_ID.test(id)) return null
  return { provider: 'vimeo', id, embedUrl: `https://player.vimeo.com/video/${id}` }
}

/** Turn a pasted URL into something safe to embed, or null if it is not a
 *  YouTube/Vimeo video link. */
export function parseVideoUrl(raw: string | null | undefined): ParsedVideo | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  let url: URL
  try {
    // Sellers paste "youtu.be/xyz" as often as a full URL.
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const segments = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') {
    return youtube(segments[0] ?? '')
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') return youtube(url.searchParams.get('v') ?? '')
    // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
    if (['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '')) {
      return youtube(segments[1] ?? '')
    }
    return null
  }

  if (host === 'vimeo.com') {
    // vimeo.com/76979871 and vimeo.com/channels/staffpicks/76979871 both end
    // with the id.
    return vimeo(segments[segments.length - 1] ?? '')
  }

  if (host === 'player.vimeo.com') {
    return vimeo(segments[segments.length - 1] ?? '')
  }

  return null
}

/** True when a lesson's video link is usable. Empty is allowed — a text-only
 *  lesson is a legitimate lesson. */
export function isAcceptableVideoUrl(raw: string | null | undefined): boolean {
  if (!raw || !raw.trim()) return true
  return parseVideoUrl(raw) !== null
}

/** Total runtime, for showing "3 ঘন্টা ২০ মিনিট" on a course page. */
export function totalDurationMinutes(lessons: { durationMinutes?: number | null }[]): number {
  return lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0)
}
