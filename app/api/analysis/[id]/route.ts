import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // 분석 결과 조회
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .eq('user_email', session.user.email)
      .single()

    if (error || !data) {
      console.error('Analysis fetch error:', error)
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // result JSON 파싱
    const result = typeof data.result === 'string'
      ? JSON.parse(data.result)
      : data.result

    return NextResponse.json({
      id: data.id,
      result,
      created_at: data.created_at,
      expires_at: data.expires_at,
    })
  } catch (error) {
    console.error('Analysis fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { candidate_name } = await request.json()

    // 기존 분석 결과 조회
    const { data: existing, error: fetchError } = await supabase
      .from('analyses')
      .select('result')
      .eq('id', id)
      .eq('user_email', session.user.email)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    // result JSON 파싱 및 업데이트
    const result = typeof existing.result === 'string'
      ? JSON.parse(existing.result)
      : existing.result

    result.candidate_name = candidate_name

    // 업데이트
    const { error: updateError } = await supabase
      .from('analyses')
      .update({ result })
      .eq('id', id)
      .eq('user_email', session.user.email)

    if (updateError) {
      console.error('Analysis update error:', updateError)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analysis update error:', error)
    return NextResponse.json({ error: 'Failed to update analysis' }, { status: 500 })
  }
}
