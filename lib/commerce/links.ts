// Public links a seller shares.
//
// The absolute form is resolved at CLICK time, never during render. Reading
// window.location while rendering makes the server and the browser disagree
// about what the page says, and holding it in state means calling setState
// from an effect just to learn our own hostname. Displaying the path and
// resolving the origin only when somebody copies or shares avoids both.

export function productPath(slug: string): string {
  return `/p/${slug}`
}

export function shopPath(storeSlug: string): string {
  return `/shop/${storeSlug}`
}

/** Absolute URL for a path, for clipboard and share targets.
 *
 *  EVENT HANDLERS ONLY. Calling this during render would produce different
 *  output on the server (the bare path) and in the browser (the full URL),
 *  which is a hydration mismatch. */
export function absoluteUrl(path: string): string {
  if (typeof window === 'undefined') return path
  return new URL(path, window.location.origin).toString()
}
