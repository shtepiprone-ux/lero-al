import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffRole } from '@/lib/auth/staff'
import { roleHasPermission } from '@/lib/auth/permissions'
import { uploadToCloudinary, publicIdFromUrl } from '@/lib/cloudinaryUpload'
import { deleteAsset } from '@/lib/cloudinaryDelete'
import { declaredTypeMatchesBytes } from '@/lib/uploads/imageSniff'
import { revalidatePath } from 'next/cache'

// ── Route handler ───────────────────────────────────────────────────────────
//
// POST /api/upload-popular-location-photo
//
// Body (multipart/form-data):
//   photo      — File (required) — JPG/PNG/WEBP, max 2 MB
//   locationId — string (required) — numeric id of the locations row
//
// Uploads to popular_locations/<locationId>/... (H.7 folder rule).
// Updates locations.image_url atomically.
//
// Security (Task 923 Revision 7, findings S4 / S15): only an admin or a moderator may call it (before, nobody was checked and anyone could replace the photo of
// any popular location on the public site), the location id must be a positive integer, and the file must be the image type it declares, judged by its bytes.

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024

export async function POST(req: NextRequest) {
  const role = await getStaffRole()
  if (!role) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  // Task 923 R66 (c): the photo is a write to `locations` (image_url), so it needs `locations.manage` like every other write to that table, checked before the body is read
  // and before anything is sent to Cloudinary.
  if (!(await roleHasPermission(role, 'locations.manage'))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 })
  }

  const file = formData.get('photo') as File | string | null
  const locationIdRaw = (formData.get('locationId') as string | null)?.trim()

  if (!file || typeof file === 'string') return NextResponse.json({ error: 'no_file' }, { status: 400 })
  if (!locationIdRaw || !/^[1-9]\d{0,9}$/.test(locationIdRaw)) return NextResponse.json({ error: 'no_location_id' }, { status: 400 })
  const locationId = Number(locationIdRaw)

  if (!VALID_TYPES.includes(file.type)) return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'file_too_large' }, { status: 400 })

  const db = createAdminClient()
  const { data: loc } = await db.from('locations').select('id, image_url').eq('id', locationId).single()
  if (!loc) return NextResponse.json({ error: 'location_not_found' }, { status: 404 })

  const bytes = await file.arrayBuffer()
  if (bytes.byteLength === 0) return NextResponse.json({ error: 'file_empty' }, { status: 400 })
  if (!declaredTypeMatchesBytes(file.type, bytes)) return NextResponse.json({ error: 'invalid_type' }, { status: 400 })

  let cloudUrl: string
  let newPublicId: string
  try {
    const result = await uploadToCloudinary(bytes, file.type, `popular_locations/${locationId}`)
    cloudUrl = result.url
    newPublicId = result.publicId
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

  // Task 923 R71 (g): the photo that was replaced is released, now that the row points at the new one (never before the row is saved). A file that is
  // still referenced somewhere else is kept by `deleteAsset` itself, and a failure here is logged, not returned: the replacement has already happened.
  const oldPublicId = publicIdFromUrl(loc.image_url as string | null)
  if (oldPublicId && oldPublicId !== newPublicId) {
    try {
      await deleteAsset(oldPublicId, { reason: 'popular_location_photo_replaced' })
    } catch (err) {
      console.error('[upload-popular-location-photo] old photo cleanup failed:', err)
    }
  }

  revalidatePath('/admin/popular-locations')

  return NextResponse.json({ url: cloudUrl })
}
