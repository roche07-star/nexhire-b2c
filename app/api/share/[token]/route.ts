import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // 토큰으로 분석 결과 조회
    const { data: analysis, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('share_token', token)
      .single()

    if (error || !analysis) {
      return NextResponse.json({ error: '공유된 분석 결과를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 만료 확인
    if (analysis.share_expires_at) {
      const expiresAt = new Date(analysis.share_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json({ error: '공유 기간이 만료되었습니다.' }, { status: 410 })
      }
    }

    // 개인정보 제거 (read-only)
    const publicResult = {
      ...analysis.result,
      candidate_name: '비공개', // 이름 숨김
    }

    return NextResponse.json({
      result: publicResult,
      created_at: analysis.created_at,
      expires_at: analysis.share_expires_at,
      shared: true
    })
  } catch (error) {
    console.error('[share/token] Error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
