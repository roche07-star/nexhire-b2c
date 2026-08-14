import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 만료된 면접 가이드 자동 삭제 크론
 *
 * Vercel Cron: 매일 자정 실행
 * Schedule: 0 0 * * *
 */
export async function GET(req: NextRequest) {
  try {
    // Vercel Cron Secret 검증
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date().toISOString()

    // 만료된 면접 가이드 삭제 (hard delete)
    const { data: expiredGuides, error: selectError } = await supabase
      .from('interview_guides')
      .select('id, user_email, expires_at')
      .lt('expires_at', now)
      .is('deleted_at', null)

    if (selectError) {
      console.error('[cleanup-expired-guides] Select error:', selectError)
      return NextResponse.json({ error: selectError.message }, { status: 500 })
    }

    if (!expiredGuides || expiredGuides.length === 0) {
      console.log('[cleanup-expired-guides] No expired guides found')
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: 'No expired guides to delete'
      })
    }

    // 삭제 실행
    const { error: deleteError } = await supabase
      .from('interview_guides')
      .delete()
      .lt('expires_at', now)
      .is('deleted_at', null)

    if (deleteError) {
      console.error('[cleanup-expired-guides] Delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log(`[cleanup-expired-guides] Deleted ${expiredGuides.length} expired guides`)

    return NextResponse.json({
      success: true,
      deleted: expiredGuides.length,
      timestamp: now
    })

  } catch (error) {
    console.error('[cleanup-expired-guides] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
