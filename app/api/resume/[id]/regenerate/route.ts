import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildGenerateResumePrompt } from '@/lib/prompts/generate-resume'

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
