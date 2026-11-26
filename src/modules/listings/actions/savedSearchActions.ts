'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { canonicalizeFilters, computeFiltersHash } from '@/modules/listings/lib/savedSearchCanonicalize'

// ── Saved searches ────────────────────────────────────────────────────────────
// Moved from src/modules/cabinet/actions/index.ts (Task 1053): listings owns saved_searches, and listings may not import cabinet (MODULE_LAYERS, eslint.config.mjs).

export async function saveSavedSearch(
  rawParams: Record<string, string | string[] | undefined>,
  name: string,
): Promise<{ id?: string; error?: string; code?: 'already_exists' | 'unauthorized' }> {
  const userId = (await getUser())?.id ?? null
  if (!userId) return { error: 'Unauthorized', code: 'unauthorized' }

  const canonical = canonicalizeFilters(rawParams)
  const hash = computeFiltersHash(canonical)

  // a name is text of a sane length (Task 923 Revision 7); anything else is the default name
  const label = (typeof name === 'string' ? name.trim() : '').slice(0, 100) || 'Search'

  const supabase = await createClient()

  // Deduplication check: reject if the same canonical search already exists for this user.
  const { data: existing } = await supabase
    .from('saved_searches')
    .select('id')
    .eq('user_id', userId)
    .eq('filters_hash', hash)
    .maybeSingle()

  if (existing) return { error: 'already_saved', code: 'already_exists' }

  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id:      userId,
      name:         label,
      filters:      canonical,
      filters_hash: hash,
      notify_email: false,
    })
    .select('id')
    .single()

  if (error) {
    // Unique constraint violation: race condition — treat same as duplicate.
    if (error.code === '23505') return { error: 'already_saved', code: 'already_exists' }
    console.error('saveSavedSearch failed', { error, userId })
    return { error: 'save_failed' }
  }

  revalidatePath('/cabinet')
  return { id: data.id }
}
