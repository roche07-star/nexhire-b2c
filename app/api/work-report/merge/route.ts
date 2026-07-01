import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// POST: 전체 월간 Report를 정리해서 이력서에 머지
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { analysisId } = body

    if (!analysisId) {
      return NextResponse.json(
        { error: '이력서 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const userEmail = session.user.email

    // 전체 주간 리포트 조회
    const { data: weeklyReports, error: weeklyError } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_email', userEmail)
      .order('week_of', { ascending: true })

    if (weeklyError || !weeklyReports || weeklyReports.length === 0) {
      return NextResponse.json(
        { error: '주간 리포트가 없습니다.' },
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

    // 전체 주간 리포트를 이력서 형식으로 정리
    const weeklyContents = weeklyReports
      .map((r) => `**${r.week_of}:**\n${r.ai_generated_html}`)
      .join('\n\n')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: `당신은 10년차 헤드헌터입니다. 구직자의 전체 주간 업무 리포트를 취합하여, 이력서의 "경력 사항" 형식으로 정리해주세요.

**소속 정보:**
${orgLabel}: ${organization}

**전체 주간 리포트:**
${weeklyContents}

**작성 원칙 (CRITICAL - 반드시 준수):**
1. **사실 기반**: 주간 리포트에 있는 내용만 사용. 없는 내용 추가 금지, 과장 금지
2. **이력서 형식**: 경력 사항 형식으로 전문적으로 정리
3. **시간순**: 최신 업무부터 배치
4. **중복 제거**: 비슷한 내용은 통합
5. **정량 정보**: 숫자가 명시된 경우에만 포함 (추측 금지)

**출력 형식 (이력서 경력 사항):**
<div>
  <h3>${organization}</h3>
  <p><strong>직무:</strong> 직무명</p>
  <p><strong>주요 업무 및 성과:</strong></p>
  <ul>
    <li>수행 업무 1 (구체적 설명)</li>
    <li>수행 업무 2 (구체적 설명)</li>
    ...
  </ul>
</div>

HTML만 출력하고, 다른 설명은 생략하세요.`,
        },
      ],
    })

    const htmlContent = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleanHtml = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()

    // 해당 이력서 분석 조회
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('analysis_result')
      .eq('id', analysisId)
      .eq('user_email', userEmail)
      .single()

    if (fetchError || !analysis) {
      return NextResponse.json(
        { error: '이력서를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // analysis_result JSON 파싱
    let analysisResult = typeof analysis.analysis_result === 'string'
      ? JSON.parse(analysis.analysis_result)
      : analysis.analysis_result

    // 업무 Report를 경력 사항에 추가
    if (!analysisResult.work_experience) {
      analysisResult.work_experience = []
    }

    // HTML을 텍스트로 변환 (간단하게)
    const tempDiv = cleanHtml.replace(/<[^>]*>/g, '\n').replace(/\s+/g, ' ').trim()

    // 새로운 경력 항목 추가
    analysisResult.work_experience.push({
      company: organization,
      title: '업무 Report (전체 기간 종합)',
      content: tempDiv,
      html: cleanHtml,
      added_at: new Date().toISOString(),
    })

    // 업데이트
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        analysis_result: JSON.stringify(analysisResult),
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)

    if (updateError) {
      console.error('Analysis update error:', updateError)
      throw new Error('이력서 업데이트 실패')
    }

    return NextResponse.json({
      success: true,
      message: '전체 업무 Report가 이력서에 머지되었습니다.',
      weeklyCount: weeklyReports.length,
    })

  } catch (error: any) {
    console.error('Work report merge error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to merge report' },
      { status: 500 }
    )
  }
}
