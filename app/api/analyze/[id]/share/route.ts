import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params

    // 분석 결과가 사용자 소유인지 확인
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .eq('user_email', session.user.email)
      .single()

    if (fetchError || !analysis) {
      return NextResponse.json({ error: '분석 결과를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 기존 공유 토큰 확인
    if (analysis.share_token && analysis.share_expires_at) {
      const expiresAt = new Date(analysis.share_expires_at)
      if (expiresAt > new Date()) {
        // 유효한 토큰이 있으면 재사용
        return NextResponse.json({
          shareToken: analysis.share_token,
          shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://jobizic.vercel.app'}/share/${analysis.share_token}`,
          expiresAt: analysis.share_expires_at
        })
      }
    }

    // 새 공유 토큰 생성 (32자, URL-safe)
    const shareToken = crypto.randomBytes(16).toString('base64url')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30일 후 만료

    // 토큰 저장
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        share_token: shareToken,
        share_expires_at: expiresAt.toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('[share] Update error:', updateError)
      console.error('[share] Update error details:', JSON.stringify(updateError, null, 2))
      return NextResponse.json({
        error: `공유 설정 중 오류가 발생했습니다. ${updateError.message || ''}`,
        details: updateError
      }, { status: 500 })
    }

    return NextResponse.json({
      shareToken,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://jobizic.vercel.app'}/share/${shareToken}`,
      expiresAt: expiresAt.toISOString()
    })
  } catch (error) {
    console.error('[share] Error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 공유 해제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('analyses')
      .update({
        share_token: null,
        share_expires_at: null
      })
      .eq('id', id)
      .eq('user_email', session.user.email)

    if (error) {
      return NextResponse.json({ error: '공유 해제 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[share delete] Error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
