import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { extractText } from '@/lib/extractText'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const analyzeResumeTool: Anthropic.Tool = {
  name: 'analyze_resume',
  description: '한국어 이력서를 분석하여 구직자의 강점, 개선점, 커리어 방향을 제시합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      scores: {
        type: 'object',
        properties: {
          job_fit: { type: 'number', description: '직무 적합도 (0-100)' },
          market_competitiveness: { type: 'number', description: '시장 경쟁력 (0-100)' },
          growth_potential: { type: 'number', description: '성장 가능성 (0-100)' },
        },
        required: ['job_fit', 'market_competitiveness', 'growth_potential'],
      },
      careers: {
        type: 'array',
        items: { type: 'string' },
        description: '추천 커리어 방향 (최대 3개)',
      },
      strengths: {
        type: 'array',
        items: { type: 'string' },
        description: '이력서의 핵심 강점 (최대 4개)',
      },
      improvements: {
        type: 'array',
        items: { type: 'string' },
        description: '개선이 필요한 부분 (최대 4개)',
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: '이력서에서 발견된 핵심 키워드 (최대 8개)',
      },
      summary: {
        type: 'string',
        description: '지원자에 대한 전체 요약 (2-3문장)',
      },
    },
    required: ['scores', 'careers', 'strengths', 'improvements', 'keywords', 'summary'],
  },
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('resume') as File | null

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let resumeText: string

    try {
      resumeText = await extractText(buffer, file.name)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '파일을 읽을 수 없습니다.'
      return NextResponse.json({ error: msg }, { status: 422 })
    }

    if (!resumeText.trim()) {
      return NextResponse.json({ error: '이력서에서 텍스트를 추출할 수 없습니다.' }, { status: 422 })
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      tool_choice: { type: 'tool', name: 'analyze_resume' },
      tools: [analyzeResumeTool],
      messages: [
        {
          role: 'user',
          content: `다음 이력서를 분석해 주세요. 헤드헌터의 관점에서 강점, 약점, 적합한 커리어 방향을 객관적으로 평가해 주세요.\n\n---\n${resumeText}\n---`,
        },
      ],
    })

    const toolUse = message.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: '분석 결과를 받지 못했습니다.' }, { status: 500 })
    }

    return NextResponse.json(toolUse.input)
  } catch (e) {
    console.error('[analyze]', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
