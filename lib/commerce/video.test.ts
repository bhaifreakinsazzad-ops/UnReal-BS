import { describe, it, expect } from 'vitest'
import { isAcceptableVideoUrl, parseVideoUrl, totalDurationMinutes } from './video'

describe('parseVideoUrl — YouTube', () => {
  it('accepts the shapes a seller actually pastes', () => {
    const cases = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com/watch?v=dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/live/dQw4w9WgXcQ',
      // Copied from the address bar mid-video, with the timestamp attached.
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s',
      // Pasted without the scheme, which is how a phone share often arrives.
      'youtu.be/dQw4w9WgXcQ',
    ]
    for (const url of cases) {
      const parsed = parseVideoUrl(url)
      expect(parsed, url).not.toBeNull()
      expect(parsed!.provider).toBe('youtube')
      expect(parsed!.id).toBe('dQw4w9WgXcQ')
    }
  })

  it('embeds through the no-cookie host', () => {
    // A buyer watching a lesson should not pick up a tracking cookie from us.
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ')!.embedUrl).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    )
  })

  it('rejects a YouTube URL with no video in it', () => {
    expect(parseVideoUrl('https://www.youtube.com/')).toBeNull()
    expect(parseVideoUrl('https://www.youtube.com/watch')).toBeNull()
    expect(parseVideoUrl('https://www.youtube.com/@somechannel')).toBeNull()
    expect(parseVideoUrl('https://www.youtube.com/results?search_query=x')).toBeNull()
  })
})

describe('parseVideoUrl — Vimeo', () => {
  it('accepts plain and channel URLs', () => {
    expect(parseVideoUrl('https://vimeo.com/76979871')?.id).toBe('76979871')
    expect(parseVideoUrl('https://vimeo.com/channels/staffpicks/76979871')?.id).toBe('76979871')
    expect(parseVideoUrl('https://player.vimeo.com/video/76979871')?.id).toBe('76979871')
  })

  it('rejects a Vimeo page that is not a video', () => {
    expect(parseVideoUrl('https://vimeo.com/upgrade')).toBeNull()
    expect(parseVideoUrl('https://vimeo.com/')).toBeNull()
  })
})

describe('parseVideoUrl — everything else is refused', () => {
  // Whatever this returns ends up in an iframe src, so an unrecognised URL
  // must never survive. A permissive parser here would be a way to embed an
  // arbitrary page inside a page our buyers trust.
  it('rejects other hosts, including lookalikes', () => {
    const bad = [
      'https://evil.example.com/embed/xyz',
      'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
      'https://notyoutube.com/watch?v=dQw4w9WgXcQ',
      'https://vimeo.com.evil.example/76979871',
      'https://drive.google.com/file/d/abc/view',
      'https://facebook.com/watch/?v=123456',
    ]
    for (const url of bad) {
      expect(parseVideoUrl(url), url).toBeNull()
    }
  })

  it('rejects non-http schemes', () => {
    expect(parseVideoUrl('javascript:alert(1)')).toBeNull()
    expect(parseVideoUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(parseVideoUrl('file:///etc/passwd')).toBeNull()
  })

  it('rejects empty and malformed input', () => {
    expect(parseVideoUrl('')).toBeNull()
    expect(parseVideoUrl('   ')).toBeNull()
    expect(parseVideoUrl(null)).toBeNull()
    expect(parseVideoUrl(undefined)).toBeNull()
    expect(parseVideoUrl('not a url at all')).toBeNull()
  })
})

describe('isAcceptableVideoUrl', () => {
  it('allows an empty video — a text-only lesson is a real lesson', () => {
    expect(isAcceptableVideoUrl('')).toBe(true)
    expect(isAcceptableVideoUrl(null)).toBe(true)
  })

  it('rejects a link that is present but unusable', () => {
    expect(isAcceptableVideoUrl('https://example.com/video.mp4')).toBe(false)
  })
})

describe('totalDurationMinutes', () => {
  it('sums lessons and treats an unknown duration as zero', () => {
    expect(
      totalDurationMinutes([{ durationMinutes: 12 }, { durationMinutes: null }, { durationMinutes: 8 }])
    ).toBe(20)
    expect(totalDurationMinutes([])).toBe(0)
  })
})
