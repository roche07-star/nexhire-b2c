/**
 * 기간제 이용권 상품 정보
 */

export type ProductId =
  | 'jobseeker-pro-1m'
  | 'jobseeker-pro-3m'
  | 'jobseeker-expert-1m'
  | 'jobseeker-expert-3m'
  | 'headhunter-pro-1m'
  | 'headhunter-pro-3m'
  | 'headhunter-expert-1m'
  | 'headhunter-expert-3m'

export interface Product {
  id: ProductId
  name: string
  price: number // 원
  duration: number // 개월
  plan: 'PRO' | 'EXPERT'
  userType: 'JOBSEEKER' | 'HEADHUNTER'
  features: string[]
  discount?: number // % (3개월권 할인율)
  originalPrice?: number // 할인 전 가격
}

export const PRODUCTS: Record<ProductId, Product> = {
  // 구직자 - PRO
  'jobseeker-pro-1m': {
    id: 'jobseeker-pro-1m',
    name: '[구직자] PRO 1개월 이용권',
    price: 9900,
    duration: 1,
    plan: 'PRO',
    userType: 'JOBSEEKER',
    features: [
      '이력서 분석 20회',
      'JD 분석 20회',
      '이력서 생성 10회',
      '면접 가이드 10회',
      '주간 Report 4회',
      '월간 Report 1회'
    ]
  },
  'jobseeker-pro-3m': {
    id: 'jobseeker-pro-3m',
    name: '[구직자] PRO 3개월 이용권',
    price: 26700,
    originalPrice: 29700,
    discount: 10,
    duration: 3,
    plan: 'PRO',
    userType: 'JOBSEEKER',
    features: [
      '이력서 분석 20회/월',
      'JD 분석 20회/월',
      '이력서 생성 10회/월',
      '면접 가이드 10회/월',
      '주간 Report 4회/월',
      '월간 Report 1회/월'
    ]
  },

  // 구직자 - EXPERT
  'jobseeker-expert-1m': {
    id: 'jobseeker-expert-1m',
    name: '[구직자] EXPERT 1개월 이용권',
    price: 29900,
    duration: 1,
    plan: 'EXPERT',
    userType: 'JOBSEEKER',
    features: [
      '이력서 분석 30회',
      'JD 분석 30회',
      '이력서 생성 20회',
      '면접 가이드 20회',
      '주간 Report 4회',
      '월간 Report 1회'
    ]
  },
  'jobseeker-expert-3m': {
    id: 'jobseeker-expert-3m',
    name: '[구직자] EXPERT 3개월 이용권',
    price: 80700,
    originalPrice: 89700,
    discount: 10,
    duration: 3,
    plan: 'EXPERT',
    userType: 'JOBSEEKER',
    features: [
      '이력서 분석 30회/월',
      'JD 분석 30회/월',
      '이력서 생성 20회/월',
      '면접 가이드 20회/월',
      '주간 Report 4회/월',
      '월간 Report 1회/월'
    ]
  },

  // 헤드헌터 - PRO
  'headhunter-pro-1m': {
    id: 'headhunter-pro-1m',
    name: '[헤드헌터] PRO 1개월 이용권',
    price: 19900,
    duration: 1,
    plan: 'PRO',
    userType: 'HEADHUNTER',
    features: [
      '이력서 분석 25회',
      'JD 분석 25회',
      '이력서 생성 15회',
      '면접 가이드 15회',
      '제안서 20회',
      '주간 Report 4회',
      '월간 Report 1회'
    ]
  },
  'headhunter-pro-3m': {
    id: 'headhunter-pro-3m',
    name: '[헤드헌터] PRO 3개월 이용권',
    price: 53700,
    originalPrice: 59700,
    discount: 10,
    duration: 3,
    plan: 'PRO',
    userType: 'HEADHUNTER',
    features: [
      '이력서 분석 25회/월',
      'JD 분석 25회/월',
      '이력서 생성 15회/월',
      '면접 가이드 15회/월',
      '제안서 20회/월',
      '주간 Report 4회/월',
      '월간 Report 1회/월'
    ]
  },

  // 헤드헌터 - EXPERT
  'headhunter-expert-1m': {
    id: 'headhunter-expert-1m',
    name: '[헤드헌터] EXPERT 1개월 이용권',
    price: 49900,
    duration: 1,
    plan: 'EXPERT',
    userType: 'HEADHUNTER',
    features: [
      '이력서 분석 50회',
      'JD 분석 50회',
      '이력서 생성 25회',
      '면접 가이드 25회',
      '제안서 50회',
      '주간 Report 4회',
      '월간 Report 1회'
    ]
  },
  'headhunter-expert-3m': {
    id: 'headhunter-expert-3m',
    name: '[헤드헌터] EXPERT 3개월 이용권',
    price: 134700,
    originalPrice: 149700,
    discount: 10,
    duration: 3,
    plan: 'EXPERT',
    userType: 'HEADHUNTER',
    features: [
      '이력서 분석 50회/월',
      'JD 분석 50회/월',
      '이력서 생성 25회/월',
      '면접 가이드 25회/월',
      '제안서 50회/월',
      '주간 Report 4회/월',
      '월간 Report 1회/월'
    ]
  }
}

/**
 * 사용자 타입별 상품 필터링
 */
export function getProductsByUserType(userType: 'JOBSEEKER' | 'HEADHUNTER'): Product[] {
  return Object.values(PRODUCTS).filter(p => p.userType === userType)
}

/**
 * 플랜별 상품 필터링
 */
export function getProductsByPlan(plan: 'PRO' | 'EXPERT', userType: 'JOBSEEKER' | 'HEADHUNTER'): Product[] {
  return Object.values(PRODUCTS).filter(p => p.plan === plan && p.userType === userType)
}

/**
 * 상품 ID로 상품 조회
 */
export function getProductById(id: ProductId): Product | undefined {
  return PRODUCTS[id]
}
