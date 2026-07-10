import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import type { CreatePipelineCandidateInput } from '@/types/pipeline'

/**
 * GET /api/pipeline
 * 채용 파이프라인 목록 조회
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('hiring_pipeline')
      .select('*')
      .eq('user_email', session.user.email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[pipeline/GET] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ candidates: data || [] })
  } catch (e: any) {
    console.error('[pipeline/GET] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

/**
 * POST /api/pipeline
 * 파이프라인에 후보자 추가
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const input: any = await req.json()

    const { data, error } = await supabase
      .from('hiring_pipeline')
      .insert({
        user_email: session.user.email,
        candidate_name: input.candidate_name,
        company_name: input.company_name,
        position_title: input.position_title,
        stage: input.stage || 'DOCUMENT_PREP', // 기본값: 서류 준비
        analysis_id: input.analysis_id || null,
        jd_analysis_id: input.jd_analysis_id || null,
        fit_score: input.fit_score || null,
        resume_title: input.resume_title || null,
        notes: input.notes || null,
        next_action: input.next_action || null,
        next_action_date: input.next_action_date || null,
        hired_date: input.hired_date || null,
        fee: input.fee ? parseFloat(input.fee) : null,
        salary: input.salary ? parseInt(input.salary) : null,
      })
      .select()
      .single()

    if (error) {
      console.error('[pipeline/POST] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ candidate: data })
  } catch (e: any) {
    console.error('[pipeline/POST] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
