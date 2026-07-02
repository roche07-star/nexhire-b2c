import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  HeadingLevel,
  UnderlineType,
  Header,
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
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 22, color: '333344' })],
    indent: { left: 280 },
    spacing: { after: 100, line: 360 },
  })
}

function bodyLine(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: '333344' })],
    spacing: { after: 120, line: 360 },
    indent: { left: 140 },
  })
}

function contentLines(content: string): Paragraph[] {
  const lines = content.split('\n').filter(l => l.trim())
  return lines.map(line => {
    const trimmed = line.trimStart()
    if (/^[-•*▪▸]\s/.test(trimmed)) {
      return bulletLine(trimmed.replace(/^[-•*▪▸]\s*/, ''))
    }
    return bodyLine(line.trimEnd())
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
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  })

  return Packer.toBuffer(doc)
}

// 헤드헌터 표준 양식 섹션 헤더 (개선된 스타일)
function standardSectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28,
        color: '1a1a2e',
        underline: { type: UnderlineType.SINGLE, color: '1a1a2e' }
      }),
    ],
    spacing: { before: 480, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: '1a1a2e', space: 8 },
    },
  })
}

// Claude 추천 기본 이력서 포맷용 DOCX 생성
export async function generateStandardDocx(
  sections: Array<{ title: string; content: string }>,
  candidateName?: string
): Promise<Buffer> {
  const children: Paragraph[] = []

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
    children.push(...contentLines(section.content))
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
                    text: "JOBIZIC",
                    bold: true,
                    size: 28,
                    color: "1a1a2e",
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 100 },
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
