// work_experience를 DOCX의 경력 섹션에 직접 삽입합니다.
// JSZip으로 DOCX를 열고 word/document.xml을 수정하여 새 paragraph를 추가합니다.

import JSZip from 'jszip'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * work_experience 데이터를 DOCX의 경력 섹션에 삽입
 *
 * @param buffer 원본 DOCX Buffer
 * @param workExperience work_experience 배열 (통합된 월간 Report 포함)
 * @param targetCompany 삽입할 회사명 (예: "애경산업")
 * @returns 수정된 DOCX Buffer
 */
export async function insertWorkExperienceToDocx(
  buffer: Buffer,
  workExperience: any[],
  targetCompany: string
): Promise<Buffer> {
  console.log('[insertWorkExp] 시작:', {
    targetCompany,
    expCount: workExperience.length
  })

  // 1. DOCX 열기
  const zip = await JSZip.loadAsync(buffer)
  const docFile = zip.file('word/document.xml')
  if (!docFile) throw new Error('DOCX 파일을 읽을 수 없습니다.')

  let docXml = await docFile.async('string')

  // 2. 대상 회사의 경력 섹션 찾기
  const targetExp = workExperience.find((exp: any) =>
    exp.company &&
    (exp.company.includes(targetCompany) || targetCompany.includes(exp.company))
  )

  if (!targetExp) {
    console.log('[insertWorkExp] 대상 회사 경력 없음')
    return buffer
  }

  if (!targetExp.description) {
    console.log('[insertWorkExp] description 없음')
    return buffer
  }

  console.log('[insertWorkExp] 대상 경력 발견:', {
    company: targetExp.company,
    descLength: targetExp.description.length,
    descPreview: targetExp.description.substring(0, 200)
  })
  console.log('[insertWorkExp] 전체 description:', targetExp.description)

  // 3. 경력 섹션에 삽입할 내용 준비
  // description을 줄 단위로 분리 (불렛 포인트별로)
  const lines = targetExp.description
    .split('\n')
    .map((line: string) => line.trim())
    .filter(Boolean)

  console.log('[insertWorkExp] 삽입할 라인 수:', lines.length)

  // 4. 회사명이 포함된 paragraph 찾기
  // "애경산업" 텍스트를 포함하는 <w:p> 위치 찾기
  const companyParaPattern = new RegExp(
    `<w:p[^>]*>[\\s\\S]*?<w:t[^>]*>[^<]*${escapeForRegex(targetCompany)}[^<]*<\\/w:t>[\\s\\S]*?<\\/w:p>`,
    'g'
  )

  let insertPosition = -1
  let match
  let foundParaXml = ''

  // 회사명이 포함된 첫 번째 paragraph 찾기
  while ((match = companyParaPattern.exec(docXml)) !== null) {
    insertPosition = match.index + match[0].length
    foundParaXml = match[0]
    console.log('[insertWorkExp] 회사명 paragraph 발견:', {
      position: insertPosition,
      preview: foundParaXml.substring(0, 200)
    })
    break
  }

  if (insertPosition === -1) {
    console.log('[insertWorkExp] 회사명 paragraph 못 찾음')
    return buffer
  }

  // 5. 기존 paragraph에서 스타일 추출 (pPr, rPr)
  const pPrMatch = foundParaXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)
  const pPrXml = pPrMatch ? pPrMatch[0] : '<w:pPr/>'

  const rPrMatch = foundParaXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)
  const rPrXml = rPrMatch ? rPrMatch[0] : ''

  // 6. 새 paragraph XML 생성
  const newParagraphs = lines.map((line: string) => {
    const escapedText = escapeXml(line)
    return `
<w:p>
  ${pPrXml}
  <w:r>
    ${rPrXml}
    <w:t xml:space="preserve">${escapedText}</w:t>
  </w:r>
</w:p>`
  }).join('')

  console.log('[insertWorkExp] 생성된 paragraph 수:', lines.length)

  // 7. XML에 삽입
  const before = docXml.substring(0, insertPosition)
  const after = docXml.substring(insertPosition)
  const newDocXml = before + newParagraphs + after

  console.log('[insertWorkExp] XML 삽입 완료')

  // 8. DOCX 재생성
  zip.file('word/document.xml', newDocXml)
  const newBuffer = (await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  })) as Buffer

  console.log('[insertWorkExp] ✅ 완료')
  return newBuffer
}

// 정규식용 escape
function escapeForRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
