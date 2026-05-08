import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  if (!slug) return NextResponse.json({ ok: false }, { status: 400 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('listings')
    .select('id, views_count')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error || !data) return NextResponse.json({ ok: false }, { status: 404 })

  await supabase
    .from('listings')
    .update({ views_count: data.views_count + 1 })
    .eq('id', data.id)

  return NextResponse.json({ ok: true })
}
