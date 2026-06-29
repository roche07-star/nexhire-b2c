import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { getCached } from '@/lib/cache'
import type { CreateHiringProcessInput, HiringProcess } from '@/types/hiring-process'

export const maxDuration = 30

/**
 * GET /api/hiring-process
 * 채용 프로세스 목록 조회
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 캐싱 적용 (30초 TTL)
    const result = await getCached(
      `hiring-process:${session.user.email}`,
      async () => {
        const { data, error } = await supabase
          .from('hiring_processes')
          .select('*')
          .eq('user_email', session.user.email)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('[hiring-process] GET error:', error)
          throw new Error('조회 실패')
        }

        return { processes: data as HiringProcess[] }
      },
      30 // 30초 캐시
    )

    return NextResponse.json(result)
  } catch (e) {
    console.error('[hiring-process] GET exception:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

/**
 * POST /api/hiring-process
 * 채용 프로세스 생성
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await req.json() as CreateHiringProcessInput

    // 필수 필드 검증
    if (!body.position_title || !body.company_name || !body.candidate_name) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('hiring_processes')
      .insert({
        user_email: session.user.email,
        analysis_id: body.analysis_id || null,
        jd_analysis_id: body.jd_analysis_id || null,
        position_title: body.position_title,
        company_name: body.company_name,
        candidate_name: body.candidate_name,
        current_stage: body.current_stage ?? 0,
        status: body.status ?? 'ACTIVE',
        next_action: body.next_action || null,
        next_action_date: body.next_action_date || null,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[hiring-process] POST error:', error)
      return NextResponse.json({ error: '생성 실패' }, { status: 500 })
    }

    return NextResponse.json({ process: data as HiringProcess }, { status: 201 })
  } catch (e) {
    console.error('[hiring-process] POST exception:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
