import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// GET: 이번 달 주간 리포트 목록 조회
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email

    // 이번 달 첫날 계산 (KST 기준)
    const now = new Date()
    const kstOffset = 9 * 60 * 60 * 1000
    const kstNow = new Date(now.getTime() + kstOffset)
    const firstDayOfMonth = new Date(Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      1, 0, 0, 0, 0
    ))

    // 이번 달 주간 리포트 조회
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_email', userEmail)
      .gte('week_of', firstDayOfMonth.toISOString().split('T')[0])
      .order('week_of', { ascending: false })

    if (error) {
      console.error('Weekly reports fetch error:', error)
      throw new Error('주간 리포트 조회 실패')
    }

    return NextResponse.json({ reports: data || [] })

  } catch (error: any) {
    console.error('Weekly reports GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weekly reports' },
      { status: 500 }
    )
  }
}

// POST: 주간 리포트 생성 (AI 정리 포함)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, weekOf } = body

    if (!content || !weekOf) {
      return NextResponse.json(
        { error: '업무 내용과 주차 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    const userEmail = session.user.email

    // 조직 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('organization, organization_type')
      .eq('email', userEmail)
      .single()

    const organization = userData?.organization || '소속 정보 없음'
    const orgType = userData?.organization_type || 'company'
    const orgLabel = orgType === 'company' ? '회사' : '학교'

    // AI로 정리
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `당신은 10년차 헤드헌터입니다. 구직자가 작성한 주간 업무 내용을 읽고, 이력서에 바로 사용할 수 있도록 전문적으로 정리해주세요.

**소속 정보:**
${orgLabel}: ${organization}

**주간 업무 내용:**
${content}

**정리 원칙 (헤드헌터 관점):**
1. **성과 중심**: "무엇을 했다"가 아니라 "무엇을 달성했다" 형식
2. **정량화**: 숫자, 비율, 기간 등 구체적 지표 강조
3. **기술 스택**: 사용한 도구, 기술, 방법론 명시
4. **임팩트**: 팀/회사에 미친 영향 기술
5. **간결함**: 핵심만 2-4개 항목으로 정리

**출력 형식:**
<ul>
  <li><strong>핵심 성과 1:</strong> 구체적인 설명 (정량적 지표 포함)</li>
  <li><strong>핵심 성과 2:</strong> 구체적인 설명 (기술 스택 포함)</li>
  ...
</ul>

HTML만 출력하고, 다른 설명은 생략하세요.`,
        },
      ],
    })

    const htmlContent = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleanHtml = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()

    // DB에 저장
    const { data, error } = await supabase
      .from('weekly_reports')
      .insert({
        user_email: userEmail,
        week_of: weekOf,
        original_content: content,
        ai_generated_html: cleanHtml,
      })
      .select()
      .single()

    if (error) {
      console.error('Weekly report insert error:', error)
      throw new Error('주간 리포트 저장 실패')
    }

    return NextResponse.json({
      success: true,
      report: data,
    })

  } catch (error: any) {
    console.error('Weekly report POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create weekly report' },
      { status: 500 }
    )
  }
}
