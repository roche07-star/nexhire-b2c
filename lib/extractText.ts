import mammoth from 'mammoth'

function detectFileType(buffer: Buffer): 'pdf' | 'docx' | 'doc' | 'hwp' | 'unknown' {
  if (buffer.length < 8) return 'unknown'
  // PDF: starts with %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'pdf'
  // DOCX/ZIP: PK\x03\x04
  if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) return 'docx'
  // DOC/XLS/PPT (OLE2): D0 CF 11 E0
  if (buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0) return 'doc'
  // HWP: "HWP Document File"
  if (buffer.slice(0, 16).toString('latin1').startsWith('HWP Document Fil')) return 'hwp'
  return 'unknown'
}

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const detected = detectFileType(buffer)

  // 실제 파일 내용 우선, 알 수 없으면 확장자 폴백
  const fileType = detected !== 'unknown' ? detected : ext

  if (fileType === 'pdf') {
    const { extractText: pdfExtract } = await import('unpdf')
    const { text } = await pdfExtract(new Uint8Array(buffer))
    const result = Array.isArray(text) ? text.join('\n') : text
    if (!result.trim()) {
      throw new Error(
        '이미지 스캔 PDF는 텍스트 추출이 불가합니다. Word(DOCX)로 작성된 이력서를 업로드하거나, PDF를 텍스트 기반으로 변환해 주세요.'
      )
    }
    return result
  }

  if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ buffer })
    if (!result.value.trim()) {
      throw new Error('DOCX 파일에서 텍스트를 읽을 수 없습니다. 파일이 손상되었거나 보호되어 있을 수 있습니다.')
    }
    return result.value
  }

  if (fileType === 'doc') {
    throw new Error(
      '구형 Word(.doc) 형식은 지원되지 않습니다. Word에서 파일 → 다른 이름으로 저장 → .docx 또는 PDF로 변환 후 업로드해 주세요.'
    )
  }

  if (fileType === 'hwp' || ext === 'hwp') {
    throw new Error(
      'HWP 형식은 지원되지 않습니다. 한글에서 파일 → PDF로 저장 후 업로드해 주세요.'
    )
  }

  throw new Error(
    '지원하지 않는 파일 형식입니다. PDF 또는 DOCX 파일을 업로드해 주세요.'
  )
}
