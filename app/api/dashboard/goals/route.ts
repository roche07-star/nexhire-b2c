import { NextRequest, NextResponse } from 'next/server'
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
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
    }

    // goals가 없으면 기본값 반환
    const goals = userData?.goals || {
      hiredTarget: 10,
      passedTarget: 20,
      proposalTarget: 10
    }

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('GET /api/dashboard/goals error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    const { hiredTarget, passedTarget, proposalTarget } = body

    // 유효성 검사
    if (
      typeof hiredTarget !== 'number' ||
      typeof passedTarget !== 'number' ||
      typeof proposalTarget !== 'number' ||
      hiredTarget < 0 ||
      passedTarget < 0 ||
      proposalTarget < 0
    ) {
      return NextResponse.json({ error: 'Invalid goals data' }, { status: 400 })
    }

    const goals = {
      hiredTarget,
      passedTarget,
      proposalTarget
    }

    // Supabase에 저장
    const { error: updateError } = await supabase
      .from('users')
      .update({ goals })
      .eq('email', session.user.email)

    if (updateError) {
      console.error('Failed to save goals:', updateError)
      return NextResponse.json({ error: 'Failed to save goals' }, { status: 500 })
    }

    return NextResponse.json({ success: true, goals })
  } catch (error) {
    console.error('POST /api/dashboard/goals error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
