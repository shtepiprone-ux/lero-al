import { NextRequest, NextResponse } from 'next/server'
import { assertPermission } from '@/lib/auth/permissions'
import { uploadToCloudinary } from '@/lib/cloudinaryUpload'

// POST /api/upload-cms-image — Task 868 (R15).
//
// Body (multipart/form-data): `image` — File (JPEG, PNG or WEBP, at most 5 MB).
// Used by the CMS page editor's image control; the returned URL lives only in the page body HTML, so
// there is no database write. The caller must hold `legal.manage` (the permission that edits CMS
// pages); a missing session also fails that check, so the answer is 403 and nothing is uploaded.

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024
const FOLDER = 'cms/pages'

export async function POST(req: NextRequest) {
  try {
    await assertPermission('legal.manage')
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 })
  }

  // Not `instanceof File`: the multipart parser's File class is not always the global one.
  const file = formData.get('image') as File | string | null
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'no_file' }, { status: 400 })
  }
  if (!VALID_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: 'file_empty' }, { status: 400 })
  }

  try {
    const result = await uploadToCloudinary(bytes, file.type, FOLDER)
    return NextResponse.json({ url: result.url })
  } catch (e) {
    console.error('[upload-cms-image] Cloudinary failed:', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 })
  }
}
