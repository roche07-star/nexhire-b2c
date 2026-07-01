import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, content, organization, organizationType, weeklyReports } = body

    // 주간 Report 생성
    if (type === 'weekly') {
      if (!content || !organization) {
        return NextResponse.json(
          { error: '업무 내용과 소속 정보가 필요합니다.' },
          { status: 400 }
        )
      }

      const orgLabel = organizationType === 'company' ? '회사' : '학교'

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `당신은 전문 이력서 컨설턴트입니다. 사용자가 작성한 주간 업무 보고 내용을 읽고, 이력서에 포함될 수 있도록 구조화된 HTML로 정리해주세요.

**소속 정보:**
${orgLabel}: ${organization}

**주간 업무 내용:**
${content}

**요구사항:**
1. 핵심 업무만 간결하게 정리
2. 정량적 성과가 있다면 강조
3. 기술 스택, 도구, 방법론 등 구체적으로 명시
4. HTML로 작성 (ul/li 태그 사용)
5. 이력서에 바로 복사할 수 있을 정도로 완성도 높게 작성

**출력 형식:**
<ul>
  <li><strong>핵심 업무 1:</strong> 구체적인 설명</li>
  <li><strong>핵심 업무 2:</strong> 구체적인 설명</li>
  ...
</ul>

HTML만 출력하고, 다른 설명은 생략하세요.`,
          },
        ],
      })

      const htmlContent = message.content[0].type === 'text' ? message.content[0].text : ''

      // 마크다운 코드 블록 제거 (```html ... ``` 형태)
      const cleanHtml = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()

      return NextResponse.json({ html: cleanHtml })
    }

    // 월간 Report 생성 (주간 리포트 집계)
    if (type === 'monthly') {
      if (!weeklyReports || weeklyReports.length === 0) {
        return NextResponse.json(
          { error: '주간 리포트가 없습니다.' },
          { status: 400 }
        )
      }

      const orgLabel = organizationType === 'company' ? '회사' : '학교'

      const weeklyContents = weeklyReports
        .map((r: any) => `**Week ${r.week}:**\n${r.html}`)
        .join('\n\n')

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `당신은 전문 이력서 컨설턴트입니다. 사용자가 작성한 여러 주간 업무 보고를 취합하여, 이력서의 "경력 사항" 섹션에 포함될 수 있도록 월간 종합 리포트를 HTML로 작성해주세요.

**소속 정보:**
${orgLabel}: ${organization}

**주간 리포트 목록:**
${weeklyContents}

**요구사항:**
1. 중복된 내용은 제거하고 핵심만 정리
2. 시간순 또는 중요도순으로 재구성
3. 정량적 성과 강조 (숫자, 비율, 기간 등)
4. 이력서의 "경력 사항" 형식으로 작성
5. HTML로 작성 (h3, ul/li 태그 사용)

**출력 형식:**
<div>
  <h3>${organization} - 주요 성과 (${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월)</h3>
  <ul>
    <li><strong>핵심 성과 1:</strong> 구체적인 설명</li>
    <li><strong>핵심 성과 2:</strong> 구체적인 설명</li>
    ...
  </ul>
</div>

HTML만 출력하고, 다른 설명은 생략하세요.`,
          },
        ],
      })

      const htmlContent = message.content[0].type === 'text' ? message.content[0].text : ''

      // 마크다운 코드 블록 제거
      const cleanHtml = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()

      return NextResponse.json({ html: cleanHtml })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error: any) {
    console.error('Work report generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    )
  }
}
