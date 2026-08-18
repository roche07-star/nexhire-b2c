import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

// GET - 목표 조회
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('goals')
      .eq('email', session.user.email)
      .single()

    if (userError) {
      console.error('Failed to fetch goals:', userError)
      Sentry.captureException(userError)
      return NextResponse.json({ error: '목표를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
    }

    // goals가 없으면 기본값 반환
    const goals = userData?.goals || {
      hiredTarget: 10,
      passedTarget: 20,
      proposalTarget: 10,
      settlements: {} // 연도별 정산 목표
    }

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('GET /api/dashboard/goals error:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: '목표를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
  }
}

// POST - 목표 저장
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { hiredTarget, passedTarget, proposalTarget, settlements } = body

    // 기존 데이터 조회
    const { data: userData } = await supabase
      .from('users')
      .select('goals')
      .eq('email', session.user.email)
      .single()

    const currentGoals = userData?.goals || {}

    // 새 목표 객체 생성
    const goals = {
      ...currentGoals,
      ...(hiredTarget !== undefined && { hiredTarget }),
      ...(passedTarget !== undefined && { passedTarget }),
      ...(proposalTarget !== undefined && { proposalTarget }),
      ...(settlements !== undefined && { settlements })
    }

    // 유효성 검사 (선택적 필드)
    if (
      (hiredTarget !== undefined && (typeof hiredTarget !== 'number' || hiredTarget < 0)) ||
      (passedTarget !== undefined && (typeof passedTarget !== 'number' || passedTarget < 0)) ||
      (proposalTarget !== undefined && (typeof proposalTarget !== 'number' || proposalTarget < 0))
    ) {
      return NextResponse.json({ error: 'Invalid goals data' }, { status: 400 })
    }

    // Supabase에 저장
    const { error: updateError } = await supabase
      .from('users')
      .update({ goals })
      .eq('email', session.user.email)

    if (updateError) {
      console.error('Failed to save goals:', updateError)
      Sentry.captureException(updateError)
      return NextResponse.json({ error: '목표를 저장하는 중 오류가 발생했습니다. 고객센터로 문의해주세요.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, goals })
  } catch (error) {
    console.error('POST /api/dashboard/goals error:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: '목표를 저장하는 중 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
  }
}
