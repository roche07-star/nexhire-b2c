import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 인증 확인
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email
    const params = await context.params
    const resumeId = params.id

    // 2. 기존 이력서 조회
    const { data: resume, error: fetchError } = await supabase
      .from('generated_resumes')
      .select('*')
      .eq('id', resumeId)
      .single()

    if (fetchError || !resume) {
      return NextResponse.json({ error: '이력서를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 3. 권한 확인
    if (resume.user_email !== userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 4. 분석 결과 조회
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', resume.analysis_id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: '분석 결과를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 5. Claude API 호출 (이력서 재생성)
    const analysisResult = analysis.result
    const originalText = analysis.original_text || ''

    const prompt = `당신은 전문 이력서 컨설턴트입니다.

다음은 AI가 분석한 이력서 분석 결과입니다:

### 원본 이력서 텍스트:
${originalText}

### 분석 결과:
- 직무: ${analysisResult.job_title || '미지정'}
- 경력: ${analysisResult.experience_years || 0}년
- 핵심 키워드: ${(analysisResult.keywords || []).join(', ')}
- 강점: ${(analysisResult.strengths || []).join(', ')}
- 개선 포인트: ${(analysisResult.improvements || []).join(', ')}
- 종합 요약: ${analysisResult.summary || ''}

---

**요청사항:**
위 분석 결과를 바탕으로, **개선된 한국어 이력서를 HTML 형식으로 작성**해주세요.

**요구사항:**
1. 한국 기업용 이력서 형식 (깔끔하고 전문적인 레이아웃)
2. 분석 결과의 강점을 부각하고, 개선 포인트를 반영
3. 핵심 키워드를 자연스럽게 녹여냄
4. 인쇄 최적화 (A4 용지 기준)
5. 반응형 디자인 (모바일에서도 읽기 쉽게)
6. 완전한 HTML 문서 (<!DOCTYPE html>부터 </html>까지)
7. 인라인 CSS 사용 (외부 CSS 없이)
8. 실제 채용 담당자가 볼 수 있는 수준의 완성도

**포함할 섹션:**
- 기본 정보 (이름, 연락처, 이메일 등)
- 경력 요약
- 핵심 역량/기술
- 경력 사항 (상세)
- 학력
- 프로젝트 (해당시)
- 기타 (자격증, 어학 등)

**주의사항:**
- 개인정보(이름, 연락처 등)가 원본 이력서에 없다면, [이름], [이메일], [전화번호] 등의 플레이스홀더 사용
- 과장하지 말고, 원본 이력서의 사실 기반으로 작성
- 분석 결과의 개선 포인트를 자연스럽게 반영

완성된 HTML을 출력해주세요.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const htmlContent = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n')
      .trim()

    // 6. DB 업데이트 (기존 이력서 교체)
    const { error: updateError } = await supabase
      .from('generated_resumes')
      .update({
        html_content: htmlContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resumeId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: '이력서 업데이트 실패' }, { status: 500 })
    }

    // 건수 차감 없음!

    return NextResponse.json({
      success: true,
      message: '이력서가 재생성되었습니다.',
    })
  } catch (error) {
    console.error('Regenerate resume error:', error)
    return NextResponse.json(
      { error: '이력서 재생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
