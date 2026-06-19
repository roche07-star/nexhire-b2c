import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
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
    children: [new TextRun({ text: `/ ${text}`, size: 20, color: '333344' })],
    indent: { left: 200 },
    spacing: { after: 60 },
  })
}

function bodyLine(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: '333344' })],
    spacing: { after: 80 },
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
