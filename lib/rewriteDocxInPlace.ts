// DOCX 파일의 서식을 완전히 보존하면서 텍스트만 재작성합니다.
// DOCX는 ZIP 아카이브이며 word/document.xml에 본문이 있습니다.
// w:p (단락) 단위로 텍스트를 추출 → Claude 재작성 → 원본 XML에 주입합니다.

import JSZip from 'jszip'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// 단락 XML에서 텍스트만 추출 (w:t 요소 합산)
function extractParaText(paraXml: string): string {
  let text = ''
  const re = /<w:t[^>]*>([^<]*)<\/w:t>/g
  let m
  while ((m = re.exec(paraXml)) !== null) text += m[1]
  return text
}

// 단락의 첫 번째 content run에 새 텍스트를 넣고 나머지 content run은 제거합니다.
// w:instrText, w:fldChar 등 field run은 건드리지 않습니다.
function rebuildPara(paraXml: string, newText: string): string {
  let firstContentRunDone = false

  return paraXml.replace(/<w:r[ >][\s\S]*?<\/w:r>/g, (runXml) => {
    // field run이면 그대로 둠
    if (/<w:instrText|<w:fldChar/.test(runXml)) return runXml

    // content run (w:t 포함)
    if (!firstContentRunDone) {
      firstContentRunDone = true
      const rPrMatch = runXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)
      const rPrXml = rPrMatch ? rPrMatch[0] : ''
      const spaceAttr =
        newText.startsWith(' ') || newText.endsWith(' ')
          ? ' xml:space="preserve"'
          : ''
      return `<w:r>${rPrXml}<w:t${spaceAttr}>${escapeXml(newText)}</w:t></w:r>`
    }
    return '' // 나머지 content run 제거
  })
}

export interface DocxParagraph {
  index: number
  text: string   // 빈 단락이면 ''
}

// DOCX buffer에서 모든 단락 텍스트를 순서대로 추출합니다.
export async function extractDocxParagraphs(buffer: Buffer): Promise<DocxParagraph[]> {
  const zip = await JSZip.loadAsync(buffer)
  const docFile = zip.file('word/document.xml')
  if (!docFile) throw new Error('DOCX 파일을 읽을 수 없습니다.')

  const docXml = await docFile.async('string')
  const result: DocxParagraph[] = []
  let idx = 0
  let pos = 0

  while (true) {
    const start = docXml.indexOf('<w:p ', pos)
    const startAlt = docXml.indexOf('<w:p>', pos)
    const sIdx = start === -1 ? startAlt : startAlt === -1 ? start : Math.min(start, startAlt)
    if (sIdx === -1) break

    const end = docXml.indexOf('</w:p>', sIdx)
    if (end === -1) break

    const paraXml = docXml.slice(sIdx, end + 6)
    result.push({ index: idx++, text: extractParaText(paraXml) })
    pos = end + 6
  }

  return result
}

// rewrites 배열(단락 순서대로)을 원본 DOCX XML에 적용하고 새 Buffer를 반환합니다.
export async function applyDocxRewrites(
  buffer: Buffer,
  rewrites: string[]        // extractDocxParagraphs 인덱스와 1:1 대응
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer)
  const docFile = zip.file('word/document.xml')!
  let docXml = await docFile.async('string')

  let idx = 0
  let pos = 0
  let result = ''

  while (true) {
    const start = docXml.indexOf('<w:p ', pos)
    const startAlt = docXml.indexOf('<w:p>', pos)
    const sIdx = start === -1 ? startAlt : startAlt === -1 ? start : Math.min(start, startAlt)
    if (sIdx === -1) {
      result += docXml.slice(pos)
      break
    }

    const end = docXml.indexOf('</w:p>', sIdx)
    if (end === -1) {
      result += docXml.slice(pos)
      break
    }

    result += docXml.slice(pos, sIdx)   // 단락 이전 XML 그대로

    const paraXml = docXml.slice(sIdx, end + 6)
    const newText = rewrites[idx] ?? ''
    const originalText = extractParaText(paraXml)

    // 원본이 비어있거나 새 텍스트가 없으면 그대로 유지
    if (!originalText.trim() || !newText.trim()) {
      result += paraXml
    } else {
      result += rebuildPara(paraXml, newText)
    }

    idx++
    pos = end + 6
  }

  zip.file('word/document.xml', result)
  return (await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })) as Buffer
}
