// The Supabase Storage bucket holding files that buyers pay for.
//
// PRIVATE, created in migration 0013. Nothing is ever served from it directly:
// a download request goes to a route handler which checks the order is paid
// and then mints a short-lived signed URL. The storage path never leaves the
// server, so a leaked database row is not a leaked file.
//
// Lives in lib/ rather than in the upload route because Next.js route files
// may only export HTTP methods and route config — a stray export there is a
// build error, and both the upload route and the download route need this.

export const PRODUCT_BUCKET = 'product-files'

/** How long a download link stays valid. Long enough to click, short enough
 *  that a link forwarded to a group chat is dead before it is useful. */
export const SIGNED_URL_TTL_SECONDS = 60
