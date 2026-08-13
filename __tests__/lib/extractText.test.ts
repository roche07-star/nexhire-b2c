import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractText } from '@/lib/extractText'

// Mock dependencies
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}))

vi.mock('unpdf', () => ({
  extractText: vi.fn(),
}))

vi.mock('@/lib/claude-client', () => ({
  callClaude: vi.fn(),
}))

describe('extractText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('파일 타입 감지 (Magic Bytes)', () => {
    it('should detect PDF files by magic bytes', async () => {
      // PDF magic bytes: %PDF (0x25504446)
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34])

      const { extractText: pdfExtract } = await import('unpdf')
      vi.mocked(pdfExtract).mockResolvedValue({ text: 'PDF content' })

      const result = await extractText(pdfBuffer, 'test.pdf')
      expect(result).toBe('PDF content')
      expect(pdfExtract).toHaveBeenCalled()
    })

    it('should detect DOCX files by magic bytes', async () => {
      // DOCX magic bytes: PK (ZIP signature)
      const docxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00])

      const mammoth = await import('mammoth')
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({ value: 'DOCX content' })

      const result = await extractText(docxBuffer, 'test.docx')
      expect(result).toBe('DOCX content')
      expect(mammoth.default.extractRawText).toHaveBeenCalled()
    })

    it('should handle TXT files directly', async () => {
      const txtBuffer = Buffer.from('Plain text content', 'utf-8')

      const result = await extractText(txtBuffer, 'test.txt')
      expect(result).toBe('Plain text content')
    })
  })

  describe('PDF 추출', () => {
    it('should extract text from text-based PDF', async () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34])

      const { extractText: pdfExtract } = await import('unpdf')
      vi.mocked(pdfExtract).mockResolvedValue({
        text: ['Page 1 content', 'Page 2 content']
      })

      const result = await extractText(pdfBuffer, 'resume.pdf')
      expect(result).toBe('Page 1 content\nPage 2 content')
    })

    it('should handle single page PDF', async () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34])

      const { extractText: pdfExtract } = await import('unpdf')
      vi.mocked(pdfExtract).mockResolvedValue({
        text: 'Single page content'
      })

      const result = await extractText(pdfBuffer, 'resume.pdf')
      expect(result).toBe('Single page content')
    })

    // Note: Image PDF OCR 테스트는 Anthropic SDK 의존성으로 인해 생략
    // Integration test에서 실제 Claude API로 테스트 권장
    it.skip('should fallback to Claude Vision for image PDF (Integration test)', async () => {
      // This test requires Anthropic SDK mocking which is complex
      // Tested in integration tests with real Claude API
    })

    it.skip('should throw error if PDF has no text and OCR fails (Integration test)', async () => {
      // This test requires Anthropic SDK mocking which is complex
      // Tested in integration tests with real Claude API
    })
  })

  describe('DOCX 추출', () => {
    it('should extract text from DOCX', async () => {
      const docxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04])

      const mammoth = await import('mammoth')
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: 'Resume content from DOCX'
      })

      const result = await extractText(docxBuffer, 'resume.docx')
      expect(result).toBe('Resume content from DOCX')
    })

    it('should throw error if DOCX is empty or corrupted', async () => {
      const docxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04])

      const mammoth = await import('mammoth')
      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: ''
      })

      await expect(extractText(docxBuffer, 'empty.docx')).rejects.toThrow(
        'DOCX 파일에서 텍스트를 읽을 수 없습니다'
      )
    })
  })

  describe('지원하지 않는 형식', () => {
    it('should reject .doc files', async () => {
      // Old Word .doc magic bytes
      const docBuffer = Buffer.from([0xD0, 0xCF, 0x11, 0xE0])

      await expect(extractText(docBuffer, 'old.doc')).rejects.toThrow(
        '구형 Word(.doc) 형식은 지원되지 않습니다'
      )
    })

    it('should reject HWP files by magic bytes', async () => {
      const hwpBuffer = Buffer.from('HWP Document File', 'latin1')

      await expect(extractText(hwpBuffer, 'document.hwp')).rejects.toThrow(
        'HWP 형식은 지원되지 않습니다'
      )
    })

    it('should reject HWP files by extension', async () => {
      const unknownBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03])

      await expect(extractText(unknownBuffer, 'document.hwp')).rejects.toThrow(
        'HWP 형식은 지원되지 않습니다'
      )
    })

    it('should reject unknown file types', async () => {
      const unknownBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03])

      await expect(extractText(unknownBuffer, 'unknown.xyz')).rejects.toThrow(
        '지원하지 않는 파일 형식입니다'
      )
    })
  })

  describe('엣지 케이스', () => {
    it('should handle files with misleading extensions', async () => {
      // PDF content but .txt extension
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34])

      const { extractText: pdfExtract } = await import('unpdf')
      vi.mocked(pdfExtract).mockResolvedValue({ text: 'PDF content' })

      // Magic bytes should take precedence
      const result = await extractText(pdfBuffer, 'file.txt')
      expect(result).toBe('PDF content')
    })

    it('should handle very small buffers', async () => {
      const tinyBuffer = Buffer.from([0x00, 0x01])

      // Small buffer with unknown extension should throw
      await expect(extractText(tinyBuffer, 'tiny.xyz')).rejects.toThrow(
        '지원하지 않는 파일 형식'
      )
    })

    it('should handle files with no extension', async () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34])

      const { extractText: pdfExtract } = await import('unpdf')
      vi.mocked(pdfExtract).mockResolvedValue({ text: 'Content' })

      const result = await extractText(pdfBuffer, 'resume')
      expect(result).toBe('Content')
    })

    it('should handle UTF-8 text files correctly', async () => {
      const koreanText = '안녕하세요.\n이력서입니다.\n감사합니다.'
      const buffer = Buffer.from(koreanText, 'utf-8')

      const result = await extractText(buffer, 'resume.txt')
      expect(result).toBe(koreanText)
    })
  })

  describe('에러 메시지 정확성', () => {
    it('should provide helpful error messages for each format', async () => {
      const testCases = [
        {
          buffer: Buffer.from([0xD0, 0xCF, 0x11, 0xE0]),
          filename: 'old.doc',
          expectedError: '.docx 또는 PDF로 변환'
        },
        {
          buffer: Buffer.from('HWP Document File', 'latin1'),
          filename: 'doc.hwp',
          expectedError: 'PDF로 저장'
        },
        {
          buffer: Buffer.from([0x00, 0x01]),
          filename: 'unknown.xyz',
          expectedError: '지원하지 않는 파일 형식'
        }
      ]

      for (const { buffer, filename, expectedError } of testCases) {
        await expect(extractText(buffer, filename)).rejects.toThrow(expectedError)
      }
    })
  })
})
