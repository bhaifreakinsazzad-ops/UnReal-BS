// What a product must have before it can be sold to the public.
//
// Kept out of the route so it can be unit-tested, and shared with the editor
// so the seller is told what is missing BEFORE they press Publish rather than
// getting a 400 back. Mirrors lib/meta/campaign-rules.ts.

import { isSellablePrice, MIN_PRICE_BDT } from './pricing'
import { isAcceptableVideoUrl } from './video'

export type ProductKind = 'course' | 'download' | 'service' | 'consultation'

export type ProductStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'unpublished'
  | 'rejected'

/** Mirrors unreal_bs_product_set_status in migration 0013. Kept in sync so the
 *  UI never offers a transition the database would reject — but the database
 *  stays the authority, not this table. */
export const ALLOWED_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  draft: ['pending_review', 'published'],
  pending_review: ['published', 'rejected', 'draft'],
  // 'rejected' from a live status is the operator taking something down with a
  // reason, which is deliberately distinct from an ordinary unpublish.
  published: ['unpublished', 'rejected'],
  unpublished: ['published', 'draft', 'rejected'],
  rejected: ['draft', 'pending_review'],
}

export function canTransition(from: ProductStatus, to: ProductStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to)
}

export interface ProductDraft {
  kind: ProductKind
  title?: string | null
  description?: string | null
  priceBdt: number
  deliveryNote?: string | null
  contactWhatsapp?: string | null
}

export interface LessonDraft {
  title?: string | null
  videoUrl?: string | null
  contentMd?: string | null
}

export interface AssetDraft {
  fileName?: string | null
}

export type PublishProblem =
  | 'missing_title'
  | 'missing_description'
  | 'price_too_low'
  | 'price_out_of_range'
  | 'course_needs_lessons'
  | 'lesson_needs_content'
  | 'bad_video_url'
  | 'download_needs_file'
  | 'service_needs_delivery'

/** Everything standing between this product and a public page. Returns an
 *  empty array when it is ready. Order matters: the UI shows the first one. */
export function validateForPublish(
  product: ProductDraft,
  lessons: LessonDraft[] = [],
  assets: AssetDraft[] = []
): PublishProblem[] {
  const problems: PublishProblem[] = []

  if (!product.title?.trim()) problems.push('missing_title')
  if (!product.description?.trim()) problems.push('missing_description')

  if (!isSellablePrice(product.priceBdt)) {
    // Distinguish "too cheap to process" from "absurd", because the fix is
    // different and a seller deserves to be told which one they hit.
    problems.push(
      product.priceBdt > 0 && product.priceBdt < MIN_PRICE_BDT ? 'price_too_low' : 'price_out_of_range'
    )
  }

  if (product.kind === 'course') {
    if (lessons.length === 0) {
      problems.push('course_needs_lessons')
    } else {
      // A lesson with a title and nothing else is an empty promise to whoever
      // paid for it.
      if (lessons.some((l) => !l.videoUrl?.trim() && !l.contentMd?.trim())) {
        problems.push('lesson_needs_content')
      }
      if (lessons.some((l) => !isAcceptableVideoUrl(l.videoUrl))) {
        problems.push('bad_video_url')
      }
    }
  }

  if (product.kind === 'download' && assets.length === 0) {
    problems.push('download_needs_file')
  }

  if (product.kind === 'service' || product.kind === 'consultation') {
    // Nothing is delivered automatically for these, so the buyer must be told
    // in advance exactly how they will be contacted.
    if (!product.deliveryNote?.trim() && !product.contactWhatsapp?.trim()) {
      problems.push('service_needs_delivery')
    }
  }

  return problems
}

/** URL-safe handle derived from a title. Latin-only output on purpose: a
 *  Bangla title produces no usable ASCII, so the caller falls back to a short
 *  random suffix rather than shipping a percent-encoded link that breaks when
 *  pasted into Facebook. */
const COMBINING_MARKS = /[̀-ͯ]/g

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
