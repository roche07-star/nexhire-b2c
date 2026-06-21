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

    // Claude API로 제안서 생성
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: `당신은 Executive Search 헤드헌터입니다. 클라이언트(채용 기업)에게 제출할 후보자 추천서를 작성해 주세요.

## 후보자 이력서 분석 결과:
- 후보자명: ${resumeAnalysis.candidate_name || '미상'}
- 직무: ${resumeAnalysis.job_title || '미상'}
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
  "company": "클라이언트 회사명",
  "position": "채용 포지션",
  "date": "YYYY. MM",
  "summary": "후보자에 대한 전체적인 추천 요약 (3-5문장, 구체적 수치 포함)",
  "candidate_info": {
    "name": "후보자 이름",
    "current_position": "현재 직책",
    "age": "생년 (또는 연령대)",
    "experience": "총 경력 (구체적으로)",
    "education": "최종 학력",
    "current_salary": "현재 연봉 수준",
    "availability": "출근 가능 시기",
    "certifications": "주요 자격증"
  },
  "strengths": [
    "핵심 강점 1 (구체적 사례 포함)",
    "핵심 강점 2",
    "핵심 강점 3"
  ],
  "fit_analysis": {
    "technical_fit": "기술적 적합성 분석",
    "cultural_fit": "문화적 적합성 분석",
    "growth_potential": "성장 가능성 분석"
  },
  "recommendation": "HIGHLY_RECOMMEND | RECOMMEND | CONSIDER",
  "next_steps": "제안 다음 단계 (면접 일정 제안 등)"
}

JSON만 출력하고 다른 설명은 하지 마세요.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // JSON 파싱
    let proposal
    try {
      // 마크다운 코드 블록 제거
      const cleanedText = content.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      proposal = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw content:', content.text)
      throw new Error('제안서 생성 중 오류가 발생했습니다.')
    }

    return NextResponse.json({ proposal })

  } catch (error: any) {
    console.error('[generate-proposal] Error:', error)
    return NextResponse.json(
      { error: error.message || '제안서 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
