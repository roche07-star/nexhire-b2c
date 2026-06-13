import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // 인증 확인
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email

    // 사용자 플랜 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // PRO 플랜 이상만 접근 가능
    if (userData.plan !== 'PRO' && userData.plan !== 'EXPERT') {
      return NextResponse.json(
        { error: 'PRO 플랜 이상만 이용 가능합니다.' },
        { status: 403 }
      )
    }

    // 요청 바디 파싱
    const body = await request.json()
    const { analysisId, tag } = body

    if (!analysisId || !tag) {
      return NextResponse.json(
        { error: 'analysisId and tag are required' },
        { status: 400 }
      )
    }

    // 태그 길이 체크 (20자)
    if (tag.length > 20) {
      return NextResponse.json(
        { error: '태그는 최대 20자까지 입니다.' },
        { status: 400 }
      )
    }

    // 본인 분석 데이터인지 확인
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('user_email')
      .eq('id', analysisId)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    if (analysis.user_email !== email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 기존 태그 개수 확인 (최대 5개)
    const { count } = await supabase
      .from('candidate_tags')
      .select('*', { count: 'exact', head: true })
      .eq('analysis_id', analysisId)
      .eq('user_email', email)

    if (count !== null && count >= 5) {
      return NextResponse.json(
        { error: '태그는 최대 5개까지 추가할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 태그 생성
    const { data, error } = await supabase
      .from('candidate_tags')
      .insert({
        analysis_id: analysisId,
        user_email: email,
        tag: tag.trim(),
      })
      .select()
      .single()

    if (error) {
      // 중복 태그인 경우
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '이미 동일한 태그가 존재합니다.' },
          { status: 400 }
        )
      }

      console.error('Tag create error:', error)
      return NextResponse.json(
        { error: 'Failed to create tag' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tag: data,
    })
  } catch (error) {
    console.error('Tag create error:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}
