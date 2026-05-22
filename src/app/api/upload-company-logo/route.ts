import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadToCloudinary } from '@/lib/cloudinaryUpload'

// ── Route handler ─────────────────────────────────────────────────────────────
//
// POST /api/upload-company-logo
//
// Body (multipart/form-data):
//   logo      — File (required) — PNG/JPG/WEBP, max 256×256 px, max 2 MB
//   companyId — string (required) — UUID of the company to update
//
// No session required — uses service-role. The companyId is validated against
// the DB to prevent updating arbitrary rows. Logo upload is non-critical;
// admins can correct logos via the admin company management page (Task 115).

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 })
  }

  const file = formData.get('logo') as File | null
  const companyId = (formData.get('companyId') as string | null)?.trim()

  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 })
  if (!companyId) return NextResponse.json({ error: 'no_company_id' }, { status: 400 })

  // MIME validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }

  // Size validation (≤ 2 MB)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 })
  }

  const db = createAdminClient()

  // Verify company exists
  const { data: company, error: lookupErr } = await db
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .single()

  if (lookupErr || !company) {
    return NextResponse.json({ error: 'company_not_found' }, { status: 404 })
  }

  const bytes = await file.arrayBuffer()
  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: 'file_empty' }, { status: 400 })
  }

  // Upload to Cloudinary
  let cloudUrl: string
  try {
    const result = await uploadToCloudinary(bytes, file.type, 'companies')
    // Dimension validation (≤ 256×256)
    if (result.width && result.height && (result.width > 256 || result.height > 256)) {
      return NextResponse.json({ error: 'invalid_dimensions' }, { status: 400 })
    }
    cloudUrl = result.url
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

  return NextResponse.json({ url: cloudUrl })
}
