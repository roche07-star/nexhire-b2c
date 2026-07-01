import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

// GET: 사용자의 이력서 분석 목록 조회
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email

    // 최근 10개 이력서 분석 조회
    const { data, error } = await supabase
      .from('analyses')
      .select('id, candidate_name, position, created_at')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Resumes fetch error:', error)
      throw new Error('이력서 목록 조회 실패')
    }

    return NextResponse.json({ resumes: data || [] })

  } catch (error: any) {
    console.error('Resumes GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resumes' },
      { status: 500 }
    )
  }
}
