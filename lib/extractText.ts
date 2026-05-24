import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    await parser.destroy()
    return result.text
  }

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (ext === 'hwp') {
    throw new Error('HWP 형식은 현재 지원되지 않습니다. PDF 또는 DOCX로 변환 후 업로드해 주세요.')
  }

  throw new Error('지원하지 않는 파일 형식입니다. PDF 또는 DOCX 파일을 업로드해 주세요.')
}
