// STORE 상품 정보 (서버용 - 가격 검증)
export const STORE_PRODUCTS = {
  '1': { name: '이력서 분석', price: 1900, feature: 'analyze' },  // ✅ 플랜 사용량 키와 일치
  '1-1': { name: '📁 추가 저장 Slot', price: 12900, feature: 'storage' },
  '2': { name: 'JD 적합도 분석', price: 2900, feature: 'jd_match' },  // ✅ jd → jd_match로 변경
  '2-1': { name: 'JD 분석', price: 2900, feature: 'jd_analysis' },  // ✅ 신규 추가
  '3': { name: '이력서 생성', price: 4900, feature: 'rewrite' },
  '4': { name: '면접 가이드', price: 11900, feature: 'interview' },
  '5': { name: '클라이언트 제안서', price: 4900, feature: 'proposal' },
  '6': { name: '🎁 올인원 패키지', price: 39900, feature: 'package' },
} as const

export type ProductId = keyof typeof STORE_PRODUCTS
