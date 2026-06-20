import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'
import { extractText } from '@/lib/extractText'
import { generateResumeDocx, generateStandardDocx, RewriteResult } from '@/lib/generateDocx'
import { extractDocxParagraphs, applyDocxRewrites, DocxParagraph } from '@/lib/rewriteDocxInPlace'
import { checkUsage, incrementUsage } from '@/lib/usageLimits'

export const maxDuration = 120

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface JDContext {
  company: string
  position?: string | null
  fit_score: number
  verdict: string
  matching_points: string[]
  gaps: string[]
  pitch_points: string[]
  // 상세 회사 분석 (NEW)
  company_analysis?: {
    introduction: string
    revenue: string
    current_business: string
    recent_trends: string
    future_value: string
    needs_more_info: boolean
    info_request_message?: string
  }
}

function toArr(v: unknown): string[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') return v.split('\n').filter(Boolean)
  return []
}

// PII 감지: 이메일/전화번호/주민번호/이름 레이블 포함 여부
function hasPII(text: string): boolean {
  if (/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(text)) return true
  if (/(?:010|011|016|017|018|019|02|0[3-9]\d)[\s.\-]?\d{3,4}[\s.\-]?\d{4}/.test(text)) return true
  if (/\d{6}[\-]\d{7}/.test(text)) return true
  if (/(이름|성명|Name|성 명|성함)\s*[:：]/i.test(text)) return true
  return false
}

// PDF 경로: 마스킹 전 원본 PII 값 추출
function extractPIIValues(text: string) {
  const emails = [...new Set(text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) ?? [])]
  const phones = [...new Set(text.match(/(?:010|011|016|017|018|019|02|0[3-9]\d)[\s.\-]?\d{3,4}[\s.\-]?\d{4}/g) ?? [])]
  const nameRaw = text.match(/(이름|성명|Name|성 명|성함)\s*[:：]?\s*([가-힣]{2,5}|[a-zA-Z]{2,30}(?:\s[a-zA-Z]{1,20})?)/)
  const names = nameRaw ? [nameRaw[2]] : []
  return { emails, phones, names }
}

function maskPIILocal(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[이메일]')
    .replace(/(?:010|011|016|017|018|019|02|0[3-9]\d)[\s.\-]?\d{3,4}[\s.\-]?\d{4}/g, '[연락처]')
    .replace(/\d{6}[\-]\d{7}/g, '[주민번호]')
    .replace(/(이름|성명|Name|성 명|성함)\s*[:：]?\s*([가-힣]{2,5}|[a-zA-Z]{2,30}(?:\s[a-zA-Z]{1,20})?)/gi, '$1: [이름]')
}

function restorePIIValues(text: string, pii: ReturnType<typeof extractPIIValues>): string {
  let out = text
  if (pii.emails[0]) out = out.replace(/\[이메일\]/g, pii.emails[0])
  if (pii.phones[0]) out = out.replace(/\[연락처\]/g, pii.phones[0])
  if (pii.names[0]) out = out.replace(/\[이름\]/g, pii.names[0])
  return out
}

const CL_KEYWORDS = ['자기소개', '지원사유', '지원동기', '지원 사유', '지원 동기', '포부']

function isCoverLetterSection(title: string): boolean {
  const n = title.replace(/\s+/g, '')
  return CL_KEYWORDS.some(k => n.includes(k.replace(/\s+/g, '')))
}

function coverLetterSectionType(title: string): 'application' | 'selfintro' | 'combined' {
  const n = title.replace(/\s+/g, '')
  const isApp = ['지원사유', '지원동기', '포부'].some(k => n.includes(k))
  const isSelf = ['자기소개'].some(k => n.includes(k))
  if (isApp && isSelf) return 'combined'
  if (isApp) return 'application'
  if (isSelf) return 'selfintro'
  return 'combined'
}

function buildJDSection(jd: JDContext): string {
  // 회사 분석 정보 (JD 분석에서 생성된 정보)
  const companyAnalysisSection = jd.company_analysis ? `
[회사 상세 정보] (이력서 작성 시 참고):
- 회사 소개: ${jd.company_analysis.introduction !== '정보 부족' ? jd.company_analysis.introduction : '정보 없음'}
- 매출/규모: ${jd.company_analysis.revenue !== '정보 부족' ? jd.company_analysis.revenue : '정보 없음'}
- 현재 사업: ${jd.company_analysis.current_business !== '정보 부족' ? jd.company_analysis.current_business : '정보 없음'}
- 최근 동향: ${jd.company_analysis.recent_trends !== '정보 부족' ? jd.company_analysis.recent_trends : '정보 없음'}
- 미래 가치: ${jd.company_analysis.future_value !== '정보 부족' ? jd.company_analysis.future_value : '정보 없음'}
` : ''

  return `
[JD 분석 정보 — 이 이력서를 ${jd.company} 포지션에 추천하기 위한 전략 정보]
채용사: ${jd.company}${companyAnalysisSection}
적합도 판단: ${jd.fit_score}% / ${jd.verdict}
강점 포인트 (이력서에서 더 부각할 것):
${toArr(jd.matching_points).map(p => `  - ${p}`).join('\n')}
보완 포인트 (긍정적으로 재프레이밍할 것):
${toArr(jd.gaps).map(g => `  - ${g}`).join('\n')}
헤드헌터 피치 포인트 (이력서 전체 톤에 반영할 것):
${toArr(jd.pitch_points).map(p => `  - ${p}`).join('\n')}
`
}

