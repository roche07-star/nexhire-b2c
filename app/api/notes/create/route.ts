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
    const { analysisId, note } = body

    if (!analysisId || !note) {
      return NextResponse.json(
        { error: 'analysisId and note are required' },
        { status: 400 }
      )
    }

    // 메모 길이 체크 (500자)
    if (note.length > 500) {
      return NextResponse.json(
        { error: '메모는 최대 500자까지 입니다.' },
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

    // 메모 생성
    const { data, error } = await supabase
      .from('candidate_notes')
      .insert({
        analysis_id: analysisId,
        user_email: email,
        note: note.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('Note create error:', error)
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      note: data,
    })
  } catch (error) {
    console.error('Note create error:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
