import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadToCloudinary } from '@/lib/cloudinaryUpload'
import { revalidatePath } from 'next/cache'

// ── Route handler ─────────────────────────────────────────────────────────────
//
// POST /api/upload-popular-location-photo
//
// Body (multipart/form-data):
//   photo      — File (required) — JPG/PNG/WEBP, max 2 MB
//   locationId — string (required) — numeric id of the locations row
//
// Uploads to popular_locations/<locationId>/... (H.7 folder rule).
// Updates locations.image_url atomically.

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 })
  }

  const file = formData.get('photo') as File | null
  const locationIdRaw = (formData.get('locationId') as string | null)?.trim()
  const locationId = locationIdRaw ? Number(locationIdRaw) : NaN

  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 })
  if (!locationIdRaw || isNaN(locationId)) return NextResponse.json({ error: 'no_location_id' }, { status: 400 })

  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'file_too_large' }, { status: 400 })

  const db = createAdminClient()
  const { data: loc } = await db.from('locations').select('id').eq('id', locationId).single()
  if (!loc) return NextResponse.json({ error: 'location_not_found' }, { status: 404 })

  const bytes = await file.arrayBuffer()
  if (bytes.byteLength === 0) return NextResponse.json({ error: 'file_empty' }, { status: 400 })

  let cloudUrl: string
  try {
    const result = await uploadToCloudinary(bytes, file.type, `popular_locations/${locationId}`)
    cloudUrl = result.url
  } catch (e) {
    console.error('[upload-popular-location-photo] Cloudinary failed:', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 })
  }

  const { error: updateErr } = await db
    .from('locations')
    .update({ image_url: cloudUrl })
    .eq('id', locationId)

  if (updateErr) {
    console.error('[upload-popular-location-photo] DB update failed:', updateErr)
    return NextResponse.json({ error: 'db_save_failed' }, { status: 500 })
  }

  revalidatePath('/admin/popular-locations')

  return NextResponse.json({ url: cloudUrl })
}
