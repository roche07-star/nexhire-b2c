/**
 * 이력서 재작성 공통 프롬프트
 * buildDocxPrompts, buildSectionPrompts, buildTemplateDocxPrompts에서 공통으로 사용
 */

interface JDContext {
  company: string
  position?: string | null
  fit_score: number
  verdict: string
  matching_points: string[]
  gaps: string[]
  pitch_points: string[]
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

/**
 * 핵심역량/업무상 강점 작성 지침
 *
 * @param jd - JD 분석 결과 (optional)
 * @param proposal - 제안서 데이터 (optional)
 * @returns 핵심역량 작성 지침 문자열
 */
export function buildCoreCompetencyRules(jd: JDContext | null, proposal?: any): string {
  return `
🔗 [핵심역량/업무상 강점 작성 지침] — 공통 프롬프트 (lib/prompts/rewrite-common.ts)
**핵심역량 / 업무상 강점 — 완전히 새로 작성**
🚨 **중요**: 기존 이력서의 핵심역량/업무상 강점 내용을 절대 사용하지 마십시오. 아래 지침만으로 처음부터 완전히 새롭게 작성하십시오.

${proposal?.strengths ? `
**제안서 강점을 그대로 복사**:
${proposal.strengths.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

❗ 위 제안서 핵심 강점을 한 글자도 바꾸지 말고 그대로 핵심역량/업무상 강점 섹션으로 사용하십시오.
❗ 기존 이력서의 핵심역량/업무상 강점 내용은 완전히 무시하십시오.
` : jd ? `
**JD 분석 기반으로 완전히 새로 작성**:
- 아래 JD 매칭 포인트만을 사용하여 핵심역량/업무상 강점을 처음부터 새로 작성
- JD 필수 요건: ${toArr(jd.matching_points).slice(0, 3).join(', ')}
- 위 키워드를 기반으로 구체적인 강점 항목 작성
- 핵심 기술/툴/플랫폼명 + 숙련도 명시 (상/중/하 또는 경력 연수)
- 정량 수치가 있으면 반드시 노출 (%, 건수, 금액, 기간 등)

❗ 기존 이력서의 핵심역량/업무상 강점 문구는 절대 사용 금지
❗ 100% 새로운 내용으로 작성
` : ''}`.trim()
}

/**
 * 사실 변경 금지 규칙 (핵심역량 예외 포함)
 *
 * @returns 사실 변경 금지 규칙 문자열
 */
export function buildFactPreservationRules(): string {
  return `
**사실 변경 금지**
- 회사명, 기간, 수치, 기술명 절대 변경 금지
- ⚠️ **예외**: 핵심역량/업무상 강점 섹션은 제외 (이 섹션은 완전히 새로 작성)`.trim()
}

/**
 * 기본 보완 원칙 (핵심역량 예외 포함)
 *
 * @param jd - JD 분석 결과 (optional)
 * @returns 기본 보완 원칙 문자열
 */
export function buildBasicSupplementRules(jd: JDContext | null): string {
  return `
[기본 보완 원칙]
1. 수치/기술명/회사명/기간은 절대 변경하지 않습니다 (없는 수치나 성과 추가 금지)
   ⚠️ **단, 핵심역량/업무상 강점 섹션은 예외**: 이 섹션은 제안서/JD 기반으로 완전히 새로 작성
2. 약한 동사를 강하게 교체합니다: "담당" → "주도", "참여" → "기여", "수행" → "실행", "진행" → "추진"
3. 이름/날짜/구분선/헤더/단순 레이블 단락은 반드시 원본 그대로 반환합니다
4. 가운데점 "/" 사용 금지, 구분은 "/" 또는 "," 사용
5. 불필요한 조사/접속사/수식어를 제거해 문장을 간결하게 정리합니다${!jd ? `
6. 채용 담당자가 긍정적으로 읽히도록 포지셔닝을 강화합니다` : ''}`.trim()
}
