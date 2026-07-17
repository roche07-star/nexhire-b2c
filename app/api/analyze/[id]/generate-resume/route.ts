import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildGenerateResumePrompt } from '@/lib/prompts/generate-resume'
import { checkUsage, incrementUsage } from '@/lib/usageLimits'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(
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
    const role = session.user.role ?? 'USER'
    const plan = session.user.plan ?? 'FREE'
    const params = await context.params
    const analysisId = params.id

    // 2. 분석 결과 조회
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (fetchError || !analysis) {
      return NextResponse.json({ error: '분석 결과를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 3. 권한 확인
    if (analysis.user_email !== userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 4. 이미 생성된 이력서가 있는지 확인
    const { data: existingResume } = await supabase
      .from('generated_resumes')
      .select('id')
      .eq('analysis_id', analysisId)
      .single()

    const isUpdate = !!existingResume

    // 5. 플랜별 제한 체크
    if (plan === 'FREE' && isUpdate) {
      // FREE 플랜: 1번만 생성 가능 (재생성 불가)
      return NextResponse.json({
        error: 'FREE 플랜은 분석당 1개의 이력서만 생성 가능합니다. PRO 플랜으로 업그레이드하시면 무제한 재생성이 가능합니다.',
        upgradeRequired: true
      }, { status: 403 })
    }

    // 6. PRO/EXPERT 플랜: 건수 확인 (Manager는 무제한)
    if (plan !== 'FREE' && role !== 'MANAGER') {
      const usage = await checkUsage(userEmail, 'rewrite')
      if (!usage.allowed) {
        return NextResponse.json({
          error: '이력서 생성 건수가 부족합니다.',
          upgradeRequired: true
        }, { status: 403 })
      }
    }

    // 6. Claude API 호출 (이력서 생성)
    const analysisResult = analysis.result
    const originalText = analysis.original_text || ''

    const prompt = buildGenerateResumePrompt({
      originalText,
      analysisResult,
    })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192, // 긴 이력서 지원
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

    let resumeId: string

    if (isUpdate) {
      // 7-1. 기존 이력서 교체 (건수 차감 없음)
      const { error: updateError } = await supabase
        .from('generated_resumes')
        .update({
          html_content: htmlContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingResume.id)

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ error: '이력서 업데이트 실패' }, { status: 500 })
      }

      resumeId = existingResume.id

      // 7-1-1. 재생성 시 건수 차감 (모든 플랜)
      if (role !== 'MANAGER') {
        await incrementUsage(userEmail, 'rewrite')
      }
    } else {
      // 7-2. 새 이력서 생성
      const { data: resume, error: insertError } = await supabase
        .from('generated_resumes')
        .insert({
          analysis_id: analysisId,
          user_email: userEmail,
          html_content: htmlContent,
        })
        .select('id')
        .single()

      if (insertError || !resume) {
        console.error('Insert error:', insertError)
        return NextResponse.json({ error: '이력서 저장 실패' }, { status: 500 })
      }

      resumeId = resume.id

      // 7-2-1. 첫 생성 시 건수 차감 (모든 플랜)
      if (role !== 'MANAGER') {
        await incrementUsage(userEmail, 'rewrite')
      }
    }

    return NextResponse.json({
      success: true,
      resumeId,
      isUpdate, // 클라이언트에 교체 여부 알림
    })
  } catch (error) {
    console.error('Generate resume error:', error)
    return NextResponse.json(
      { error: '이력서 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
