'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { getBlockedError } from '@/lib/auth/blockCheck'
import type { CollectionWithCount } from '@/types/database'

// ── Reads (callable from client components as server actions) ─────────────────

export async function getCollectionsWithMembership(listingId: string): Promise<{
  collections: CollectionWithCount[]
  memberIds: string[]
}> {
  const authUser = await getUser()
  if (!authUser) return { collections: [], memberIds: [] }

  const supabase = await createClient()

  const { data: rawCollections } = await supabase
    .from('collections')
    .select('id, user_id, name, created_at, updated_at')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })

  const collections = rawCollections ?? []
  if (!collections.length) return { collections: [], memberIds: [] }

  const collectionIds = collections.map(c => c.id)

  const [{ data: allItems }, { data: memberItems }] = await Promise.all([
    supabase
      .from('collection_items')
      .select('collection_id')
      .in('collection_id', collectionIds),
    supabase
      .from('collection_items')
      .select('collection_id')
      .in('collection_id', collectionIds)
      .eq('listing_id', listingId),
  ])

  const countMap = new Map<string, number>()
  for (const item of (allItems ?? []) as { collection_id: string }[]) {
    countMap.set(item.collection_id, (countMap.get(item.collection_id) ?? 0) + 1)
  }

  return {
    collections: collections.map(c => ({
      ...c,
      item_count: countMap.get(c.id) ?? 0,
    })),
    memberIds: (memberItems ?? []).map((i: { collection_id: string }) => i.collection_id),
  }
}

// ── Writes ────────────────────────────────────────────────────────────────────

/**
 * Is this collection the caller's? (Task 923 Revision 7, finding S20.) `collection_items` is written by id, and an item row carries no user id, so the only thing
 * that kept person B from adding to or emptying person A's collection was a row-level-security policy this code cannot see (the project manifest lists the
 * cross-user check as not yet verified on a live database). The action asks the question itself, with the caller's own id, before it touches the items.
 */
async function callerOwnsCollection(
  supabase: Awaited<ReturnType<typeof createClient>>,
  collectionId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase.from('collections').select('id').eq('id', collectionId).eq('user_id', userId).maybeSingle()
  return !!data
}

export async function createCollection(
  name: string,
): Promise<{ collection: CollectionWithCount } | { error: string }> {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (!trimmed) return { error: 'name_required' }
  if (trimmed.length > 100) return { error: 'name_too_long' }

  const authUser = await getUser()
  if (!authUser) return { error: 'unauthenticated' }
  const blockError = await getBlockedError(authUser.id)
  if (blockError) return { error: blockError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: authUser.id, name: trimmed })
    .select('id, user_id, name, created_at, updated_at')
    .single()

  if (error) {
    console.error('Failed to create collection', { error, userId: authUser.id })
    return { error: error.code === '23505' ? 'name_duplicate' : 'create_failed' }
  }

  revalidatePath('/[locale]/favorites', 'page')
  return { collection: { ...data, item_count: 0 } }
}

export async function renameCollection(
  collectionId: string,
  newName: string,
): Promise<{ ok: true } | { error: string }> {
  const trimmed = typeof newName === 'string' ? newName.trim() : ''
  if (!trimmed) return { error: 'name_required' }
  if (trimmed.length > 100) return { error: 'name_too_long' }

  const authUser = await getUser()
  if (!authUser) return { error: 'unauthenticated' }
  const blockError = await getBlockedError(authUser.id)
  if (blockError) return { error: blockError }

  const supabase = await createClient()
  const { error } = await supabase
    .from('collections')
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', collectionId)
    .eq('user_id', authUser.id)

  if (error) {
    console.error('Failed to rename collection', { error, collectionId })
    return { error: 'update_failed' }
  }

  return { ok: true }
}

export async function deleteCollection(
  collectionId: string,
): Promise<{ ok: true } | { error: string }> {
  const authUser = await getUser()
  if (!authUser) return { error: 'unauthenticated' }
  const blockError = await getBlockedError(authUser.id)
  if (blockError) return { error: blockError }

  const supabase = await createClient()
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', authUser.id)

  if (error) {
    console.error('Failed to delete collection', { error, collectionId })
    return { error: 'delete_failed' }
  }

  return { ok: true }
}

export async function addToCollection(
  collectionId: string,
  listingId: string,
): Promise<{ ok: true } | { error: string }> {
  const authUser = await getUser()
  if (!authUser) return { error: 'unauthenticated' }
  const blockError = await getBlockedError(authUser.id)
  if (blockError) return { error: blockError }

  const supabase = await createClient()
  if (!(await callerOwnsCollection(supabase, collectionId, authUser.id))) return { error: 'collection_not_found' }
  const { error } = await supabase
    .from('collection_items')
    .insert({ collection_id: collectionId, listing_id: listingId })

  // 23505 = unique violation (already in collection) — treat as success
  if (error && error.code !== '23505') {
    console.error('Failed to add to collection', { error, collectionId, listingId })
    return { error: 'create_failed' }
  }

  revalidatePath('/[locale]/favorites', 'page')
  return { ok: true }
}

export async function removeFromCollection(
  collectionId: string,
  listingId: string,
): Promise<{ ok: true } | { error: string }> {
  const authUser = await getUser()
  if (!authUser) return { error: 'unauthenticated' }
  const blockError = await getBlockedError(authUser.id)
  if (blockError) return { error: blockError }

  const supabase = await createClient()
  if (!(await callerOwnsCollection(supabase, collectionId, authUser.id))) return { error: 'collection_not_found' }
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('listing_id', listingId)

  if (error) {
    console.error('Failed to remove from collection', { error, collectionId, listingId })
    return { error: 'delete_failed' }
  }

  return { ok: true }
}
