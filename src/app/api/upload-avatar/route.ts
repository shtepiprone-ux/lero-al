import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { uploadToCloudinary, publicIdFromUrl } from '@/lib/cloudinaryUpload'
import { deleteAsset } from '@/lib/cloudinaryDelete'

// ── Route handler ─────────────────────────────────────────────────────────────
//
// POST /api/upload-avatar
//
// Body (multipart/form-data):
//   avatar  — File (required) — 256×256 JPEG from AvatarCropModal canvas
//   userId  — string (optional) — when present, performs an admin upload for
//             the target user (requires admin/moderator role); when absent,
//             uploads the avatar for the currently authenticated user.
//
// This is a standard HTTP route handler — binary data is transmitted via
// normal multipart/form-data and is NEVER subject to React Flight / Server
// Action serialization. This ensures file.arrayBuffer() always returns the
// correct bytes regardless of Next.js version or environment.

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Read multipart body — standard HTTP, no serialization issues
  let formData: FormData
  try {
    formData = await req.formData()
  } catch (e) {
    return NextResponse.json({ error: `Failed to parse form data: ${e instanceof Error ? e.message : String(e)}` }, { status: 400 })
  }

  const file = formData.get('avatar') as File | null
  const targetUserId = (formData.get('userId') as string | null) ?? null

  if (!file) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 })
  }

  // File validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 })
  }

  // Authorization
  const supabase = await createClient()
  const { data: myProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
  const isAdminOrModerator = myProfile?.role === 'admin' || myProfile?.role === 'moderator'
  const uploadForUserId = targetUserId ?? user.id

  if (targetUserId && targetUserId !== user.id && !isAdminOrModerator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Read binary bytes via standard HTTP multipart — works reliably in all environments
  const bytes = await file.arrayBuffer()
  console.log('[upload-avatar] bytes:', bytes.byteLength, 'type:', file.type, 'for:', uploadForUserId)

  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: 'file_empty' }, { status: 400 })
  }

  // Upload to Cloudinary
  let cloudUrl: string
  let newPublicId: string
  try {
    const result = await uploadToCloudinary(bytes, file.type, `${uploadForUserId}/avatars`)
    console.log('[upload-avatar] Cloudinary ok:', result.width, 'x', result.height, 'public_id:', result.publicId)
    if (result.width && result.height && (result.width !== 256 || result.height !== 256)) {
      return NextResponse.json({ error: 'invalid_dimensions' }, { status: 400 })
    }
    cloudUrl = result.url
    newPublicId = result.publicId
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[upload-avatar] Cloudinary failed:', msg)
    // Always return the real error — this route is authenticated; no security risk in exposing it
    return NextResponse.json({ error: `Cloudinary: ${msg}` }, { status: 500 })
  }

  // Capture old avatar URL before overwriting — needed for H.3 cleanup below.
  const db = createAdminClient()
  const { data: priorProfile } = await db
    .from('users')
    .select('avatar_url')
    .eq('id', uploadForUserId)
    .single()
  const oldAvatarUrl = priorProfile?.avatar_url ?? null

  // Update DB — MUST happen before any Cloudinary delete (never delete before DB commit).
  const { error: updateError } = await db.from('users').update({ avatar_url: cloudUrl }).eq('id', uploadForUserId)
  if (updateError) {
    console.error('[upload-avatar] DB update failed:', updateError)
    return NextResponse.json({ error: 'db_save_failed' }, { status: 500 })
  }

  // H.3: delete the old avatar now that DB points to the new one.
  // Skip if there was no prior avatar, or the same asset was re-uploaded (idempotent).
  const oldPublicId = publicIdFromUrl(oldAvatarUrl)
  if (oldPublicId && oldPublicId !== newPublicId) {
    try {
      await deleteAsset(oldPublicId, { reason: 'avatar_replaced' })
    } catch (err) {
      // Non-fatal — DB is already updated; log and continue.
      console.error('[upload-avatar] old avatar cleanup failed:', err)
    }
  }

  // Cache invalidation
  if (targetUserId) {
    revalidatePath(`/admin/users/${targetUserId}`)
  } else {
    revalidatePath('/cabinet')
  }

  return NextResponse.json({ url: cloudUrl })
}
