import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { resumeAnalysis, jdAnalysis } = await req.json()

    if (!resumeAnalysis || !jdAnalysis) {
      return NextResponse.json(
        { error: '이력서 분석 결과와 JD 분석 결과가 필요합니다.' },
        { status: 400 }
      )
    }

    // Claude API로 제안서 생성 (Tool Use로 환각 방지)
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      tool_choice: { type: 'tool', name: 'generate_proposal' },
      tools: [
        {
          name: 'generate_proposal',
          description: '후보자 추천서 생성 (제공된 정보만 사용, 환각 절대 금지)',
          input_schema: {
            type: 'object' as const,
            properties: {
              title: { type: 'string', description: '제안서 제목' },
              company: { type: 'string', description: 'JD 회사명 (제공된 값 그대로)' },
              position: { type: 'string', description: 'JD 포지션 (제공된 값 그대로)' },
              date: { type: 'string', description: '작성 날짜 YYYY. MM' },
              summary: { type: 'string', description: '추천 요약 (3-5문장, 제공된 점수 포함)' },
              candidate_info: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: '후보자명 (제공된 값 그대로, 변경 금지)' },
                  current_position: { type: 'string', description: '직무 (제공된 값 그대로)' },
                  experience: { type: 'string', description: '경력 정보에서 추출한 총 경력, 없으면 "미기재"' },
                  education: { type: 'string', description: '학력 (제공된 값 그대로)' },
                  current_salary: { type: 'string', description: '현재 연봉, 정보 없으면 "미기재"' },
                  availability: { type: 'string', description: '입사 가능일, 정보 없으면 "협의 후 결정"' },
                },
                required: ['name', 'current_position', 'experience', 'education', 'current_salary', 'availability'],
              },
              strengths: {
                type: 'array',
                description: '제공된 강점 기반 핵심 강점 3-5개',
                items: { type: 'string' },
              },
              fit_analysis: {
                type: 'object',
                properties: {
                  technical_fit: { type: 'string', description: '기술적 적합성 분석' },
                  cultural_fit: { type: 'string', description: '문화적 적합성 분석' },
                  growth_potential: { type: 'string', description: '성장 가능성 분석' },
                },
                required: ['technical_fit', 'cultural_fit', 'growth_potential'],
              },
              recommendation: {
                type: 'string',
                enum: ['HIGHLY_RECOMMEND', 'RECOMMEND', 'CONSIDER'],
                description: '추천도',
              },
              next_steps: { type: 'string', description: '다음 단계 제안' },
            },
            required: ['title', 'company', 'position', 'date', 'summary', 'candidate_info', 'strengths', 'fit_analysis', 'recommendation', 'next_steps'],
          },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `당신은 Executive Search 헤드헌터입니다. 클라이언트(채용 기업)에게 제출할 후보자 추천서를 작성해 주세요.

⚠️ **중요**: 아래 제공된 정보만 사용하십시오. 없는 정보는 추측하거나 생성하지 말고 "미기재"로 표시하십시오.

## 후보자 이력서 분석 결과:
- 후보자명: ${resumeAnalysis.candidate_name || '미상'}
- 직무: ${resumeAnalysis.job_title || '미상'}
- 경력 정보: ${JSON.stringify(resumeAnalysis.career_summary || {})}
- 학력: ${resumeAnalysis.education || '미기재'}
- 직무 적합도: ${resumeAnalysis.scores?.job_fit || 0}점
- 시장 경쟁력: ${resumeAnalysis.scores?.market_competitiveness || 0}점
- 성장 가능성: ${resumeAnalysis.scores?.growth_potential || 0}점
- 강점: ${resumeAnalysis.strengths?.join(', ') || '없음'}
- 개선점: ${resumeAnalysis.improvements?.join(', ') || '없음'}
- 핵심 키워드: ${resumeAnalysis.keywords?.join(', ') || '없음'}

## JD 적합도 분석 결과:
- 회사: ${jdAnalysis.company || '미상'}
- 포지션: ${jdAnalysis.position || '미상'}
- 적합도 점수: ${jdAnalysis.fit_score || 0}점
- 추천도: ${jdAnalysis.recommendation || 'CONSIDER'}
- 매칭 강점: ${jdAnalysis.matching_points?.join(', ') || '없음'}
- 부족한 점: ${jdAnalysis.gaps?.join(', ') || '없음'}

다음 형식으로 프로페셔널한 후보자 추천서를 작성해 주세요:

{
  "title": "후보자 추천 요약",
  "company": "${jdAnalysis.company || '미상'}",
  "position": "${jdAnalysis.position || '미상'}",
  "date": "${new Date().toISOString().slice(0, 7).replace('-', '. ')}",
  "summary": "후보자에 대한 전체적인 추천 요약 (3-5문장, 구체적 수치 포함)",
  "candidate_info": {
    "name": "${resumeAnalysis.candidate_name || '미상'}",
    "current_position": "${resumeAnalysis.job_title || '미기재'}",
    "experience": "위 경력 정보에서 추출한 총 경력 (구체적으로, 없으면 '미기재')",
    "education": "${resumeAnalysis.education || '미기재'}",
    "current_salary": "위 이력서에서 언급된 연봉 정보 (없으면 '미기재')",
    "availability": "위 이력서에서 언급된 입사 가능일 (없으면 '협의 후 결정')"
  },
  "strengths": [
    "위 강점 정보를 기반으로 한 핵심 강점 3-5개 (구체적 사례 포함)"
  ],
  "fit_analysis": {
    "technical_fit": "JD 적합도 ${jdAnalysis.fit_score}점 기반 기술적 적합성 분석",
    "cultural_fit": "매칭 강점 및 부족한 점 기반 문화적 적합성 분석",
    "growth_potential": "성장 가능성 ${resumeAnalysis.scores?.growth_potential || 0}점 기반 분석"
  },
  "recommendation": "${jdAnalysis.recommendation === 'APPLY' ? 'HIGHLY_RECOMMEND' : jdAnalysis.recommendation === 'CONSIDER' ? 'RECOMMEND' : 'CONSIDER'}",
  "next_steps": "면접 일정 조율을 제안합니다."
}

❌ **절대 금지**:
- 후보자 이름을 임의로 변경하거나 생성하지 마세요
- 없는 경력이나 학력을 추측하지 마세요
- 제공되지 않은 연봉 정보를 임의로 작성하지 마세요

✅ **필수**:
- 위 JSON 형식 그대로 출력
- JSON만 출력하고 다른 설명은 하지 마세요`,
        },
      ],
    })

    // Tool use 응답 추출 (환각 방지)
    const toolUse = message.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      console.error('[generate-proposal] No tool_use in response:', JSON.stringify(message.content))
      throw new Error('제안서 생성 응답 형식 오류')
    }

    const proposal = toolUse.input as any

    // 필수 필드 검증 (환각 방지)
    if (!proposal.candidate_info?.name || proposal.candidate_info.name === '미상') {
      console.error('[generate-proposal] Missing or invalid candidate name')
      // 원본 데이터로 대체
      if (!proposal.candidate_info) proposal.candidate_info = {}
      proposal.candidate_info.name = resumeAnalysis.candidate_name || '미상'
    }

    if (!proposal.candidate_info?.current_position) {
      proposal.candidate_info.current_position = resumeAnalysis.job_title || '미기재'
    }

    if (!proposal.candidate_info?.education) {
      proposal.candidate_info.education = resumeAnalysis.education || '미기재'
    }

    // 로깅 (디버깅용)
    console.log('[generate-proposal] Generated proposal:', {
      candidateName: proposal.candidate_info?.name,
      position: proposal.candidate_info?.current_position,
      company: proposal.company,
    })

    return NextResponse.json({ proposal })

  } catch (error: any) {
    console.error('[generate-proposal] Error:', error)
    return NextResponse.json(
      { error: error.message || '제안서 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
