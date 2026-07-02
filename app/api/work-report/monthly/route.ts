import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// GET: 월간 리포트 조회 (monthOf 있으면 단건, 없으면 전체)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthOf = searchParams.get('monthOf') // YYYY-MM-01 형식

    const userEmail = session.user.email

    if (monthOf) {
      // 특정 월 조회 (단건)
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
    } else {
      // 전체 월간 리포트 조회 (최근 6개월)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const startDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`

      const { data, error } = await supabase
        .from('monthly_reports')
        .select('*')
        .eq('user_email', userEmail)
        .gte('month_of', startDate)
        .order('month_of', { ascending: false })

      if (error) {
        console.error('Monthly reports fetch error:', error)
        throw new Error('월간 리포트 조회 실패')
      }

      return NextResponse.json({ reports: data || [] })
    }

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

    console.log('📊 월간 Report 생성 요청:', { monthOf, userEmail: session.user.email })

    if (!monthOf) {
      return NextResponse.json(
        { error: '월 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    const userEmail = session.user.email

    // 해당 월의 주간 리포트 조회 (해당 월 -7일 ~ +1개월 범위로 확장하여 월경계 주 포함)
    const monthDate = new Date(monthOf)
    const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), monthDate.getDate() - 7)
    const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)

    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
    const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

    console.log('📊 주간 리포트 조회 범위:', { startDateStr, endDateStr })

    const { data: weeklyReports, error: fetchError } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_email', userEmail)
      .gte('week_of', startDateStr)
      .lt('week_of', endDateStr)
      .order('week_of', { ascending: true })

    console.log('📊 조회된 주간 리포트:', { count: weeklyReports?.length, reports: weeklyReports?.map(r => r.week_of) })

    if (fetchError) {
      console.error('Weekly reports fetch error:', fetchError)
      throw new Error('주간 리포트 조회 실패')
    }

    if (!weeklyReports || weeklyReports.length === 0) {
      return NextResponse.json(
        { error: '해당 월에 주간 리포트가 없습니다. 주간 리포트를 먼저 작성해주세요.' },
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

**작성 원칙 (CRITICAL - 반드시 준수):**
1. **사실 기반**: 주간 리포트에 있는 내용만 사용. 없는 내용 추가 금지, 과장 금지
2. **중복 제거**: 비슷한 내용은 하나로 통합
3. **정량 정보**: 숫자가 명시된 경우에만 합산 (추측 금지)
4. **가운데 점(·) 절대 사용 금지**: "/" 또는 "," 사용
5. **AI 스러운 표현 절대 금지**: "~을 통해", "~에 기여", "적극적으로", "효과적으로" 등
6. **자연스러운 표현**: 간결하고 직접적으로 (예: "매출 5억 달성" ○, "효과적으로 매출 5억 달성에 기여" ×)
7. **간결함**: 주간 리포트 내용을 요약 정리

**출력 형식:**
<div>
  <h3>${organization} - ${new Date(monthOf).getFullYear()}년 ${new Date(monthOf).getMonth() + 1}월 주요 업무</h3>
  <ul>
    <li><strong>수행 업무:</strong> 주간 리포트 내용 요약</li>
    ...
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
      .select('id, aggregated_html')
      .eq('user_email', userEmail)
      .eq('month_of', monthOf)
      .single()

    let data, error

    if (existingReport) {
      // 중복 체크: 기존 월간 리포트와 신규 내용의 유사도 측정
      const existingText = String(existingReport.aggregated_html || '').replace(/<[^>]*>/g, ' ').toLowerCase()
      const newText = cleanHtml.replace(/<[^>]*>/g, ' ').toLowerCase()

      const existingWords = new Set(existingText.split(/\s+/).filter((w: string) => w.length > 2))
      const newWords = new Set(newText.split(/\s+/).filter((w: string) => w.length > 2))

      const commonWords = new Set([...existingWords].filter((w: string) => newWords.has(w)))
      const similarity = commonWords.size / Math.max(existingWords.size, newWords.size)

      console.log('📊 월간 리포트 유사도:', {
        existing: existingWords.size,
        new: newWords.size,
        common: commonWords.size,
        similarity: (similarity * 100).toFixed(1) + '%'
      })

      // 70% 이상 유사하면 업데이트 거부
      if (similarity >= 0.7) {
        return NextResponse.json(
          {
            error: '신규 주간 Report 재작성 필요',
            message: '기존 월간 Report와 70% 이상 중복됩니다.\n새로운 업무 내용으로 주간 Report를 작성해주세요.',
            similarity: Math.round(similarity * 100)
          },
          { status: 409 }
        )
      }

      // 업데이트 (applied_to_analysis_id를 NULL로 리셋하여 "미반영" 상태로 전환)
      const result = await supabase
        .from('monthly_reports')
        .update({
          aggregated_html: cleanHtml,
          applied_to_analysis_id: null
        })
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

    // 월간 Report 생성 성공 후 해당 주간 Report 삭제
    const { error: deleteError } = await supabase
      .from('weekly_reports')
      .delete()
      .eq('user_email', userEmail)
      .gte('week_of', startDateStr)
      .lt('week_of', endDateStr)

    if (deleteError) {
      console.error('주간 Report 삭제 실패 (non-fatal):', deleteError)
      // 삭제 실패는 치명적이지 않으므로 계속 진행
    } else {
      console.log('✅ 주간 Report 삭제 완료:', weeklyReports?.length, '개')
    }

    return NextResponse.json({
      success: true,
      report: data,
      deletedWeeklyReports: weeklyReports?.length || 0
    })

  } catch (error: any) {
    console.error('Monthly report POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create monthly report' },
      { status: 500 }
    )
  }
}
