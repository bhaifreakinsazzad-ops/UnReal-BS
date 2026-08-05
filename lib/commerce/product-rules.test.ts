import { describe, it, expect } from 'vitest'
import {
  ALLOWED_TRANSITIONS,
  canTransition,
  slugify,
  validateForPublish,
  type ProductDraft,
  type ProductStatus,
} from './product-rules'

const course: ProductDraft = {
  kind: 'course',
  title: 'ফেসবুক মার্কেটিং কোর্স',
  description: 'Learn to sell on Facebook.',
  priceBdt: 1500,
}

const lesson = { title: 'Lesson 1', videoUrl: 'https://youtu.be/dQw4w9WgXcQ' }

describe('validateForPublish', () => {
  it('passes a complete course', () => {
    expect(validateForPublish(course, [lesson])).toEqual([])
  })

  it('requires a title and a description', () => {
    expect(validateForPublish({ ...course, title: '   ' }, [lesson])).toContain('missing_title')
    expect(validateForPublish({ ...course, description: null }, [lesson])).toContain(
      'missing_description'
    )
  })

  it('refuses a course with no lessons', () => {
    // Publishing an empty course would sell somebody nothing.
    expect(validateForPublish(course, [])).toContain('course_needs_lessons')
  })

  it('refuses a lesson that is a title and nothing else', () => {
    expect(validateForPublish(course, [{ title: 'Coming soon' }])).toContain('lesson_needs_content')
  })

  it('accepts a text-only lesson', () => {
    expect(
      validateForPublish(course, [{ title: 'Reading', contentMd: 'Some notes.' }])
    ).toEqual([])
  })

  it('refuses a video link we cannot safely embed', () => {
    expect(
      validateForPublish(course, [{ title: 'L', videoUrl: 'https://evil.example.com/x' }])
    ).toContain('bad_video_url')
  })

  it('refuses a download with no file attached', () => {
    const download: ProductDraft = { ...course, kind: 'download' }
    expect(validateForPublish(download, [], [])).toContain('download_needs_file')
    expect(validateForPublish(download, [], [{ fileName: 'guide.pdf' }])).toEqual([])
  })

  it('refuses a service that never says how it is delivered', () => {
    const service: ProductDraft = { ...course, kind: 'service' }
    expect(validateForPublish(service)).toContain('service_needs_delivery')
    expect(validateForPublish({ ...service, contactWhatsapp: '01712345678' })).toEqual([])
    expect(validateForPublish({ ...service, deliveryNote: 'I will email you.' })).toEqual([])
  })

  it('applies the same rule to a consultation', () => {
    const consult: ProductDraft = { ...course, kind: 'consultation' }
    expect(validateForPublish(consult)).toContain('service_needs_delivery')
  })

  it('distinguishes too-cheap from absurd, because the fix differs', () => {
    expect(validateForPublish({ ...course, priceBdt: 20 }, [lesson])).toContain('price_too_low')
    expect(validateForPublish({ ...course, priceBdt: 9_999_999 }, [lesson])).toContain(
      'price_out_of_range'
    )
    expect(validateForPublish({ ...course, priceBdt: -5 }, [lesson])).toContain('price_out_of_range')
  })

  it('lets a free product publish — that is the lead-magnet case', () => {
    expect(validateForPublish({ ...course, priceBdt: 0 }, [lesson])).toEqual([])
  })
})

describe('canTransition', () => {
  it('mirrors the database: a published product cannot be rewound to draft', () => {
    expect(canTransition('published', 'draft')).toBe(false)
    expect(canTransition('published', 'unpublished')).toBe(true)
    expect(canTransition('unpublished', 'published')).toBe(true)
  })

  it('lets a rejected product be fixed and resubmitted', () => {
    expect(canTransition('rejected', 'draft')).toBe(true)
    expect(canTransition('rejected', 'published')).toBe(false)
  })

  it('lets the operator take a live product down with a reason', () => {
    // Distinct from unpublish, which is indistinguishable from the seller
    // hiding it themselves.
    expect(canTransition('published', 'rejected')).toBe(true)
    expect(canTransition('unpublished', 'rejected')).toBe(true)
  })

  it('never allows a status to transition to itself', () => {
    for (const status of Object.keys(ALLOWED_TRANSITIONS) as ProductStatus[]) {
      expect(canTransition(status, status), status).toBe(false)
    }
  })
})

describe('slugify', () => {
  it('makes a link that survives being pasted into Facebook', () => {
    expect(slugify('Facebook Marketing Course!')).toBe('facebook-marketing-course')
    expect(slugify('  Spaced   Out  ')).toBe('spaced-out')
    expect(slugify('Café Résumé')).toBe('cafe-resume')
  })

  it('returns empty for a title with no Latin characters', () => {
    // Bangla titles produce nothing usable, so the caller must fall back to a
    // generated handle rather than shipping a percent-encoded URL.
    expect(slugify('ফেসবুক মার্কেটিং')).toBe('')
  })

  it('stays short enough to read', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(60)
  })
})
