import { supabase } from './supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * 이력서 분석 결과에 월간 Report를 자동으로 통합
 *
 * @param analysisId - 생성된 이력서 분석 ID
 * @param userEmail - 사용자 이메일
 * @param currentResult - 현재 분석 결과
 * @returns 업데이트된 결과 및 변경사항 메시지
 */
export async function integrateMonthlyReports(
  analysisId: string,
  userEmail: string,
  currentResult: any
): Promise<{
  updatedResult: any
  changeMessage: string | null
}> {
  try {
    console.log('📊 월간 Report 통합 시작:', { analysisId, userEmail })

    // 1. 조직 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('organization, organization_type')
      .eq('email', userEmail)
      .single()

    const organization = userData?.organization
    const organizationType = userData?.organization_type || 'company'

    if (!organization) {
      console.log('📊 조직 정보 없음 - 월간 Report 통합 스킵')
      return { updatedResult: currentResult, changeMessage: null }
    }

    console.log('📊 조직 정보:', { organization, organizationType })

    // 2. 미반영 월간 Report 조회 (전체, applied_to_analysis_id IS NULL)
    const { data: monthlyReports, error: fetchError } = await supabase
      .from('monthly_reports')
      .select('id, month_of, aggregated_html')
      .eq('user_email', userEmail)
      .is('applied_to_analysis_id', null)
      .order('month_of', { ascending: true })

    if (fetchError) {
      console.error('📊 월간 Report 조회 실패:', fetchError)
      return { updatedResult: currentResult, changeMessage: null }
    }

    if (!monthlyReports || monthlyReports.length === 0) {
      console.log('📊 미반영 월간 Report 없음')
      return { updatedResult: currentResult, changeMessage: null }
    }

    console.log('📊 미반영 월간 Report:', monthlyReports.length, '건')

    // 3. 이력서 분석 결과에서 해당 회사 경력 찾기
    const workExperience = currentResult.work_experience || []
    const matchingIndex = workExperience.findIndex(
      (exp: any) =>
        exp.company &&
        (exp.company.includes(organization) || organization.includes(exp.company))
    )

    console.log('📊 기존 경력 매칭:', { matchingIndex, totalExperience: workExperience.length })

    // 4. 월간 Report 내용 통합
    const monthlyContents = monthlyReports
      .map(r => `**${r.month_of} 월간:**\n${r.aggregated_html}`)
      .join('\n\n')

    let updatedExperience: any

    if (matchingIndex >= 0) {
      // 4-1. 기존 경력에 통합
      const existingExp = workExperience[matchingIndex]
      console.log('📊 기존 경력에 통합:', existingExp.company)

      const prompt = `당신은 10년차 헤드헌터입니다. 구직자의 기존 경력 사항과 월간 업무 Report를 통합하여, 이력서의 "경력 사항" 형식으로 전문적으로 정리해주세요.

**회사명:** ${organization}

**기존 경력 사항:**
${existingExp.description || existingExp.content || '(내용 없음)'}

**월간 업무 Report (추가):**
${monthlyContents}

**작성 원칙 (CRITICAL):**
1. **사실 기반**: 기존 내용과 월간 Report에 있는 내용만 사용
2. **중복 제거**: 비슷한 내용은 통합
3. **시간순 정리**: 최신 업무부터 배치
4. **정량 정보**: 숫자가 명시된 경우에만 포함
5. **전문성**: 이력서 경력 사항 형식에 맞게 정리

**출력 형식 (TEXT만, HTML 태그 없이):**
- 주요 업무 및 성과를 불렛 포인트로 나열
- 각 항목은 명확하고 간결하게
- 과장 금지, 있는 그대로만

TEXT만 출력하고, 다른 설명은 생략하세요.`

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })

      const integratedContent = message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : ''

      updatedExperience = [...workExperience]
      updatedExperience[matchingIndex] = {
        ...existingExp,
        description: integratedContent,
        _monthly_reports_integrated: monthlyReports.map(r => r.month_of),
        _updated_at: new Date().toISOString(),
      }

    } else {
      // 4-2. 새 경력 항목 추가
      console.log('📊 새 경력 항목 추가')

      const prompt = `당신은 10년차 헤드헌터입니다. 구직자의 월간 업무 Report를 정리하여, 이력서의 "경력 사항" 형식으로 전문적으로 작성해주세요.

**회사명:** ${organization}

**월간 업무 Report:**
${monthlyContents}

**작성 원칙 (CRITICAL):**
1. **사실 기반**: 월간 Report에 있는 내용만 사용
2. **시간순 정리**: 최신 업무부터 배치
3. **정량 정보**: 숫자가 명시된 경우에만 포함
4. **전문성**: 이력서 경력 사항 형식에 맞게 정리

**출력 형식 (TEXT만, HTML 태그 없이):**
- 주요 업무 및 성과를 불렛 포인트로 나열
- 각 항목은 명확하고 간결하게
- 과장 금지, 있는 그대로만

TEXT만 출력하고, 다른 설명은 생략하세요.`

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })

      const newContent = message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : ''

      const newExperience = {
        company: organization,
        position: organizationType === 'school' ? '재학생' : '재직자',
        description: newContent,
        _monthly_reports_integrated: monthlyReports.map(r => r.month_of),
        _created_at: new Date().toISOString(),
      }

      updatedExperience = [...workExperience, newExperience]
    }

    // 5. analyses 테이블 업데이트
    const updatedResult = {
      ...currentResult,
      work_experience: updatedExperience,
    }

    const { error: updateError } = await supabase
      .from('analyses')
      .update({ result: updatedResult })
      .eq('id', analysisId)

    if (updateError) {
      console.error('📊 analyses 업데이트 실패:', updateError)
      return { updatedResult: currentResult, changeMessage: null }
    }

    // 6. monthly_reports에 applied_to_analysis_id 기록
    const reportIds = monthlyReports.map(r => r.id)
    const { error: markError } = await supabase
      .from('monthly_reports')
      .update({ applied_to_analysis_id: analysisId })
      .in('id', reportIds)

    if (markError) {
      console.error('📊 monthly_reports 업데이트 실패:', markError)
    }

    // 7. 변경사항 메시지 생성
    const monthList = monthlyReports
      .map(r => {
        const date = new Date(r.month_of)
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
      })
      .join(', ')

    const changeMessage = `✨ 업무 Report 반영: ${monthList} 월간 업무 내역이 ${organization}의 경력 사항에 추가되었습니다.`

    console.log('✅ 월간 Report 통합 완료:', {
      reportCount: monthlyReports.length,
      months: monthList,
      matched: matchingIndex >= 0,
    })

    return { updatedResult, changeMessage }

  } catch (error) {
    console.error('📊 월간 Report 통합 중 오류:', error)
    return { updatedResult: currentResult, changeMessage: null }
  }
}
