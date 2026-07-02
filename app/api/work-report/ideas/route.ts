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

    // 1. 먼저 DB에서 기존 아이디어 확인
    const { data: existingIdea } = await supabase
      .from('work_report_ideas')
      .select('ideas')
      .eq('user_email', userEmail)
      .eq('month_of', monthOf)
      .single()

    // 2. 기존 아이디어가 있으면 바로 반환
    if (existingIdea) {
      return NextResponse.json({ ideas: existingIdea.ideas, cached: true })
    }

    // 3. 없으면 Claude API 호출
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

한국어로 작성하고, 친근하면서도 전문적인 톤으로 작성해주세요.`
        }
      ]
    })

    const ideas = response.content[0].type === 'text' ? response.content[0].text : ''

    // 4. DB에 저장
    await supabase
      .from('work_report_ideas')
      .insert({
        user_email: userEmail,
        month_of: monthOf,
        ideas
      })

    return NextResponse.json({ ideas, cached: false })

  } catch (error: any) {
    console.error('아이디어 생성 오류:', error)
    return NextResponse.json(
      { error: error.message || '아이디어 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
