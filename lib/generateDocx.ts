import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
  TableRow,
  TableCell,
  Table,
  WidthType,
} from 'docx'

export interface RewriteResult {
  candidate_name?: string
  job_title?: string
  career_years: string
  core_competencies: string[]
  careers: {
    company: string
    period: string
    role: string
    tasks: string[]
    achievements?: string[]
    change_reason?: string
  }[]
  self_introduction: string
  job_change_reasons: { label: string; reason: string }[]
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22,
        color: '1a1a2e',
      }),
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'e8e8de', space: 4 },
    },
  })
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: '333344' })],
    bullet: { level: 0 },
    spacing: { after: 60 },
  })
}

function body(text: string, spacing = 80): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: '333344' })],
    spacing: { after: spacing },
  })
}

export async function generateResumeDocx(data: RewriteResult): Promise<Buffer> {
  const children: Paragraph[] = []

  // ── 헤더: 이름 / 직무
  if (data.candidate_name || data.job_title) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.candidate_name ?? '',
            bold: true,
            size: 52,
            color: '0a0a1f',
          }),
          ...(data.job_title
            ? [
                new TextRun({ text: '  ', size: 52 }),
                new TextRun({ text: data.job_title, size: 28, color: '555570' }),
              ]
            : []),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 },
      })
    )
  }

  // ── 경력 연차
  children.push(sectionHeading('경력 연차'))
  children.push(body(data.career_years))

  // ── 핵심 역량 / 업무상 강점
  children.push(sectionHeading('핵심 역량 / 업무상 강점'))
  for (const c of data.core_competencies) {
    children.push(bullet(c))
  }

  // ── 세부 경력 사항
  children.push(sectionHeading('세부 경력 사항'))
  for (const career of data.careers) {
    // 회사명 + 기간 + 직책
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: career.company, bold: true, size: 22, color: '1a1a2e' }),
          new TextRun({ text: `  ${career.period}  /  ${career.role}`, size: 20, color: '666680' }),
        ],
        spacing: { before: 200, after: 80 },
      })
    )
    for (const task of career.tasks) {
      children.push(bullet(task))
    }
    if (career.achievements && career.achievements.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '주요 성과', bold: true, size: 20, color: '444460' })],
          spacing: { before: 80, after: 40 },
        })
      )
      for (const a of career.achievements) {
        children.push(bullet(a))
      }
    }
  }

  // ── 자기소개
  children.push(sectionHeading('자기소개'))
  const introLines = data.self_introduction.split('\n').filter(Boolean)
  for (const line of introLines) {
    children.push(body(line, 100))
  }

  // ── 이직 사유
  if (data.job_change_reasons.length > 0) {
    children.push(sectionHeading('이직 사유'))
    for (const jr of data.job_change_reasons) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: jr.label, bold: true, size: 20, color: '333344' }),
          ],
          spacing: { before: 120, after: 40 },
        })
      )
      children.push(body(jr.reason, 80))
    }
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
