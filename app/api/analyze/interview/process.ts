/**
 * 면접 가이드 생성 백그라운드 처리 함수
 * 기존 route.ts의 로직을 분리하여 Job 시스템에 통합
 */

import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { updateJobProgress, completeJob, failJob } from '@/lib/jobs'
import { incrementUsage } from '@/lib/usageLimits'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function toArr(v: unknown): string[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') return v.split('\n').filter(Boolean)
  return []
}

// interviewTool 정의 (기존과 동일)
const interviewTool: Anthropic.Tool = {
  name: 'generate_interview_guide',
  description: '후보자 맞춤형 면접 가이드를 HTML 출력용 상세 섹션으로 생성합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      matching_scores: {
        type: 'array',
        description: 'SECTION 0 — JD 요구사항별 매칭 점수 (바 차트용)',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string', description: '역량 카테고리' },
            score: { type: 'number', description: '점수 (0-100)' },
            grade: { type: 'string', description: '등급 (A+/A/B+/B/C+)' },
          },
          required: ['category', 'score', 'grade'],
        },
      },
      positioning_message: { type: 'string', description: 'SECTION 1 — 핵심 포지셔닝 메시지' },
      self_intro: { type: 'string', description: 'SECTION 2 — 자기소개 설계' },
      qa_resign_reason: { type: 'string', description: 'SECTION 3A — 이직 사유 (객관적 이유 + 이직 목표를 한 문장으로 연결, 총 60-90자 내외. 존칭어 생략, ~함/~임 체로 작성. 마침표 사용하지 않고 자연스럽게 연결. 예: "합작법인의 전략적 사업 종료로 조직이 해산되어 중국시장 및 글로벌 경험을 바탕으로 더 넓은 브랜드와 제품군에서 기획력을 확장하고자 함")' },
      qa_domain_gap: { type: 'string', description: 'SECTION 3B — 도메인 갭 대응' },
      qa_competency: { type: 'string', description: 'SECTION 3C — 역량 검증 (STAR)' },
      qa_project_experience: { type: 'string', description: 'SECTION 3D — 프로젝트 경험 심화 질문 (후보자 이력서의 실제 프로젝트/업무 경험 기반, 구체적인 기술/상황 질문 8개, 각 질문마다 답변 예시 포함)' },
      qa_post_join: { type: 'string', description: 'SECTION 3E — 입사 후 계획' },
      qa_salary: { type: 'string', description: 'SECTION 3F — 희망 연봉' },
      strengths: {
        type: 'array',
        items: { type: 'string' },
        description: 'SECTION 4 — 강점',
      },
      risks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            risk: { type: 'string' },
            response: { type: 'string' },
          },
          required: ['risk', 'response'],
        },
        description: 'SECTION 4 — 리스크',
      },
      reverse_questions: {
        type: 'array',
        items: { type: 'string' },
        description: 'SECTION 5 — 역질문',
      },
      checklist: {
        type: 'array',
        items: { type: 'string' },
        description: 'SECTION 6 — 체크리스트',
      },
    },
    required: [
      'matching_scores', 'positioning_message', 'self_intro',
      'qa_resign_reason', 'qa_domain_gap', 'qa_competency', 'qa_project_experience', 'qa_post_join', 'qa_salary',
      'strengths', 'risks', 'reverse_questions', 'checklist',
    ],
  },
}

