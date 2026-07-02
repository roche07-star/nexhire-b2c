import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { Anthropic } from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportHtml, monthOf } = body

    if (!reportHtml || !monthOf) {
      return NextResponse.json(
        { error: '리포트 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    const userEmail = session.user.email

    // 1. 월간 리포트의 updated_at 확인
    const { data: monthlyReport } = await supabase
      .from('monthly_reports')
      .select('updated_at')
      .eq('user_email', userEmail)
      .eq('month_of', monthOf)
      .single()

    if (!monthlyReport) {
      return NextResponse.json(
        { error: '월간 리포트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const reportUpdatedAt = monthlyReport.updated_at

    // 2. DB에서 기존 아이디어 확인
    const { data: existingIdea } = await supabase
      .from('work_report_ideas')
      .select('ideas, report_updated_at')
      .eq('user_email', userEmail)
      .eq('month_of', monthOf)
      .single()

    // 3. 기존 아이디어가 있고, 리포트가 변경되지 않았으면 캐시 반환
    if (existingIdea && existingIdea.report_updated_at === reportUpdatedAt) {
      return NextResponse.json({ ideas: existingIdea.ideas, cached: true })
    }

    // 4. 리포트가 업데이트되었거나 아이디어가 없으면 재분석 필요
    console.log('[ideas] 재분석 필요:', {
      hasExisting: !!existingIdea,
      reportUpdated: existingIdea?.report_updated_at !== reportUpdatedAt
    })

    // 5. Claude API 호출
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `다음은 ${monthOf} 월간 업무 리포트입니다:

${reportHtml.replace(/<[^>]*>/g, '')}

이 리포트를 분석하고, 업무 진행 시 더 체계적이고 실행 가능한 개선 아이디어를 3-5개 제시해주세요.

개선 초점:
- 시간 관리 및 일정 계획
- 업무 프로세스의 효율화
- 문서 및 정보 관리 체계
- 진행 상황 추적 및 모니터링
- 커뮤니케이션 및 팔로우업

형식:
1. [영역] 구체적인 개선 아이디어
   - 왜 필요한가
   - 어떻게 실행할 것인가

작성 규칙:
- 일반 텍스트로만 작성 (마크다운 볼드, 이탤릭 등 사용 금지)
- 한국어로 작성
- 친근하면서도 전문적인 톤`
        }
      ]
    })

    const ideas = response.content[0].type === 'text' ? response.content[0].text : ''

    // 6. DB에 저장 (기존 아이디어가 있으면 update, 없으면 insert)
    if (existingIdea) {
      // 업데이트
      await supabase
        .from('work_report_ideas')
        .update({
          ideas,
          report_updated_at: reportUpdatedAt
        })
        .eq('user_email', userEmail)
        .eq('month_of', monthOf)
    } else {
      // 삽입
      await supabase
        .from('work_report_ideas')
        .insert({
          user_email: userEmail,
          month_of: monthOf,
          ideas,
          report_updated_at: reportUpdatedAt
        })
    }

    return NextResponse.json({ ideas, cached: false, regenerated: !!existingIdea })

  } catch (error: any) {
    console.error('아이디어 생성 오류:', error)
    return NextResponse.json(
      { error: error.message || '아이디어 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
