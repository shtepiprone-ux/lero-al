const BASE_MAX_LENGTH = 80
const EMPTY_BASE = 'listing'

// A listing slug: the title as a-z and 0-9 joined by single hyphens, then the creation time in base 36.
// The database refuses a session INSERT whose slug is not ^[a-z0-9]+(-[a-z0-9]+)*$ or is longer than 120 characters (hardening v7.1), so the
// result matches that whatever the title holds: a run of hyphens collapses to one, the hyphens left by the 80-character cut are trimmed again,
// and a title with no Latin letter or digit gets the base `listing`. A plain module, not a Server Action (Task 923 R82 (d)).
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, BASE_MAX_LENGTH)
    .replace(/-+$/, '')
  return `${base || EMPTY_BASE}-${Date.now().toString(36)}`
}
