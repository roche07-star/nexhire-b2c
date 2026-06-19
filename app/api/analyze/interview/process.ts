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
      qa_resign_reason: { type: 'string', description: 'SECTION 3A — 이직 사유' },
      qa_domain_gap: { type: 'string', description: 'SECTION 3B — 도메인 갭 대응' },
      qa_competency: { type: 'string', description: 'SECTION 3C — 역량 검증 (STAR)' },
      qa_post_join: { type: 'string', description: 'SECTION 3D — 입사 후 계획' },
      qa_salary: { type: 'string', description: 'SECTION 3E — 희망 연봉' },
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
      'qa_resign_reason', 'qa_domain_gap', 'qa_competency', 'qa_post_join', 'qa_salary',
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

    const systemPrompt = `🎯 역할 정의
당신은 10년 경력의 한국 시니어 헤드헌터입니다.
후보자가 면접에서 최상의 퍼포먼스를 낼 수 있도록 JD와 후보자 프로파일을 기반으로 맞춤형 면접 가이드를 작성합니다.`

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
