import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  HeadingLevel,
  Header,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
} from 'docx'

export interface RewriteResult {
  candidate_name?: string
  sections: Array<{
    title: string
    content: string
  }>
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text, bold: true, size: 24, color: '1a1a2e' }),
    ],
    spacing: { before: 360, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'cccccc', space: 4 },
    },
  })
}

function bulletLine(text: string): Paragraph {
  // bullet 추가하고 bold 파싱
  const bulletText = `• ${text}`
  const children = parseBoldText(bulletText)
  return new Paragraph({
    children,
    indent: { left: 280 },
    spacing: { after: 100, line: 240 },
  })
}

// **텍스트** 패턴을 실제 bold TextRun으로 변환
function parseBoldText(text: string): TextRun[] {
  const parts: TextRun[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // ** 앞의 일반 텍스트
    if (match.index > lastIndex) {
      parts.push(new TextRun({
        text: text.substring(lastIndex, match.index),
        size: 22,
        color: '333344'
      }))
    }
    // bold 텍스트
    parts.push(new TextRun({
      text: match[1],
      bold: true,
      size: 22,
      color: '333344'
    }))
    lastIndex = regex.lastIndex
  }

  // 남은 일반 텍스트
  if (lastIndex < text.length) {
    parts.push(new TextRun({
      text: text.substring(lastIndex),
      size: 22,
      color: '333344'
    }))
  }

  return parts.length > 0 ? parts : [new TextRun({ text, size: 22, color: '333344' })]
}

function bodyLine(text: string, alignment?: any): Paragraph {
  return new Paragraph({
    children: parseBoldText(text),
    spacing: { after: 120, line: 240 },
    indent: alignment ? undefined : { left: 140 },
    alignment,
  })
}

function contentLines(content: string, alignment?: any): Paragraph[] {
  const lines = content.split('\n').filter(l => l.trim())
  return lines.map(line => {
    const trimmed = line.trimStart()
    if (/^[-•*▪▸]\s/.test(trimmed)) {
      return bulletLine(trimmed.replace(/^[-•*▪▸]\s*/, ''))
    }
    return bodyLine(line.trimEnd(), alignment)
  })
}

// 표 형식 텍스트를 Table로 변환
function parseTable(content: string): Table | null {
  const lines = content.split('\n').filter(l => l.trim())
  const tableLines = lines
    .filter(l => l.trim().startsWith('|'))
    // 마크다운 테이블 구분선(|---|---|) 제외
    .filter(line => {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
      return !cells.every(cell => /^-+$/.test(cell))
    })

  if (tableLines.length === 0) return null

  const rows = tableLines.map(line => {
    const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
    return new TableRow({
      children: cells.map(cell =>
        new TableCell({
          children: [new Paragraph({
            children: parseBoldText(cell),
            spacing: { after: 60, line: 240 },
          })],
          verticalAlign: VerticalAlign.CENTER,
          margins: {
            top: 100,
            bottom: 100,
            left: 100,
            right: 100,
          },
        })
      ),
    })
  })

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '999999' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' },
      left: { style: BorderStyle.SINGLE, size: 6, color: '999999' },
      right: { style: BorderStyle.SINGLE, size: 6, color: '999999' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: '999999' },
      insideVertical: { style: BorderStyle.SINGLE, size: 6, color: '999999' },
    },
  })
}

export async function generateResumeDocx(data: RewriteResult): Promise<Buffer> {
  const children: Paragraph[] = []

  // 이름 헤더
  if (data.candidate_name) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: data.candidate_name, bold: true, size: 56, color: '0a0a1f' }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 240 },
      })
    )
  }

  // 원본 섹션 순서 그대로
  for (const section of (data.sections ?? [])) {
    children.push(sectionHeading(section.title))
    children.push(...contentLines(section.content))
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: '맑은 고딕', size: 20, color: '222233' },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'JOBIZIC',
                    bold: true,
                    size: 28,
                    color: 'e8ff47',
                    shading: { fill: '18181b', type: 'solid' }
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 200 },
              }),
            ],
          }),
        },
        children,
      },
    ],
  })

  return Packer.toBuffer(doc)
}

// 헤드헌터 표준 양식 섹션 헤더 (깔끔한 스타일, 밑줄 없음)
function standardSectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28,
        color: '1a1a2e',
      }),
    ],
    spacing: { before: 480, after: 200 },
  })
}

// Claude 추천 기본 이력서 포맷용 DOCX 생성
export async function generateStandardDocx(
  sections: Array<{ title: string; content: string }>,
  candidateName?: string
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = []

  // 이름 헤더 (중앙 정렬, 더 크게)
  if (candidateName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: candidateName, bold: true, size: 64, color: '0a0a1f' }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 360 },
        border: {
          bottom: { style: BorderStyle.DOUBLE, size: 16, color: '1a1a2e', space: 12 },
        },
      })
    )
  }

  // 섹션 순서 그대로
  for (const section of sections) {
    children.push(standardSectionHeading(section.title))

    // 확인 문구는 우측 정렬
    const isConfirmation = section.content.includes('상기 기재 사항')
    const alignment = isConfirmation ? AlignmentType.RIGHT : undefined

    // 학력 사항, 경력 사항은 표 형식으로
    if (section.title.includes('학력') || section.title.includes('경력')) {
      const table = parseTable(section.content)
      if (table) {
        children.push(table)
        // 표가 아닌 나머지 텍스트 (예: "총 경력: 13년 8개월")
        const nonTableLines = section.content.split('\n').filter(l => l.trim() && !l.trim().startsWith('|'))
        if (nonTableLines.length > 0) {
          children.push(...contentLines(nonTableLines.join('\n'), alignment))
        }
      } else {
        children.push(...contentLines(section.content, alignment))
      }
    } else {
      children.push(...contentLines(section.content, alignment))
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: '맑은 고딕', size: 22, color: '222233' },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'JOBIZIC',
                    bold: true,
                    size: 28,
                    color: 'e8ff47',
                    shading: { fill: '18181b', type: 'solid' }
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 200 },
              }),
            ],
          }),
        },
        children,
      },
    ],
  })

  return Packer.toBuffer(doc)
}
