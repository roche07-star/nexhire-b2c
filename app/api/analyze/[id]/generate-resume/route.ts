import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { checkUsage, incrementUsage } from '@/lib/usageLimits'
import { buildGenerateResumePrompt } from '@/lib/prompts/generate-resume'

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

    // 4. 건수 확인 (Manager는 무제한)
    if (role !== 'MANAGER') {
      const usage = await checkUsage(userEmail, 'resume')
      if (!usage.allowed) {
        return NextResponse.json({
          error: '이력서 생성 건수가 부족합니다.',
          upgradeRequired: true
        }, { status: 403 })
      }
    }

    // 5. 이미 생성된 이력서가 있는지 확인
    const { data: existingResume } = await supabase
      .from('generated_resumes')
      .select('id')
      .eq('analysis_id', analysisId)
      .single()

    if (existingResume) {
      return NextResponse.json({
        error: '이미 생성된 이력서가 있습니다. 이력서 보기를 이용해주세요.',
        resumeId: existingResume.id
      }, { status: 400 })
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

    // 7. DB에 저장
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

    // 8. 건수 차감 (Manager는 제외)
    if (role !== 'MANAGER') {
      await incrementUsage(userEmail, 'resume')
    }

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
    })
  } catch (error) {
    console.error('Generate resume error:', error)
    return NextResponse.json(
      { error: '이력서 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
