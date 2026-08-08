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

  // HTML을 파싱하여 h3 태그 기준으로 섹션 추출
  const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gi
  const matches = Array.from(html.matchAll(h3Regex))

  matches.forEach((match, index) => {
    const title = match[1].replace(/<[^>]+>/g, '').trim()

    // 다음 h3까지의 내용 추출
    const startIndex = match.index! + match[0].length
    const nextMatch = matches[index + 1]
    const endIndex = nextMatch ? nextMatch.index! : html.length

    const sectionHtml = html.substring(startIndex, endIndex)

    // HTML 태그 제거 및 텍스트 정리
    const content = sectionHtml
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<strong[^>]*>/gi, '')
      .replace(/<\/strong>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim()

    if (title && content) {
      sections.push({ title, content })
    }
  })

  return sections
}
