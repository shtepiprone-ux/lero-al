import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireViewer } from '@/lib/auth/requireViewer'
import { checkActorRank } from '@/lib/auth/staff'
import { roleHasPermission } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'
import { uploadToCloudinary, publicIdFromUrl, readImageSize } from '@/lib/cloudinaryUpload'
import { declaredTypeMatchesBytes } from '@/lib/uploads/imageSniff'
import { deleteAsset } from '@/lib/cloudinaryDelete'
import { isTrustedImageUrl } from '@/lib/uploads/imageUrl'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
  // The identity and the role come from requireViewer() (Task 923 R44): a blocked, deactivated, deleted or missing account of any role uploads
  // nothing, and a failed lookup is refused, not allowed.
  const viewer = await requireViewer()
  if (!viewer.ok) {
    return viewer.reason === 'lookup_failed'
      ? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = { id: viewer.userId }

  // Read multipart body — standard HTTP, no serialization issues
  let formData: FormData
  try {
    formData = await req.formData()
  } catch (e) {
    // no parser message reaches the browser (Task 923 R71 (f)): a fixed code, the cause stays in the server log
    console.error('[upload-avatar] form data could not be parsed:', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 })
  }

  const file = formData.get('avatar') as File | null
  const targetUserId = (formData.get('userId') as string | null) ?? null

  if (!file) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 })
  }

  // Authorization (Task 923 R66 (o)): it runs before the file is looked at and before its bytes are read.
  const isAdminOrModerator = viewer.role === 'admin' || viewer.role === 'moderator'
  const uploadForUserId = targetUserId ?? user.id

  if (targetUserId && targetUserId !== user.id) {
    if (!isAdminOrModerator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    // Task 923 R75: a moderator replacing another account's picture needs the `users.edit` key (an administrator holds every key)
    if (!(await roleHasPermission(viewer.role ?? '', 'users.edit'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    // Staff replacing ANOTHER account's picture obey the rank rule of the admin actions: a moderator cannot re-picture an administrator. An id that is not a
    // UUID, or has no account, is a 404; an unreadable rank is a refusal (the read fails closed).
    if (!UUID_RE.test(targetUserId)) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
    }
    const rank = await checkActorRank(user.id, targetUserId)
    if (rank.readFailed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!rank.targetFound) return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
    if (!rank.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // File validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 })
  }

  // Read binary bytes via standard HTTP multipart — works reliably in all environments
  const bytes = await file.arrayBuffer()
  console.log('[upload-avatar] bytes:', bytes.byteLength, 'type:', file.type, 'for:', uploadForUserId)

  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: 'file_empty' }, { status: 400 })
  }
  // The file must be the image type it declares, judged by its first bytes (the browser-declared type is chosen by the sender).
  if (!declaredTypeMatchesBytes(file.type, bytes)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }
  // Task 923 R71 (g): the size is read from the bytes BEFORE the upload. An image of the wrong size used to be uploaded first and judged from Cloudinary's answer,
  // and it stayed in the cloud account.
  const size = readImageSize(bytes)
  if (!size) return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  if (size.width !== 256 || size.height !== 256) {
    return NextResponse.json({ error: 'invalid_dimensions' }, { status: 400 })
  }

  // Upload to Cloudinary
  let cloudUrl: string
  let newPublicId: string
  try {
    const result = await uploadToCloudinary(bytes, file.type, `${uploadForUserId}/avatars`)
    console.log('[upload-avatar] Cloudinary ok:', result.width, 'x', result.height, 'public_id:', result.publicId)
    if (result.width && result.height && (result.width !== 256 || result.height !== 256)) {
      // Second line of defence: the header read before the upload said 256×256, Cloudinary decoded another size. The file is not kept.
      await deleteAsset(result.publicId, { reason: 'avatar_invalid_dimensions' }).catch((err) => console.error('[upload-avatar] cleanup failed:', err))
      return NextResponse.json({ error: 'invalid_dimensions' }, { status: 400 })
    }
    cloudUrl = result.url
    newPublicId = result.publicId
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[upload-avatar] Cloudinary failed:', msg)
    // a fixed code, as the other upload routes answer (Task 923 R71 (f)): the provider's message (it can name configuration) stays in the server log
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 })
  }

  // Task 923 R100: the address stored in `users.avatar_url` is on this project's Cloudinary (the `users` CHECK of hardening v8b requires it). The provider's answer is checked before
  // it is written; an address that is not trusted is never stored and the file just uploaded is released.
  if (!isTrustedImageUrl(cloudUrl)) {
    await deleteAsset(newPublicId, { reason: 'avatar_untrusted_url' }).catch((err) => console.error('[upload-avatar] cleanup failed:', err))
    return NextResponse.json({ error: 'db_save_failed' }, { status: 500 })
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
  const { data: updatedRows, error: updateError } = await db.from('users').update({ avatar_url: cloudUrl }).eq('id', uploadForUserId).select('id')
  if (updateError) {
    console.error('[upload-avatar] DB update failed:', updateError)
    return NextResponse.json({ error: 'db_save_failed' }, { status: 500 })
  }
  // Task 923 R66 (o): the update must have changed exactly one account. When it changed none (the account vanished since the check), nothing points at the
  // just-uploaded file: release it and answer 404, instead of reporting a success for a picture that no account has.
  if (updatedRows?.length !== 1) {
    try {
      await deleteAsset(newPublicId, { reason: 'avatar_unreferenced' })
    } catch (err) {
      console.error('[upload-avatar] cleanup of the unreferenced upload failed:', err)
    }
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
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
