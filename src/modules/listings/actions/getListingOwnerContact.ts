'use server'

import { createClient } from '@/lib/supabase/server'

export async function getListingOwnerContact(listingId: string): Promise<{
  phone: string | null
  whatsapp: string | null
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_listing_owner_contact', {
      listing_id_param: listingId,
    })
    if (error) {
      console.error('[contact] get_listing_owner_contact failed', { error, listingId })
      return { phone: null, whatsapp: null, error: 'load_failed' }
    }
    const row = (data as { phone: string | null; whatsapp: string | null }[] | null)?.[0]
    return { phone: row?.phone ?? null, whatsapp: row?.whatsapp ?? null }
  } catch (err) {
    console.error('[contact] get_listing_owner_contact unexpected error', err)
    return { phone: null, whatsapp: null, error: 'load_failed' }
  }
}