// DOCX 단락에서 자기소개서 섹션 콘텐츠 단락 인덱스 감지
function detectCLParagraphs(paras: DocxParagraph[], piiIndexes: Set<number>): { clContentIndexSet: Set<number>; clContentIndices: number[] } {
  const clContentIndices: number[] = []
  let inCL = false
  const visible = paras.filter(p => !piiIndexes.has(p.index))
  for (let i = 0; i < visible.length; i++) {
    const t = visible[i].text.trim()
    if (!t) continue
    const isCLHeader = t.length <= 30 && CL_KEYWORDS.some(k => t.replace(/\s/g, '').includes(k.replace(/\s/g, '')))
    if (isCLHeader) { inCL = true; continue }
    if (inCL) {
      // 새 섹션 헤더로 판단: 짧고 서술어 없는 단어열
      const isNewSection = t.length <= 25 && !/(습니다|합니다|었습니다|됩니다|겠습니다)/.test(t) && /^[가-힣A-Za-z0-9\s\-\//]+$/.test(t)
      if (isNewSection) { inCL = false; continue }
      clContentIndices.push(visible[i].index)
    }
  }
  return { clContentIndexSet: new Set(clContentIndices), clContentIndices }
}

function buildDocxPrompts(paraList: string, count: number, jd: JDContext | null): { system: string; user: string } {
  const jdSection = jd
    ? buildJDSection(jd)
    : '\n[JD 미선택 — 일반 헤드헌터 관점으로 보완]\n'

  const jdAggressiveRules = jd ? `
[JD 연동 수정 원칙 — 아래 규칙이 일반 원칙보다 우선합니다]
• matching_points 관련 단락: 해당 강점이 전면에 부각되도록 문장을 적극 재구성합니다. 수치/성과가 있으면 문두로 배치하고, 임팩트 없는 표현은 교체합니다.
• gaps 관련 단락: 약점으로 읽힐 수 있는 표현을 긍정적 역량으로 완전히 재프레이밍합니다. 문장 구조를 바꾸어도 됩니다.
• pitch_points 키워드를 관련 단락에 자연스럽게 녹입니다.
• 위 세 가지에 해당하는 단락은 원본 표현을 충분히 수정합니다.` : ''

  const system = `당신은 10년 경력의 한국 시니어 헤드헌터입니다.${jd ? ` ${jd.company} 포지션 지원을 위해 후보자 이력서를 보완합니다.` : ''}
${jdAggressiveRules}

[중요: 분석 일관성 유지]
${jd ? `제공된 JD 분석 정보(matching_points, gaps, pitch_points)는 이 후보자의 이력서 분석 결과를 기반으로 생성되었습니다.
이력서 보완 시 이력서 분석의 핵심 강점은 더욱 부각하고, 개선 포인트는 긍정적으로 재프레이밍하되, 분석 결과와 모순되는 새로운 성과나 역량을 추가하지 마십시오.` : `이 이력서는 사전 분석을 거쳤습니다. 분석에서 파악된 핵심 강점과 개선 포인트를 기반으로 보완하되, 분석 결과와 모순되지 않게 작성하십시오.`}

[기본 보완 원칙]
1. 수치/기술명/회사명/기간은 절대 변경하지 않습니다 (없는 수치나 성과 추가 금지)
2. 약한 동사를 강하게 교체합니다: "담당" → "주도", "참여" → "기여", "수행" → "실행", "진행" → "추진"
3. 이름/날짜/구분선/헤더/단순 레이블 단락은 반드시 원본 그대로 반환합니다
4. 가운데점 "/" 사용 금지, 구분은 "/" 또는 "," 사용
5. 불필요한 조사/접속사/수식어를 제거해 문장을 간결하게 정리합니다${!jd ? `
6. 채용 담당자가 긍정적으로 읽히도록 포지셔닝을 강화합니다` : ''}

[출력 규칙]
- rewrites: 반드시 ${count}개, 입력 순서 그대로
- changes: 실제로 수정한 내용을 최소 3개 이상 구체적으로 기록하십시오. 형식: "[단락번호/섹션] 원본 → 수정본 (이유)"`

  const user = `${jdSection}

[이력서 단락 목록] (총 ${count}개)
${paraList}`

  return { system, user }
}

function buildSectionPrompts(resumeText: string, jd: JDContext | null): { system: string; user: string } {
  const jdSection = jd ? buildJDSection(jd) : '\n[JD 미선택 — 일반 헤드헌터 관점으로 보완]\n'

  const jdAggressiveRules = jd ? `
[JD 연동 수정 원칙 — 아래 규칙이 일반 원칙보다 우선합니다]
• matching_points 관련 섹션: 해당 강점이 전면에 부각되도록 문장을 적극 재구성합니다. 수치/성과가 있으면 문두로 배치하고, 임팩트 없는 표현은 교체합니다.
• gaps 관련 섹션: 약점으로 읽힐 수 있는 표현을 긍정적 역량으로 완전히 재프레이밍합니다. 문장 구조를 바꾸어도 됩니다.
• pitch_points 키워드를 관련 섹션에 자연스럽게 녹여 JD 요구사항과 연결 짓습니다.
• 위 세 가지에 해당하는 섹션은 "원본 그대로" 원칙을 적용하지 않고 충분히 수정합니다.
• 자기소개/지원사유/지원동기/포부 섹션: 완전 재작성합니다.
  - "${jd.company}"를 본문에 자연스럽게 명시
  - 어필 전략 키워드: ${toArr(jd.pitch_points).join(' / ')}
  - 지원사유: 커리어 방향 → ${jd.company} 접점 → 기여 방향 구조로
  - 자기소개: STAR 구조(상황→역할→행동→결과) + 인상적인 첫 문장
  - 수동태 → 능동태 전환` : ''

  const system = `당신은 10년 경력의 한국 시니어 헤드헌터입니다.${jd ? ` 현재 ${jd.company} 포지션에 이 후보자를 추천하기 위해 이력서를 보완합니다.` : ''}
${jdAggressiveRules}

[중요: 분석 일관성 유지]
${jd ? `제공된 JD 분석 정보(matching_points, gaps, pitch_points)는 이 후보자의 이력서 분석 결과를 기반으로 생성되었습니다.
이력서 보완 시 이력서 분석의 핵심 강점은 더욱 부각하고, 개선 포인트는 긍정적으로 재프레이밍하되, 분석 결과와 모순되는 새로운 성과나 역량을 추가하지 마십시오.` : `이 이력서는 사전 분석을 거쳤습니다. 분석에서 파악된 핵심 강점과 개선 포인트를 기반으로 보완하되, 분석 결과와 모순되지 않게 작성하십시오.`}

[기본 보완 원칙]
- 원본 이력서에 있는 모든 섹션을 빠짐없이 포함합니다 (인적사항, 학력, 경력사항, 자격/면허, 기타사항, 연봉사항, 지원사유 및 포부 등 원본에 있는 항목 전부)
- 섹션의 순서와 제목은 원본 그대로 유지합니다
- 수치/기술명/회사명/기간은 절대 변경하지 않습니다 (없는 수치나 성과 추가 금지)
- 약한 동사를 강하게 교체합니다: "담당" → "주도", "참여" → "기여", "수행" → "실행", "진행" → "추진"
- 구분자 "/" 사용, "/" (가운데점) 절대 금지
- 해당 경력 연차에 맞는 한국 채용 시장 어감을 유지합니다
- 불필요한 조사/접속사/수식어를 제거해 문장을 간결하게 정리합니다${!jd ? `
- 채용 담당자가 긍정적으로 읽히도록 포지셔닝을 강화합니다` : ''}
- 각 섹션의 content는 줄바꿈(\\n)으로 구분, 목록 항목은 "- "로 시작합니다
- changes 필드에 실제로 수정한 내용을 최소 3개 이상 구체적으로 기록하십시오. 형식: "[섹션명] 원본 → 수정본 (이유)"`

  const user = `${jdSection}

[원본 이력서]
${resumeText}
[/원본 이력서]`

  return { system, user }
}

function buildTemplateDocxPrompts(paraList: string, count: number, resumeText: string, jd: JDContext | null): { system: string; user: string } {
  const jdSection = jd
    ? buildJDSection(jd)
    : '\n[JD 미선택 — 일반 헤드헌터 관점으로 작성]\n'

  const system = `당신은 10년 경력의 한국 시니어 헤드헌터입니다.${jd ? ` ${jd.company} 포지션 지원을 위해 후보자 이력서를 새 양식에 맞게 작성합니다.` : ''}

[중요: 분석 일관성 유지]
${jd ? `제공된 JD 분석 정보는 이 후보자의 이력서 분석 결과를 기반으로 생성되었습니다.
새 양식 작성 시 이력서 분석의 핵심 강점은 더욱 부각하고, 개선 포인트는 긍정적으로 재프레이밍하되, 분석 결과와 모순되는 새로운 성과나 역량을 추가하지 마십시오.` : `이 이력서는 사전 분석을 거쳤습니다. 분석에서 파악된 핵심 강점과 개선 포인트를 기반으로 작성하되, 분석 결과와 모순되지 않게 작성하십시오.`}

[새 양식 작성 원칙]
1. 원본 이력서의 내용(경력, 학력, 기술, 성과)을 아래 양식의 각 단락 구조에 맞게 채워 씁니다
2. 수치/기술명/회사명/기간은 절대 변경하지 않습니다 (없는 수치나 성과 추가 금지)
3. 약한 동사는 강하게 교체합니다: "담당" → "주도", "참여" → "기여", "수행" → "실행"
4. 양식의 헤더/날짜/구분선/단순 레이블은 원래 양식 텍스트 그대로 반환합니다
5. 해당 단락 위치에 맞는 원본 내용이 없으면 원래 양식 텍스트 그대로 반환합니다${jd ? `
6. JD 매칭 강점은 더 구체적으로 드러나도록 강조합니다
7. JD 갭 항목은 긍정적으로 재프레이밍합니다
8. JD 피치 포인트 키워드를 자연스럽게 녹입니다` : ''}
9. 가운데점 "/" 사용 금지, 구분은 "/" 또는 "," 사용
10. 각 단락 길이를 양식 단락 길이와 비슷하게 유지합니다${jd ? `

[자기소개서 / 지원사유 / 지원동기 / 포부 단락 특별 지침]
해당 단락 위치가 감지되면 원본 이력서 내용을 활용해 완전 작성합니다:
- "${jd.company}"를 본문에 자연스럽게 명시
- 어필 전략 키워드를 녹임: ${toArr(jd.pitch_points).join(' / ')}
- AI 표현 완전 삭제: "귀사", "시너지", "다양한 경험", "열정적으로"
- 지원사유: 커리어 방향 → ${jd.company} 접점 → 기여 방향 구조로
- 자기소개: STAR 구조(상황→역할→행동→결과) + 인상적인 첫 문장
- "/" → "/" 전면 교체` : ''}`

  const user = `${jdSection}

[원본 후보자 이력서]
${resumeText}
[/원본 이력서]

[새 양식 단락 목록] (총 ${count}개 — 반드시 ${count}개 반환)
${paraList}`

  return { system, user }
}

function generatePreviewHTML(sections?: Array<{ title: string; content: string }>, rewrites?: string[]): string {
  if (sections && sections.length > 0) {
    // Section-based preview (PDF/text path)
    const sectionsHTML = sections.map(sec => `
      <div style="margin-bottom: 24px;">
        <h3 style="color: var(--accent); font-size: 16px; font-weight: 700; margin-bottom: 8px;">${sec.title}</h3>
        <div style="white-space: pre-wrap; line-height: 1.8;">${sec.content}</div>
      </div>
    `).join('')
    return `<div style="font-family: 'Noto Sans KR', sans-serif;">${sectionsHTML}</div>`
  } else if (rewrites && rewrites.length > 0) {
    // Paragraph-based preview (DOCX path)
    const parasHTML = rewrites.slice(0, 30).map(text => `
      <p style="margin-bottom: 12px; line-height: 1.8;">${text}</p>
    `).join('')
    return `<div style="font-family: 'Noto Sans KR', sans-serif;">${parasHTML}</div>`
  }
  return '<p>미리보기를 생성할 수 없습니다.</p>'
}

function generateOriginalPreviewHTML(text: string): string {
  // 원본 텍스트를 HTML로 변환 (줄바꿈 유지)
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  return `<div style="white-space: pre-wrap; line-height: 1.8; font-family: 'Noto Sans KR', sans-serif; color: #666;">${escapedText}</div>`
}

function buildCoverLetterPrompts(resumeText: string, jd: JDContext): { system: string; user: string } {
  const pos = jd.position?.trim() || '채용공고 포지션'
  const matchStr = toArr(jd.matching_points).join(' / ')
  const pitchStr = toArr(jd.pitch_points).join(' / ')
  const gapsStr = toArr(jd.gaps).join(' / ')

  const system = `🎯 역할 정의
당신은 한국 채용 시장에 정통한 커리어 컨설턴트입니다.
후보자가 제공한 이력서와 경험을 바탕으로
채용 담당자가 "이 사람 한번 만나봐야겠다"는 느낌이 드는
자기소개서를 작성합니다.

[중요: 분석 일관성 유지]
제공된 JD 분석 정보(matching_points, gaps, pitch_points)는 이 후보자의 이력서 분석 결과를 기반으로 생성되었습니다.
자기소개서 작성 시 이력서 분석의 핵심 강점을 중심으로 어필하고, 개선 포인트는 긍정적으로 재프레이밍하되, 분석 결과와 모순되는 새로운 성과나 역량을 추가하지 마십시오.

다음을 절대 하지 마십시오:
- AI가 쓴 것처럼 읽히는 문장
- 없는 경험을 만들어내는 것
- 과도한 미사여구와 추상적 표현
- 모든 사람에게 적용 가능한 범용 문장

✍️ 항목별 작성 가이드

항목 1 — 지원 사유 및 포부
목적: "왜 하필 이 회사, 이 포지션인가"를 납득시키는 것.
지원자의 커리어 방향과 회사의 방향이 교차하는 지점을 보여줘야 함.

【필수 포함 요소】
✅ "${jd.company}"를 본문에 반드시 명시
✅ JD 어필 전략 키워드가 자연스럽게 녹아 있을 것
✅ 커리어 방향과 이 회사의 접점을 구체적으로 연결

【작성 구조】
① 내가 지금까지 쌓아온 방향 한 문장
② ${jd.company}에서 발견한 접점 (JD 핵심 키워드 자연스럽게 포함)
③ 입사 후 기여하고 싶은 구체적 영역 + 성장 방향

【분량】300~400자

【절대 쓰지 말 것】
❌ "귀사의 비전에 공감하여"
❌ "글로벌 선도 기업인 귀사에서"
❌ "성장 가능성이 높은 귀사를 선택했습니다"
❌ 연봉 / 복지 / 네임밸류를 이유로 언급
❌ 어느 회사에나 쓸 수 있는 범용 문장

항목 2 — 자기소개서
목적: 이력서에 담지 못한 사람됨과 실력을 보여주는 것.
직무 역량 + 성격 + 실전 경험이 유기적으로 연결된 서술.

【작성 방향】
이력서에 이미 쓴 내용을 반복하지 말 것.
다음 소재 2~3개를 유기적으로 연결:
① 업무상 강점 — 이력서 수치로 드러나지 않는 일하는 방식/습관/태도
② 성격 — 구체적 상황 + 그 성격이 발휘된 결과로 서술 (단어 나열 금지)
   "___상황에서 ___방식으로 접근해 ___결과를 냈습니다" 구조
③ 성공 또는 실패 스토리 — STAR 구조 (상황→역할→행동→결과/수치)

【분량】600자 이상

【문체 원칙】
✅ 첫 문장은 인상적인 한 줄로 시작 (평범한 자기소개 금지)
   예: "저는 숫자보다 구조를 먼저 봅니다." / "실패한 프로젝트가 저를 만들었습니다."
✅ 단락 간 자연스러운 연결
✅ 문장 끝 변화 — 명사형/평서형 혼용으로 단조로움 방지

【절대 쓰지 말 것】
❌ "저는 성실하고 책임감 있는 사람입니다"
❌ "팀워크를 중시하며 소통을 잘합니다"
❌ "항상 최선을 다하겠습니다"
❌ ChatGPT 특유의 "첫째~, 둘째~, 셋째~" 3단 병렬 구조 반복
❌ "/" 구분자 → 반드시 "/" 로 대체

🔍 AI스러움 제거 체크리스트 (반드시 점검 후 출력)
☑ "시너지", "다양한 경험을 바탕으로", "열정적으로" → 삭제
☑ "탁월한/뛰어난/우수한" → 수치 또는 근거로 대체
☑ 수동태 남발("~하게 되었습니다") → 능동태로
☑ "/" → "/" 전면 교체
☑ 지원 사유에 "${jd.company}" 명시 확인
☑ 이 지원 사유가 다른 회사에도 쓸 수 있는가 → YES면 다시 작성
☑ 자기소개서에 성공 또는 실패 스토리 1개 이상 포함 확인
☑ 자기소개서 분량 600자 이상 확인`

  const user = `📥 인풋

[이력서 또는 경력 요약]
${resumeText}

[지원 포지션 / JD]
${pos}

[지원 회사명]
${jd.company}

[JD 적합도 분석 결과 — 어필 포인트 및 전략]
적합도: ${jd.fit_score}% / ${jd.verdict}
매칭 강점 (강조할 것): ${matchStr}
보완 포인트 (긍정 재프레이밍): ${gapsStr}
어필 전략 (녹여낼 것): ${pitchStr}`

  return { system, user }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const email = session.user.email
    const role = (session.user as { role?: string }).role ?? 'USER'

    const { data: userData } = await supabase.from('users').select('plan').eq('email', email).single()
    const plan = role === 'MANAGER' ? 'EXPERT' : (userData?.plan ?? 'FREE')

    if (role !== 'MANAGER') {
      const { allowed, limit } = await checkUsage(email, 'rewrite')
      if (!allowed) {
        return NextResponse.json(
          { error: `이번 달 이력서 생성 횟수(${limit}회)를 모두 사용했습니다. 플랜을 업그레이드하세요.` },
          { status: 403 }
        )
      }
    }

    const formData = await req.formData()
    const analysisId = formData.get('analysisId') as string | null
    const jdAnalysisId = formData.get('jdAnalysisId') as string | null
    const formatMode = (formData.get('formatMode') as string | null) ?? 'original'
    const templateFileEntry = formData.get('templateFile') as File | null

    if (!analysisId) return NextResponse.json({ error: '분석 ID가 없습니다.' }, { status: 400 })

    const { data: row } = await supabase
      .from('analyses')
      .select('id, result')
      .eq('id', analysisId)
      .eq('user_email', email)
      .single()

    if (!row) return NextResponse.json({ error: '분석을 찾을 수 없습니다.' }, { status: 404 })

    const filePath: string | undefined = row.result?._file_path
    if (!filePath) {
      return NextResponse.json(
        { error: '원본 파일이 저장되어 있지 않습니다. 이 기능은 이후 업로드된 이력서부터 사용 가능합니다.' },
        { status: 404 }
      )
    }

    // JD 컨텍스트 로드
    let jdContext: JDContext | null = null
    if (jdAnalysisId) {
      const { data: jdRow } = await supabase
        .from('jd_analyses')
        .select('result')
        .eq('id', jdAnalysisId)
        .eq('user_email', email)
        .single()
      if (jdRow?.result) {
        jdContext = jdRow.result as JDContext
      }
    }

    const { data: fileData, error: fileErr } = await supabase.storage
      .from('resumes')
      .download(filePath)

    if (fileErr || !fileData) {
      return NextResponse.json({ error: '원본 파일을 불러올 수 없습니다.' }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const originalFilename = filePath.split('/').pop() ?? 'resume'
    const ext = originalFilename.split('.').pop()?.toLowerCase() ?? ''

    const candidateName = (row.result?.candidate_name as string | undefined) ?? '이력서'
    const dateStr = new Date().toISOString().slice(0, 10)

    // ── 업데이트 이력서 기능 제거됨 (2026-06-19)
    // standard 모드는 original과 동일하게 처리
    /* formatMode === 'updated' 제거됨
    if (formatMode === 'updated' && templateFileEntry) {
      const templateBuffer = Buffer.from(await templateFileEntry.arrayBuffer())
      const templateParas = await extractDocxParagraphs(templateBuffer)
      // 템플릿의 PII 단락(헤더 등)은 Claude에 전송하지 않음
      const piiIndexes = new Set(templateParas.filter(p => hasPII(p.text)).map(p => p.index))
      const nonEmpty = templateParas.filter(p => p.text.trim().length > 2 && !piiIndexes.has(p.index)).slice(0, 60)
      const paraList = nonEmpty.map((p, i) => `[${i + 1}] ${p.text}`).join('\n')

      const resumeText = await extractText(buffer, originalFilename)
      const originalPreview = generateOriginalPreviewHTML(resumeText)
      const prompts = buildTemplateDocxPrompts(paraList, nonEmpty.length, resumeText, jdContext)

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5000,
        system: [{
          type: 'text',
          text: prompts.system,
          cache_control: { type: 'ephemeral' }
        }],
        tool_choice: { type: 'tool', name: 'rewrite_paragraphs' },
        tools: [
          {
            name: 'rewrite_paragraphs',
            description: '각 단락을 채운 결과',
            input_schema: {
              type: 'object' as const,
              properties: {
                rewrites: {
                  type: 'array',
                  description: `입력된 ${nonEmpty.length}개 단락 순서 그대로, 각각 작성된 텍스트 (반드시 ${nonEmpty.length}개)`,
                  items: { type: 'string' },
                },
                changes: {
                  type: 'array',
                  description: '주요 변경 사항 요약 (3-7개). 각 항목: "[섹션/내용] 원본 표현 → 변경 표현 / 변경 이유"',
                  items: { type: 'string' },
                },
              },
              required: ['rewrites', 'changes'],
            },
          },
        ],
        messages: [{ role: 'user', content: prompts.user }],
      })

      const toolUse = message.content.find(c => c.type === 'tool_use')
      if (!toolUse || toolUse.type !== 'tool_use') {
        return NextResponse.json({ error: '이력서 생성 결과를 받지 못했습니다.' }, { status: 500 })
      }

      const { rewrites, changes: tplChanges } = toolUse.input as { rewrites?: string[]; changes?: string[] }
      if (!Array.isArray(rewrites)) {
        return NextResponse.json({ error: '이력서 생성 결과를 받지 못했습니다.' }, { status: 500 })
      }
      const allRewrites = templateParas.map(p => {
        if (piiIndexes.has(p.index)) return p.text  // PII 단락: 원본 그대로
        const nonEmptyIdx = nonEmpty.findIndex(ne => ne.index === p.index)
        return nonEmptyIdx !== -1 ? (rewrites[nonEmptyIdx] ?? p.text) : p.text
      })

      if (role !== 'MANAGER') await incrementUsage(email, 'rewrite')

      // FREE 플랜: HTML만 생성 (DOCX 생성 안함)
      if (plan === 'FREE') {
        return NextResponse.json({
          preview: generatePreviewHTML(undefined, allRewrites),
          originalPreview,
          changes: tplChanges ?? [],
          plan: 'FREE',
        })
      }

      // PRO+ 플랜: DOCX + HTML 생성
      const docxBuffer = await applyDocxRewrites(templateBuffer, allRewrites)
      const suffix = jdContext ? `_${jdContext.company}` : ''
      const downloadName = `jobizic_updated_${candidateName}${suffix}_${dateStr}.docx`

      return NextResponse.json({
        docx: (docxBuffer as Buffer).toString('base64'),
        filename: downloadName,
        changes: tplChanges ?? [],
        preview: generatePreviewHTML(undefined, rewrites),
        originalPreview,
        plan,
      })
    }
    */

    // ── 기본 이력서 (standard): Claude 추천 포맷으로 적극 재구성
    if (formatMode === 'standard') {
      const resumeText = await extractText(buffer, originalFilename)
      const originalPreview = generateOriginalPreviewHTML(resumeText)

      // 기본 이력서는 섹션별로 완전히 재구성
      const piiVals = extractPIIValues(resumeText)
      const maskedText = maskPIILocal(resumeText)

      const systemPrompt = `당신은 10년 경력의 한국 시니어 헤드헌터입니다.${jdContext ? ` ${jdContext.company} 포지션 지원을 위해` : ''} 이력서를 전문 헤드헌터 양식으로 재구성합니다.

[헤드헌터 표준 양식 구조]
원본 이력서 내용을 아래 섹션 구조에 맞춰 작성하세요. 각 섹션은 정확히 이 순서대로 생성합니다:

1. "헤더" - 지원 회사명 / 분야 (직책), 성명, 생년월일, 나이
2. "학력사항" - 최종학력 표기, 학교명(소재지), 전공, 학위, 졸업년월
3. "경력사항" - 총 경력 기간 / 관련경력 기간, 각 경력별 기간/회사/팀/직급
4. "직무능력/업무상 강점" - 채용포지션에 적합한 경험과 강점 3-5개 (한 줄씩)
5. "개인 추가 정보" - 주소, 병역, 현재직급/연봉, 희망직급/연봉, 입사가능시기
6. "외국어 능력" - 언어별 회화수준, 시험점수, 취득년월
7. "자격증" - 자격증명, 발령처, 취득년월
8. "교육/연수/수상경력/사회봉사" - 해당 항목들
9. "Computer 능력" - 프로그래밍 언어, 툴, 프레임워크 등
10. "경력 기술서" - 각 경력마다 [회사 소개 / 담당업무 / 상세 담당업무 및 성과 / 퇴직사유] 구조로 상세 작성
11. "자기소개서" - [지원 동기] 와 [입사 후 포부] 두 개의 하위 섹션으로 구분

${jdContext ? `[JD 연동 최적화]
• matching_points: ${toArr(jdContext.matching_points).join(' / ')} → 직무능력/업무상 강점, 경력 기술서에서 전면 부각
• gaps: ${toArr(jdContext.gaps).join(' / ')} → 긍정적으로 재프레이밍
• pitch_points: ${toArr(jdContext.pitch_points).join(' / ')} → 자기소개서와 경력 기술서에 자연스럽게 녹이기
• ${jdContext.company} 맞춤 어필 강화` : ''}

[작성 규칙]
• 원본에 없는 내용은 "해당 없음" 또는 빈 항목으로 표기
• 수치/회사명/기간/기술명은 정확히 유지 (없는 내용 추가 금지)
• 약한 표현 → 강한 표현: "담당"→"주도", "참여"→"기여", "수행"→"완수"
• 구분자는 "/" 또는 "," 사용 (가운데점 금지)
• 경력 기술서는 최신 경력부터 역순으로 작성
• 전문적이고 깔끔한 어감 유지
• 각 섹션의 content는 줄바꿈(\\n)으로 구분`

      const userPrompt = `${jdContext ? buildJDSection(jdContext) : '[JD 미선택 — 일반 관점으로 작성]'}

[원본 이력서]
${maskedText}
[/원본 이력서]

위 이력서를 Claude 추천 포맷으로 깔끔하게 재구성하세요.`

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 6000,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        tool_choice: { type: 'tool', name: 'rewrite_resume' },
        tools: [{
          name: 'rewrite_resume',
          description: '이력서 재구성 결과',
          input_schema: {
            type: 'object' as const,
            properties: {
              sections: {
                type: 'array',
                description: '재구성된 이력서 섹션 목록',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: '섹션 제목' },
                    content: { type: 'string', description: '섹션 내용 (줄바꿈은 \\n 사용)' },
                  },
                  required: ['title', 'content'],
                },
              },
              changes: {
                type: 'array',
                description: '주요 변경사항 요약 (5-10개)',
                items: { type: 'string' },
              },
            },
            required: ['sections', 'changes'],
          },
        }],
        messages: [{ role: 'user', content: userPrompt }],
      })

      const toolUse = message.content.find(c => c.type === 'tool_use')
      if (!toolUse || toolUse.type !== 'tool_use') {
        console.error('[rewrite/standard] No tool_use in response:', JSON.stringify(message.content))
        return NextResponse.json({ error: '이력서 생성 실패' }, { status: 500 })
      }

      const { sections, changes } = toolUse.input as {
        sections?: Array<{ title: string; content: string }>
        changes?: string[]
      }

      if (!sections || !Array.isArray(sections)) {
        console.error('[rewrite/standard] Invalid sections:', toolUse.input)
        return NextResponse.json({ error: '이력서 섹션 생성 실패' }, { status: 500 })
      }

      // PII 복원
      const restoredSections = sections.map(s => ({
        title: restorePIIValues(s.title, piiVals),
        content: restorePIIValues(s.content, piiVals),
      }))

      if (role !== 'MANAGER') await incrementUsage(email, 'rewrite')

      // FREE: HTML만
      if (plan === 'FREE') {
        return NextResponse.json({
          preview: generatePreviewHTML(restoredSections, undefined),
          originalPreview,
          changes: changes ?? [],
          plan: 'FREE',
        })
      }

      // PRO+: DOCX 생성 (섹션 기반)
      const docxBuffer = await generateStandardDocx(restoredSections, candidateName)
      const suffix = jdContext ? `_${jdContext.company}` : ''
      const downloadName = `jobizic_standard_${candidateName}${suffix}_${dateStr}.docx`

      return NextResponse.json({
        docx: (docxBuffer as Buffer).toString('base64'),
        filename: downloadName,
        changes: changes ?? [],
        preview: generatePreviewHTML(restoredSections, undefined),
        originalPreview,
        plan,
      })
    }

    // ── 기존 이력서 DOCX: 서식 완전 보존 (XML 직접 수정)
    if (ext === 'docx') {
      const resumeText = await extractText(buffer, originalFilename)
      const originalPreview = generateOriginalPreviewHTML(resumeText)

      const paras = await extractDocxParagraphs(buffer)
      const piiIndexes = new Set(paras.filter(p => hasPII(p.text)).map(p => p.index))

      // JD 있을 때: CL 단락을 메인 call에서 제외 → 전용 buildCoverLetterPrompt call 병렬 실행
      const { clContentIndexSet, clContentIndices } = detectCLParagraphs(paras, piiIndexes)
      const excludeFromMain = jdContext ? clContentIndexSet : new Set<number>()
      const nonEmpty = paras
        .filter(p => p.text.trim().length > 2 && !piiIndexes.has(p.index) && !excludeFromMain.has(p.index))
        .slice(0, 60)

      const paraList = nonEmpty.map((p, i) => `[${i + 1}] ${p.text}`).join('\n')
      const prompts = buildDocxPrompts(paraList, nonEmpty.length, jdContext)

      // 커버레터 전용 call (JD + CL 단락 존재 시)
      const clCallPromise: Promise<{ application_reason: string; self_introduction: string } | null> =
        jdContext && clContentIndices.length > 0
          ? (async () => {
              try {
                const resumeForCL = await extractText(buffer, originalFilename)
                const piiValsCL = extractPIIValues(resumeForCL)
                const clPrompts = buildCoverLetterPrompts(maskPIILocal(resumeForCL), jdContext)
                const clMsg = await client.messages.create({
                  model: 'claude-haiku-4-5-20251001',
                  max_tokens: 2500,
                  system: [{
                    type: 'text',
                    text: clPrompts.system,
                    cache_control: { type: 'ephemeral' }
                  }],
                  tool_choice: { type: 'tool', name: 'generate_cover_letter' },
                  tools: [{
                    name: 'generate_cover_letter',
                    description: '지원 사유 및 자기소개서 전문 작성',
                    input_schema: {
                      type: 'object' as const,
                      properties: {
                        application_reason: { type: 'string', description: '지원 사유 및 포부 (300~400자, 회사명 명시)' },
                        self_introduction: { type: 'string', description: '자기소개서 (600자 이상, 경험 기반)' },
                      },
                      required: ['application_reason', 'self_introduction'],
                    },
                  }],
                  messages: [{ role: 'user', content: clPrompts.user }],
                })
                const clTool = clMsg.content.find(c => c.type === 'tool_use')
                if (clTool?.type === 'tool_use') {
                  const inp = clTool.input as { application_reason: string; self_introduction: string }
                  return {
                    application_reason: restorePIIValues(inp.application_reason, piiValsCL),
                    self_introduction: restorePIIValues(inp.self_introduction, piiValsCL),
                  }
                }
              } catch (e) { console.error('[rewrite] CL call failed (non-fatal):', e) }
              return null
            })()
          : Promise.resolve(null)

      const [message, clContent] = await Promise.all([
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 5000,
          system: [{
            type: 'text',
            text: prompts.system,
            cache_control: { type: 'ephemeral' }
          }],
          tool_choice: { type: 'tool', name: 'rewrite_paragraphs' },
          tools: [
            {
              name: 'rewrite_paragraphs',
              description: '각 단락을 재작성한 결과',
              input_schema: {
                type: 'object' as const,
                properties: {
                  rewrites: {
                    type: 'array',
                    description: `입력된 ${nonEmpty.length}개 단락 순서 그대로, 각각 재작성된 텍스트 (반드시 ${nonEmpty.length}개)`,
                    items: { type: 'string' },
                  },
                  changes: {
                    type: 'array',
                    description: '주요 변경 사항 요약 (3-7개). 각 항목: "[단락번호/섹션] 원본 → 수정본 (이유)"',
                    items: { type: 'string' },
                  },
                },
                required: ['rewrites', 'changes'],
              },
            },
          ],
          messages: [{ role: 'user', content: prompts.user }],
        }),
        clCallPromise,
      ])

      const toolUse = message.content.find(c => c.type === 'tool_use')
      if (!toolUse || toolUse.type !== 'tool_use') {
        return NextResponse.json({ error: '이력서 생성 결과를 받지 못했습니다.' }, { status: 500 })
      }

      const { rewrites, changes: docxChanges } = toolUse.input as { rewrites?: string[]; changes?: string[] }
      if (!Array.isArray(rewrites)) {
        return NextResponse.json({ error: '이력서 생성 결과를 받지 못했습니다.' }, { status: 500 })
      }

      const allRewrites = paras.map(p => {
        if (piiIndexes.has(p.index)) return p.text
        if (clContentIndexSet.has(p.index)) {
          if (clContent) {
            const slotIdx = clContentIndices.indexOf(p.index)
            if (slotIdx === 0) return clContent.application_reason
            if (slotIdx === 1) return clContent.self_introduction
          }
          return p.text  // fallback: 원본 유지
        }
        const nonEmptyIdx = nonEmpty.findIndex(ne => ne.index === p.index)
        return nonEmptyIdx !== -1 ? (rewrites[nonEmptyIdx] ?? p.text) : p.text
      })

      const allChanges = [
        ...(docxChanges ?? []),
        ...(clContent ? ['[자기소개서/지원사유] 전용 헤드헌터 프롬프트로 완전 재작성'] : []),
      ]

      if (role !== 'MANAGER') await incrementUsage(email, 'rewrite')

      // FREE 플랜: HTML만 생성 (DOCX 생성 안함)
      if (plan === 'FREE') {
        return NextResponse.json({
          preview: generatePreviewHTML(undefined, allRewrites),
          originalPreview,
          changes: allChanges,
          plan: 'FREE',
        })
      }

      // PRO+ 플랜: DOCX + HTML 생성
      const docxBuffer = await applyDocxRewrites(buffer, allRewrites)
      const suffix = jdContext ? `_${jdContext.company}` : ''
      const downloadName = `jobizic_rewrite_${candidateName}${suffix}_${dateStr}.docx`

      return NextResponse.json({
        docx: (docxBuffer as Buffer).toString('base64'),
        filename: downloadName,
        changes: allChanges,
        preview: generatePreviewHTML(undefined, rewrites),
        originalPreview,
        plan,
      })
    }

    // ── PDF / 기타: 텍스트 추출 후 섹션 기반 새 DOCX
    const resumeText = await extractText(buffer, originalFilename)
    const originalPreview = generateOriginalPreviewHTML(resumeText)
    // PII 마스킹 후 Claude에 전송, 응답에서 원본값으로 복원
    const piiValues = extractPIIValues(resumeText)
    const maskedResumeText = maskPIILocal(resumeText)
    const prompts = buildSectionPrompts(maskedResumeText, jdContext)

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: [{
        type: 'text',
        text: prompts.system,
        cache_control: { type: 'ephemeral' }
      }],
      tool_choice: { type: 'tool', name: 'rewrite_resume' },
      tools: [
        {
          name: 'rewrite_resume',
          description: '원본 이력서의 모든 섹션을 유지하며 재작성한 결과',
          input_schema: {
            type: 'object' as const,
            properties: {
              candidate_name: { type: 'string', description: '후보자 이름 (원본에서 추출, 없으면 빈 문자열)' },
              sections: {
                type: 'array',
                description: '원본 이력서의 모든 섹션을 순서대로 재작성한 목록',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: '섹션 제목 (원본 그대로)' },
                    content: { type: 'string', description: '재작성된 섹션 내용. \\n으로 구분. 목록은 "- "로 시작.' },
                  },
                  required: ['title', 'content'],
                },
              },
              changes: {
                type: 'array',
                description: '주요 변경 사항 요약 (3-7개). 각 항목: "[섹션명] 원본 표현 → 변경 표현 / 변경 이유"',
                items: { type: 'string' },
              },
            },
            required: ['sections', 'changes'],
          },
        },
      ],
      messages: [{ role: 'user', content: prompts.user }],
    })

    const toolUse = message.content.find(c => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: '이력서 생성 결과를 받지 못했습니다.' }, { status: 500 })
    }

    const rewriteData = toolUse.input as RewriteResult & { changes?: string[] }
    const sectionChanges = Array.isArray(rewriteData.changes) ? rewriteData.changes : []
    if (!rewriteData.candidate_name) rewriteData.candidate_name = candidateName

    if (!Array.isArray(rewriteData.sections) || rewriteData.sections.length === 0) {
      return NextResponse.json({ error: '이력서 섹션 데이터를 받지 못했습니다. 다시 시도해 주세요.' }, { status: 500 })
    }

    // PII 복원: Claude가 마스킹된 값으로 작성한 경우 원본 이메일/연락처/이름으로 치환
    for (const sec of rewriteData.sections) {
      sec.content = restorePIIValues(sec.content, piiValues)
    }

    // 자기소개서/지원사유 섹션: 전문 프롬프트로 대체 (JD가 있을 때)
    if (jdContext && Array.isArray(rewriteData.sections)) {
      const clSections = rewriteData.sections.filter(s => isCoverLetterSection(s.title))
      if (clSections.length > 0) {
        try {
          const clPrompts = buildCoverLetterPrompts(resumeText, jdContext)
          const clMsg = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2000,
            system: [{
              type: 'text',
              text: clPrompts.system,
              cache_control: { type: 'ephemeral' }
            }],
            tool_choice: { type: 'tool', name: 'generate_cover_letter' },
            tools: [{
              name: 'generate_cover_letter',
              description: '지원 사유 및 자기소개서 전문 작성',
              input_schema: {
                type: 'object' as const,
                properties: {
                  application_reason: { type: 'string', description: '지원 사유 및 포부 (300~400자, 회사명 명시)' },
                  self_introduction: { type: 'string', description: '자기소개서 (600자 이상, 경험 기반)' },
                },
                required: ['application_reason', 'self_introduction'],
              },
            }],
            messages: [{ role: 'user', content: clPrompts.user }],
          })
          const clTool = clMsg.content.find(c => c.type === 'tool_use')
          if (clTool?.type === 'tool_use') {
            const { application_reason, self_introduction } = clTool.input as {
              application_reason: string; self_introduction: string
            }
            for (const sec of rewriteData.sections) {
              if (!isCoverLetterSection(sec.title)) continue
              const t = coverLetterSectionType(sec.title)
              if (t === 'application') sec.content = application_reason
              else if (t === 'selfintro') sec.content = self_introduction
              else sec.content = `${application_reason}\n\n${self_introduction}`
            }
          }
        } catch (err) {
          console.error('[rewrite] cover letter generation failed (non-fatal):', err)
        }
      }
    }

    if (role !== 'MANAGER') await incrementUsage(email, 'rewrite')

    // FREE 플랜: HTML만 생성 (DOCX 생성 안함)
    if (plan === 'FREE') {
      return NextResponse.json({
        preview: generatePreviewHTML(rewriteData.sections),
        originalPreview,
        changes: sectionChanges,
        plan: 'FREE',
      })
    }

    // PRO+ 플랜: DOCX + HTML 생성
    const docxBuffer = await generateResumeDocx(rewriteData)
    const suffix = jdContext ? `_${jdContext.company}` : ''
    const downloadName = `jobizic_rewrite_${rewriteData.candidate_name}${suffix}_${dateStr}.docx`

    return NextResponse.json({
      docx: (docxBuffer as Buffer).toString('base64'),
      filename: downloadName,
      changes: sectionChanges,
      preview: generatePreviewHTML(rewriteData.sections),
      originalPreview,
      plan,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[analyze/rewrite]', msg, e)
    return NextResponse.json({ error: `서버 오류가 발생했습니다. (${msg})` }, { status: 500 })
  }
}
