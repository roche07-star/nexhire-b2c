import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// GET: 월간 리포트 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthOf = searchParams.get('monthOf') // YYYY-MM-01 형식

    const userEmail = session.user.email

    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('user_email', userEmail)
      .eq('month_of', monthOf)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Monthly report fetch error:', error)
      throw new Error('월간 리포트 조회 실패')
    }

    return NextResponse.json({ report: data || null })

  } catch (error: any) {
    console.error('Monthly report GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch monthly report' },
      { status: 500 }
    )
  }
}

// POST: 월간 리포트 생성
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { monthOf } = body // YYYY-MM-01 형식

    if (!monthOf) {
      return NextResponse.json(
        { error: '월 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    const userEmail = session.user.email

    // 해당 월의 주간 리포트 조회
    const { data: weeklyReports, error: fetchError } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_email', userEmail)
      .gte('week_of', monthOf)
      .lt('week_of', new Date(new Date(monthOf).setMonth(new Date(monthOf).getMonth() + 1)).toISOString().split('T')[0])
      .order('week_of', { ascending: true })

    if (fetchError) {
      console.error('Weekly reports fetch error:', fetchError)
      throw new Error('주간 리포트 조회 실패')
    }

    if (!weeklyReports || weeklyReports.length === 0) {
      return NextResponse.json(
        { error: '해당 월에 주간 리포트가 없습니다.' },
        { status: 400 }
      )
    }

    // 조직 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('organization, organization_type')
      .eq('email', userEmail)
      .single()

    const organization = userData?.organization || '소속 정보 없음'
    const orgType = userData?.organization_type || 'company'
    const orgLabel = orgType === 'company' ? '회사' : '학교'

    // AI로 월간 리포트 생성
    const weeklyContents = weeklyReports
      .map((r, index) => `**Week ${index + 1} (${r.week_of}):**\n${r.ai_generated_html}`)
      .join('\n\n')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `당신은 10년차 헤드헌터입니다. 구직자의 주간 업무 리포트를 취합하여, 이력서의 "경력 사항" 섹션에 들어갈 월간 종합 리포트를 작성해주세요.

**소속 정보:**
${orgLabel}: ${organization}

**주간 리포트 목록:**
${weeklyContents}

**작성 원칙 (헤드헌터 관점):**
1. **중복 제거**: 비슷한 내용은 하나로 통합
2. **우선순위**: 임팩트가 큰 성과부터 배치
3. **정량화**: 누적 성과는 합산하여 표시 (예: "4주간 10건 처리" → "월 10건 처리")
4. **전문성**: 이력서에 바로 복사할 수 있는 완성도
5. **간결함**: 핵심 성과 3-5개로 정리

**출력 형식:**
<div>
  <h3>${organization} - ${new Date(monthOf).getFullYear()}년 ${new Date(monthOf).getMonth() + 1}월 주요 성과</h3>
  <ul>
    <li><strong>핵심 성과 1:</strong> 구체적인 설명 (정량적 지표)</li>
    <li><strong>핵심 성과 2:</strong> 구체적인 설명 (기술 스택)</li>
    <li><strong>핵심 성과 3:</strong> 구체적인 설명 (임팩트)</li>
  </ul>
</div>

HTML만 출력하고, 다른 설명은 생략하세요.`,
        },
      ],
    })

    const htmlContent = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleanHtml = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()

    // 기존 월간 리포트가 있으면 업데이트, 없으면 생성
    const { data: existingReport } = await supabase
      .from('monthly_reports')
      .select('id')
      .eq('user_email', userEmail)
      .eq('month_of', monthOf)
      .single()

    let data, error

    if (existingReport) {
      // 업데이트
      const result = await supabase
        .from('monthly_reports')
        .update({ aggregated_html: cleanHtml })
        .eq('id', existingReport.id)
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      // 생성
      const result = await supabase
        .from('monthly_reports')
        .insert({
          user_email: userEmail,
          month_of: monthOf,
          aggregated_html: cleanHtml,
          applied_to_resume: false,
        })
        .select()
        .single()

      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Monthly report save error:', error)
      throw new Error('월간 리포트 저장 실패')
    }

    return NextResponse.json({
      success: true,
      report: data,
    })

  } catch (error: any) {
    console.error('Monthly report POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create monthly report' },
      { status: 500 }
    )
  }
}
