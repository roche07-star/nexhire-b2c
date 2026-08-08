import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateStandardDocx } from '@/lib/generateDocx'

interface Section {
  title: string
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { html, candidateName } = await req.json()

    if (!html) {
      return NextResponse.json({ error: 'HTML required' }, { status: 400 })
    }

    // HTML에서 섹션 추출
    const sections = parseHTMLToSections(html)

    // DOCX 생성
    const docxBuffer = await generateStandardDocx(sections, candidateName || '지원자')

    return NextResponse.json({
      docx: (docxBuffer as Buffer).toString('base64'),
      filename: `jobizic_resume_${new Date().toISOString().split('T')[0]}.docx`,
    })
  } catch (error) {
    console.error('HTML to DOCX 변환 오류:', error)
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 })
  }
}

function parseHTMLToSections(html: string): Section[] {
  const sections: Section[] = []

  // HTML을 파싱하여 h2, h3 태그 기준으로 섹션 추출
  const headerRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi
  const matches = Array.from(html.matchAll(headerRegex))

  matches.forEach((match, index) => {
    const title = match[1].replace(/<[^>]+>/g, '').trim()

    // 다음 h3까지의 내용 추출
    const startIndex = match.index! + match[0].length
    const nextMatch = matches[index + 1]
    const endIndex = nextMatch ? nextMatch.index! : html.length

    const sectionHtml = html.substring(startIndex, endIndex)

    // HTML 태그 제거 및 텍스트 정리 (가독성 고려)
    const content = sectionHtml
      // 블록 요소는 줄바꿈으로
      .replace(/<\/div>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n\n')  // 문단 구분 명확히
      .replace(/<p[^>]*>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      // 인라인 요소는 유지
      .replace(/<strong[^>]*>/gi, '')
      .replace(/<\/strong>/gi, '')
      .replace(/<span[^>]*>/gi, '')
      .replace(/<\/span>/gi, '')
      // 리스트 요소
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<ul[^>]*>|<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>|<\/ol>/gi, '\n')
      // 나머지 태그 제거
      .replace(/<[^>]+>/g, '')
      // HTML 엔티티 디코딩
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // 줄 정리 (가독성 유지)
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')  // 3개 이상 연속 줄바꿈 → 2개로
      .trim()

    if (title && content) {
      sections.push({ title, content })
    }
  })

  return sections
}
