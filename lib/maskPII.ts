export function maskPII(text: string): string {
  let masked = text

  // 이메일
  masked = masked.replace(
    /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    '[이메일]'
  )

  // 한국 전화번호 (010-1234-5678 / 010.1234.5678 / 01012345678 / 02-123-4567)
  masked = masked.replace(
    /(?:010|011|016|017|018|019|02|0[3-9]\d)[\s.\-]?\d{3,4}[\s.\-]?\d{4}/g,
    '[연락처]'
  )

  // 주민등록번호
  masked = masked.replace(/\d{6}[\-]\d{7}/g, '[주민번호]')

  // 이름 라벨 뒤의 이름 (이름: 홍길동 / 성명: John Kim)
  masked = masked.replace(
    /(이름|성명|Name|성 명|성함)\s*[:：]?\s*([가-힣]{2,5}|[a-zA-Z]{2,30}(?:\s[a-zA-Z]{1,20})?)/gi,
    '$1: [이름]'
  )

  return masked
}
