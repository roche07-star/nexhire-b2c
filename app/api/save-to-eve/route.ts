import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 2. 관리자 권한 확인
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    if (userData?.user_type !== 'MANAGER') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    // 3. 요청 데이터 파싱
    const { analysisId, candidateName, userEmail } = await req.json()

    if (!analysisId || !candidateName) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    // 4. Adam에서 분석 결과 가져오기
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('result, created_at')
      .eq('id', analysisId)
      .eq('user_email', userEmail || session.user.email)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: '분석 결과를 찾을 수 없습니다.' }, { status: 404 })
    }

    const result = analysis.result as any

    // 5. Eve candidates 형식으로 데이터 변환
    const candidateData = {
      name: candidateName,
      email: result.email || null,
      phone: result.phone || null,
      source: 'adam', // [adam 추천] 뱃지를 위한 플래그
      current_company: result.current_company || null,
      current_position: result.job_title || result.current_position || null,
      total_experience_years: result.total_experience_years || null,
      career_summary: result.summary || null,
      education: Array.isArray(result.education)
        ? result.education.map((e: any) => typeof e === 'string' ? e : `${e.degree || ''} ${e.major || ''} (${e.school || ''})`.trim())
        : (typeof result.education === 'string' ? [result.education] : []),
      skills: Array.isArray(result.keywords) ? result.keywords : (result.keywords ? [result.keywords] : []),
      tech_stack: Array.isArray(result.tech_stack) ? result.tech_stack : [],
      ideal_roles: Array.isArray(result.career_paths)
        ? result.career_paths.map((p: any) => p.title || p.type).filter(Boolean)
        : [],
      market_value: result.market_value || null,
      strength_summary: Array.isArray(result.strengths) ? result.strengths.join(', ') : result.strengths,
      weakness_summary: Array.isArray(result.improvements) ? result.improvements.join(', ') : result.improvements,
      career_trajectory: result.career_direction || result.growth_path || null,
      key_highlights: Array.isArray(result.strengths) ? result.strengths.slice(0, 3) : [],
      tags: ['adam-추천'],
      status: 'new',
      job_search_status: 'active',
      created_by: session.user.email,
      organization_id: null, // 관리자의 organization_id가 있다면 설정 필요
      metadata: {
        adam_analysis_id: analysisId,
        adam_analysis_date: analysis.created_at,
        competitiveness: result.competitiveness,
        fit_score: result.fit_score,
        growth_potential: result.growth_potential,
      }
    }

    // 6. Eve API 환경변수 확인
    const eveApiUrl = process.env.NEXT_PUBLIC_EVE_API_URL || process.env.EVE_API_URL
    if (!eveApiUrl) {
      console.error('[save-to-eve] EVE_API_URL 환경변수가 설정되지 않았습니다.')
      return NextResponse.json({
        error: 'Eve API URL이 설정되지 않았습니다. 관리자에게 문의하세요.'
      }, { status: 500 })
    }

    // 7. Eve API로 후보자 저장 요청
    console.log('[save-to-eve] Eve API 호출:', `${eveApiUrl}/api/candidates`)

    const eveResponse = await fetch(`${eveApiUrl}/api/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(candidateData)
    })

    if (!eveResponse.ok) {
      const errorData = await eveResponse.json().catch(() => ({}))
      console.error('[save-to-eve] Eve API 오류:', errorData)
      throw new Error(errorData.error || 'Eve API 호출 실패')
    }

    const eveData = await eveResponse.json()
    console.log('[save-to-eve] ✅ Eve 저장 성공:', eveData)

    return NextResponse.json({
      success: true,
      candidateId: eveData.id,
      message: `${candidateName} 후보자가 Eve에 저장되었습니다.`
    })

  } catch (error: any) {
    console.error('[save-to-eve] 오류:', error)
    return NextResponse.json({
      error: error.message || 'Eve 저장 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