export async function processInterviewJob(
  jobId: string,
  email: string,
  role: string,
  inputData: {
    analysisId: string
    jdAnalysisId?: string | null
    interviewFormat?: string
    interviewerInfo?: string
    specialNotes?: string
  }
): Promise<void> {
  try {
    // Step 1: 이력서 분석 조회
    await updateJobProgress(jobId, 1, '이력서 분석 결과를 확인하는 중...')

    const { data: row } = await supabase
      .from('analyses')
      .select('id, result')
      .eq('id', inputData.analysisId)
      .eq('user_email', email)
      .single()

    if (!row) {
      await failJob(jobId, '분석을 찾을 수 없습니다.')
      return
    }

    // Step 2: JD 분석 조회
    await updateJobProgress(jobId, 2, 'JD 분석 결과를 확인하는 중...')

    let jdContext: Record<string, unknown> | null = null
    if (inputData.jdAnalysisId) {
      const { data: jdRow } = await supabase
        .from('jd_analyses')
        .select('result')
        .eq('id', inputData.jdAnalysisId)
        .eq('user_email', email)
        .single()
      if (jdRow?.result) jdContext = jdRow.result as Record<string, unknown>
    }

    // Step 3: 프롬프트 준비
    await updateJobProgress(jobId, 3, '회사 정보를 준비하는 중...')

    const a = row.result as Record<string, unknown>
    const careerSummary = Array.isArray(a.career_paths)
      ? (a.career_paths as Array<{ type: string; title: string; salary_range: string }>)
          .map(p => `${p.type}: ${p.title} (${p.salary_range})`)
          .join(' | ')
      : ''

    const candidateProfile = `직무: ${(a.job_title as string) ?? '미상'}
종합 요약: ${(a.summary as string) ?? ''}
핵심 강점: ${toArr(a.strengths).join(' / ')}
개선 필요: ${toArr(a.improvements).join(' / ')}
핵심 키워드: ${toArr(a.keywords).join(', ')}
${careerSummary ? `커리어 경로: ${careerSummary}` : ''}`

    const companyAnalysisSection = jdContext?.company_analysis
      ? `[회사 상세 분석]:
- 회사 소개: ${(jdContext.company_analysis as Record<string, unknown>).introduction}
- 매출/규모: ${(jdContext.company_analysis as Record<string, unknown>).revenue}
- 현재 사업: ${(jdContext.company_analysis as Record<string, unknown>).current_business}
- 최근 동향: ${(jdContext.company_analysis as Record<string, unknown>).recent_trends}
- 미래 가치: ${(jdContext.company_analysis as Record<string, unknown>).future_value}`
      : ''

    const jdSection = jdContext
      ? `[채용 회사]: ${jdContext.company}${jdContext.position ? ` — ${jdContext.position}` : ''}
${companyAnalysisSection ? companyAnalysisSection + '\n' : ''}
[JD 적합도 분석]:
- 적합도: ${jdContext.fit_score}% / ${jdContext.verdict}
- 매칭 강점: ${toArr(jdContext.matching_points).join(' / ')}
- 보완 필요: ${toArr(jdContext.gaps).join(' / ')}
- 피치 포인트: ${toArr(jdContext.pitch_points).join(' / ')}`
      : '[JD 미선택 — 일반 헤드헌터 관점으로 작성]'

    const additionalLines = [
      inputData.interviewFormat && `면접 형식: ${inputData.interviewFormat}`,
      inputData.interviewerInfo && `면접관: ${inputData.interviewerInfo}`,
      inputData.specialNotes && `특이사항: ${inputData.specialNotes}`,
    ].filter(Boolean).join('\n')

    const systemPrompt = `🎯 역할
당신은 10년 경력의 한국 시니어 헤드헌터입니다. JD와 후보자 프로파일을 기반으로 맞춤형 면접 가이드를 작성합니다.

⚠️ 필수 규칙
1. 간결하게: 각 섹션은 핵심만 2-4문장으로 작성
2. 모든 섹션 필수: SECTION 1-6 모두 반드시 작성 (빠뜨리지 말 것!)
3. 균형 있게: 앞 섹션을 너무 길게 쓰지 말고 모든 섹션 균등하게
4. 마크다운 금지: ** * ~~ 등 마크다운 문법 절대 사용 금지
5. 항목 수 준수: strengths 3-5개, risks 2-3개, reverse_questions 3-5개, checklist 5-7개

⭐ STAR 방법론 (역량 검증의 핵심)
STAR는 행동 기반 면접 기법으로, 후보자의 과거 경험을 구체적으로 검증하는 방식입니다:
- **S**ituation (상황): 어떤 상황이었나?
- **T**ask (과제): 무엇을 해야 했나?
- **A**ction (행동): 구체적으로 어떻게 했나?
- **R**esult (결과): 어떤 결과가 나왔나?

예시:
❌ "저는 팀워크가 좋습니다" (추상적)
✅ "프로젝트 지연 상황에서(S), 일정 회복이 필요했고(T), 팀원들과 매일 스탠드업 미팅을 도입했으며(A), 2주 만에 일정을 따라잡았습니다(R)" (구체적)

📋 SECTION 3B — 도메인 갭 대응 (JD 리스크 극복) 작성 가이드
- **JD 분석의 "보완 필요" 항목을 기반**으로 예상 질문 생성
- 각 갭(부족한 점)에 대해:
  1) 면접관이 물어볼 가능성이 높은 질문 (우려 사항)
  2) 극복 방안 (어떻게 답변할지 구체적 전략)
- 예시 형식:
  Q: "경험이 부족한 [특정 기술/도메인]에 대해 어떻게 대응하실 계획인가요?"
  A: "빠른 학습 능력과 유사 경험을 강조하며, 구체적인 학습 계획 제시 (예: 온라인 강의, 사이드 프로젝트)"
- **3-5개 질문**, JD의 gaps가 없으면 일반적인 도메인 전환 질문 제시

📋 SECTION 3C — 역량 검증 (STAR) 작성 가이드
- **STAR 방법론 설명 포함**: 위의 STAR 정의를 그대로 명시
- 후보자의 핵심 역량(예: 문제해결력, 리더십, 협업 능력)을 검증할 수 있는 질문 3-5개 제시
- 각 질문마다 STAR 형식으로 답변하도록 유도
- 예시: "프로젝트에서 가장 어려웠던 기술적 문제를 STAR 형식으로 설명해주세요"

📋 SECTION 3D — 프로젝트 경험 심화 질문 작성 가이드
- 후보자 이력서의 **실제 프로젝트/업무 경험**을 기반으로 구체적인 질문 생성
- 기술 스택, 아키텍처, 트러블슈팅, 의사결정 과정 등 실무 깊이 검증
- 일반적인 질문 금지, 반드시 후보자의 이력서에 명시된 내용 기반으로 작성
- 각 질문마다 **모범 답변 예시**를 함께 제공 (후보자의 실제 경험 기반)
- 예시 형식:
  Q: [후보자가 경험한 구체적 프로젝트명/기술]에서 [구체적 상황/문제] 어떻게 해결했나요?
  A: [후보자의 이력서 내용을 바탕으로 한 구체적인 답변 예시 - STAR 형식 권장]

  Q: [후보자의 기술 스택]을 사용하면서 가장 어려웠던 기술적 도전은?
  A: [기술적 도전과 해결 과정을 담은 답변 예시]

  Q: [프로젝트에서 한 역할]을 수행하면서 [구체적 의사결정]은 어떤 기준으로 했나요?
  A: [의사결정 기준과 근거를 담은 답변 예시]
- **8개 질문** 생성, 각 질문은 후보자의 실제 경험에서 추출
- 각 질문마다 모범 답변 예시 필수 (Q:/A: 형식)
- 답변은 2-3문장으로 간결하게, 후보자가 실제로 말할 수 있는 수준으로 작성

💰 SECTION 3F — 희망 연봉 답변 가이드
- 기본 원칙: 현재 연봉 대비 **10% 선에서 상향 검토** 제시
- 답변 구조:
  1) 현재 연봉 수준 언급 (구체적 금액 또는 범위)
  2) 이직 시 기대 연봉: 현재 대비 10% 상향선
  3) 협의 가능 여지: "회사 내규와 제시 조건에 따라 유연하게 협의 가능"
- 예시: "현재 연봉은 [X]만원이며, 이직을 고려한다면 10% 정도 상향된 [Y]만원 선에서 검토하고 있습니다. 다만 회사 제시 조건과 복리후생을 종합적으로 고려하여 유연하게 협의 가능합니다."
- 주의사항: 구체적 금액보다 범위로 제시, 과도한 요구 금지`

    const userContent = `[후보자 이력서 분석 결과]
${candidateProfile}

[채용 정보]
${jdSection}
${additionalLines ? `\n[추가 정보]\n${additionalLines}` : ''}`

    // Step 4: Claude API 호출
    await updateJobProgress(jobId, 4, '면접 가이드를 생성하는 중... (60-90초 소요)')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system: [{
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }
      }],
      tool_choice: { type: 'tool', name: 'generate_interview_guide' },
      tools: [interviewTool],
      messages: [{ role: 'user', content: userContent }],
    })

    const toolUse = message.content.find(c => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      await failJob(jobId, '면접 가이드를 생성하지 못했습니다.')
      return
    }

    // Step 5: 결과 저장
    await updateJobProgress(jobId, 5, '결과를 저장하는 중...')

    const resultPayload = {
      ...(toolUse.input as object),
      company: jdContext?.company ?? null,
      position: jdContext?.position ?? null,
      candidate_name: (a.candidate_name as string | undefined) ?? null,
      job_title: (a.job_title as string | undefined) ?? null,
      company_analysis: jdContext?.company_analysis ?? null,
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 10)

    const { data: inserted, error: insertError } = await supabase
      .from('interview_guides')
      .insert({ user_email: email, result: resultPayload, expires_at: expiresAt.toISOString() })
      .select('id, expires_at')
      .single()

    if (insertError) {
      await failJob(jobId, `저장 실패: ${insertError.message}`)
      return
    }

    // Step 6: Usage 증가 (Manager 제외)
    if (role !== 'MANAGER') {
      await incrementUsage(email, 'interview')
    }

    // Step 7: Job 완료
    await updateJobProgress(jobId, 6, '완료!')
    await completeJob(jobId, {
      ...resultPayload,
      id: inserted!.id,
      expires_at: inserted!.expires_at,
    })

  } catch (error) {
    console.error('[processInterviewJob] Error:', error)
    await failJob(jobId, error instanceof Error ? error.message : '면접 가이드 생성 실패')
  }
}
