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
