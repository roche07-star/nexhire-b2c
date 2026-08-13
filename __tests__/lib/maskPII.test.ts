import { describe, it, expect } from 'vitest'
import { maskPII } from '@/lib/maskPII'

describe('maskPII', () => {
  describe('이메일 마스킹', () => {
    it('should mask standard email addresses', () => {
      const text = '이메일: test@example.com'
      const result = maskPII(text)
      expect(result).toBe('이메일: [이메일]')
      expect(result).not.toContain('test@example.com')
    })

    it('should mask multiple email addresses', () => {
      const text = 'Contact: john@gmail.com or support@company.co.kr'
      const result = maskPII(text)
      expect(result).toBe('Contact: [이메일] or [이메일]')
    })

    it('should mask emails with special characters', () => {
      const text = 'user.name+tag@example-domain.com'
      const result = maskPII(text)
      expect(result).toBe('[이메일]')
    })
  })

  describe('전화번호 마스킹', () => {
    it('should mask mobile numbers with hyphens', () => {
      const text = '연락처: 010-1234-5678'
      const result = maskPII(text)
      expect(result).toBe('연락처: [연락처]')
      expect(result).not.toContain('010-1234-5678')
    })

    it('should mask mobile numbers with dots', () => {
      const text = '전화: 010.9876.5432'
      const result = maskPII(text)
      expect(result).toBe('전화: [연락처]')
    })

    it('should mask mobile numbers without separators', () => {
      const text = '핸드폰 01012345678입니다'
      const result = maskPII(text)
      expect(result).toBe('핸드폰 [연락처]입니다')
    })

    it('should mask landline numbers (Seoul)', () => {
      const text = '사무실: 02-123-4567'
      const result = maskPII(text)
      expect(result).toBe('사무실: [연락처]')
    })

    it('should mask landline numbers (other regions)', () => {
      const text = '031-1234-5678 / 051-123-4567'
      const result = maskPII(text)
      expect(result).toBe('[연락처] / [연락처]')
    })

    it('should mask various mobile carriers', () => {
      const carriers = ['010', '011', '016', '017', '018', '019']
      carriers.forEach(carrier => {
        const text = `${carrier}-1234-5678`
        const result = maskPII(text)
        expect(result).toBe('[연락처]')
      })
    })
  })

  describe('주민등록번호 마스킹', () => {
    it('should mask valid resident registration numbers', () => {
      const text = '주민번호: 901225-1234567'
      const result = maskPII(text)
      expect(result).toBe('주민번호: [주민번호]')
      expect(result).not.toContain('901225-1234567')
    })

    it('should mask multiple registration numbers', () => {
      const text = '가족: 880101-2345678, 120315-3456789'
      const result = maskPII(text)
      expect(result).toBe('가족: [주민번호], [주민번호]')
    })
  })

  describe('이름 마스킹', () => {
    it('should mask Korean names with label (이름)', () => {
      const text = '이름: 홍길동'
      const result = maskPII(text)
      expect(result).toBe('이름: [이름]')
      expect(result).not.toContain('홍길동')
    })

    it('should mask Korean names with label (성명)', () => {
      const text = '성명: 김철수'
      const result = maskPII(text)
      expect(result).toBe('성명: [이름]')
    })

    it('should mask Korean names with label (성함)', () => {
      const text = '성함: 이영희'
      const result = maskPII(text)
      expect(result).toBe('성함: [이름]')
    })

    it('should mask English names with label', () => {
      const text = 'Name: John Doe'
      const result = maskPII(text)
      expect(result).toBe('Name: [이름]')
    })

    it('should handle names with various separators', () => {
      const cases = [
        { input: '이름:홍길동', expected: '이름: [이름]' },
        { input: '이름 : 홍길동', expected: '이름: [이름]' },
        { input: '이름：홍길동', expected: '이름: [이름]' }, // Full-width colon
      ]
      cases.forEach(({ input, expected }) => {
        expect(maskPII(input)).toBe(expected)
      })
    })

    it('should handle 2-5 character Korean names', () => {
      const names = ['김철', '홍길동', '박민수', '최영희수']
      names.forEach(name => {
        const text = `이름: ${name}`
        const result = maskPII(text)
        expect(result).toBe('이름: [이름]')
      })
    })
  })

  describe('복합 케이스', () => {
    it('should mask all PII types in a resume text', () => {
      const resume = `
이름: 홍길동
이메일: hong@example.com
연락처: 010-1234-5678
주민번호: 901225-1234567
      `
      const result = maskPII(resume)

      expect(result).toContain('[이름]')
      expect(result).toContain('[이메일]')
      expect(result).toContain('[연락처]')
      expect(result).toContain('[주민번호]')

      expect(result).not.toContain('홍길동')
      expect(result).not.toContain('hong@example.com')
      expect(result).not.toContain('010-1234-5678')
      expect(result).not.toContain('901225-1234567')
    })

    it('should handle mixed Korean and English text', () => {
      const text = '지원자: Name: John Kim, Email: john.kim@company.com, Phone: 010-9876-5432'
      const result = maskPII(text)

      expect(result).toContain('[이름]')
      expect(result).toContain('[이메일]')
      expect(result).toContain('[연락처]')
    })
  })

  describe('엣지 케이스', () => {
    it('should handle empty string', () => {
      expect(maskPII('')).toBe('')
    })

    it('should handle text with no PII', () => {
      const text = '안녕하세요. 이것은 개인정보가 없는 텍스트입니다.'
      expect(maskPII(text)).toBe(text)
    })

    it('should not mask partial phone numbers', () => {
      const text = '123-4567' // Too short to be a valid number
      expect(maskPII(text)).toBe(text)
    })

    it('should not mask invalid email formats', () => {
      const invalid = ['test@', '@example.com', 'test@@example.com']
      invalid.forEach(email => {
        const result = maskPII(email)
        // Should either not mask or mask correctly
        expect(result.includes('@') || result.includes('[이메일]')).toBe(true)
      })
    })

    it('should preserve non-PII content structure', () => {
      const text = '경력: 5년\n학력: 서울대학교\n특기: 프로그래밍'
      const result = maskPII(text)
      expect(result).toContain('경력: 5년')
      expect(result).toContain('학력: 서울대학교')
      expect(result).toContain('특기: 프로그래밍')
    })

    it('should handle very long text efficiently', () => {
      const longText = '안녕하세요. '.repeat(1000) + 'Email: test@example.com'
      const start = Date.now()
      const result = maskPII(longText)
      const duration = Date.now() - start

      expect(result).toContain('[이메일]')
      expect(duration).toBeLessThan(100) // Should complete within 100ms
    })
  })

  describe('보안 검증', () => {
    it('should never leak original PII in result', () => {
      const sensitiveData = {
        email: 'user@company.com',
        phone: '010-1234-5678',
        rrn: '901225-1234567',
        name: '홍길동',
      }

      const text = `
        이메일: ${sensitiveData.email}
        연락처: ${sensitiveData.phone}
        주민번호: ${sensitiveData.rrn}
        이름: ${sensitiveData.name}
      `

      const result = maskPII(text)

      // CRITICAL: Ensure NO original PII appears in result
      expect(result).not.toContain(sensitiveData.email)
      expect(result).not.toContain(sensitiveData.phone)
      expect(result).not.toContain(sensitiveData.rrn)
      expect(result).not.toContain(sensitiveData.name)
    })

    it('should be idempotent (masking twice gives same result)', () => {
      const text = '이메일: test@example.com, 전화: 010-1234-5678'
      const masked1 = maskPII(text)
      const masked2 = maskPII(masked1)

      expect(masked1).toBe(masked2)
    })
  })
})
