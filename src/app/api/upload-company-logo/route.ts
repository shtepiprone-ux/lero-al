import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkStaff } from '@/lib/auth/staff'
import { uploadToCloudinary, readImageSize, publicIdFromUrl } from '@/lib/cloudinaryUpload'
import { deleteAsset } from '@/lib/cloudinaryDelete'
import { declaredTypeMatchesBytes } from '@/lib/uploads/imageSniff'

// ── Route handler ───────────────────────────────────────────────────────────
//
// POST /api/upload-company-logo
//
// Body (multipart/form-data):
//   logo      — File (required) — PNG/JPG/WEBP, max 256×256 px, max 2 MB
//   companyId — string (required) — UUID of the company to update
//
// Who may call it (Task 923 Revision 7, findings S3 / S15; Task 926): staff only — an administrator, or a moderator who holds `companies.manage`.
// Everyone else, signed in or not, gets 403 before the body is read, the company is looked up or anything is uploaded.
// The file must be the image type it declares, judged by its first bytes, not by the browser-declared type.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024

export async function POST(req: NextRequest) {
  // Authorisation first, before the body is parsed: a stranger learns nothing about which companies exist and cannot make the server buffer an upload.
  // Task 923 R75: a moderator needs the `companies.manage` key to replace a company's logo (an administrator holds every key)
  const staffCheck = await checkStaff({ permission: 'companies.manage' })
  if (!staffCheck.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 })
  }

  const file = formData.get('logo') as File | string | null
  const companyId = (formData.get('companyId') as string | null)?.trim()

  if (!file || typeof file === 'string') return NextResponse.json({ error: 'no_file' }, { status: 400 })
  if (!companyId || !UUID_RE.test(companyId)) return NextResponse.json({ error: 'no_company_id' }, { status: 400 })

  if (!VALID_TYPES.includes(file.type)) return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'file_too_large' }, { status: 400 })

  const db = createAdminClient()

  // Verify company exists
  const { data: company, error: lookupErr } = await db
    .from('companies')
    .select('id, logo_url')
    .eq('id', companyId)
    .single()

  if (lookupErr || !company) {
    return NextResponse.json({ error: 'company_not_found' }, { status: 404 })
  }

  const bytes = await file.arrayBuffer()
  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: 'file_empty' }, { status: 400 })
  }
  if (!declaredTypeMatchesBytes(file.type, bytes)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }
  // Task 923 R71 (g): the size is read from the bytes BEFORE the upload (≤ 256×256). A logo of the wrong size used to be uploaded first and judged from
  // Cloudinary's answer, and it stayed in the cloud account.
  const size = readImageSize(bytes)
  if (!size) return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  if (size.width > 256 || size.height > 256) {
    return NextResponse.json({ error: 'invalid_dimensions' }, { status: 400 })
  }

  // Upload to Cloudinary
  let cloudUrl: string
  let newPublicId: string
  try {
    const result = await uploadToCloudinary(bytes, file.type, `companies/${companyId}`)
    // Dimension validation (≤ 256×256)
    if (result.width && result.height && (result.width > 256 || result.height > 256)) {
      return NextResponse.json({ error: 'invalid_dimensions' }, { status: 400 })
    }
    cloudUrl = result.url
    newPublicId = result.publicId
  } catch (e) {
    console.error('[upload-company-logo] Cloudinary failed:', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 })
  }

  // Update company logo_url
  const { error: updateErr } = await db
    .from('companies')
    .update({ logo_url: cloudUrl })
    .eq('id', companyId)

  if (updateErr) {
    console.error('[upload-company-logo] DB update failed:', updateErr)
    return NextResponse.json({ error: 'db_save_failed' }, { status: 500 })
  }

  // Task 923 R71 (g): the logo that was replaced is released, now that the company points at the new one (never before the row is saved). A file that is still
  // referenced somewhere else is kept by `deleteAsset` itself, and a failure here is logged, not returned: the replacement has already happened.
  const oldPublicId = publicIdFromUrl(company.logo_url)
  if (oldPublicId && oldPublicId !== newPublicId) {
    try {
      await deleteAsset(oldPublicId, { reason: 'company_logo_replaced' })
    } catch (err) {
      console.error('[upload-company-logo] old logo cleanup failed:', err)
    }
  }

  return NextResponse.json({ url: cloudUrl })
}
