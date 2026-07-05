import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

/**
 * STORE 상품 구매 (쿠폰 발급)
 * POST /api/store/purchase
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  try {
    const { feature } = await req.json()

    if (!feature) {
      return NextResponse.json({ error: '상품을 선택해주세요' }, { status: 400 })
    }

    // 사용자 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    const userType = userData?.user_type || 'JOBSEEKER'

    // 상품별 쿠폰 생성 개수
    const couponCounts: Record<string, { resume?: number; jd?: number; rewrite?: number; interview?: number; proposal?: number }> = {
      resume: { resume: 1 },
      jd: { jd: 1 },
      rewrite: { rewrite: 1 },
      interview: { interview: 1 },
      proposal: { proposal: 1 },
      storage: {}, // 스토리지는 별도 처리 필요
      package: {
        resume: 50,
        jd: 50,
        rewrite: 50,
        interview: userType === 'HEADHUNTER' ? 25 : 15,
        proposal: userType === 'HEADHUNTER' ? 50 : 0,
      },
    }

    const counts = couponCounts[feature]
    if (!counts) {
      return NextResponse.json({ error: '지원하지 않는 상품입니다' }, { status: 400 })
    }

    // 스토리지는 별도 처리
    if (feature === 'storage') {
      // TODO: 스토리지 슬롯 추가 로직 구현
      return NextResponse.json({
        success: true,
        message: '스토리지 슬롯이 추가되었습니다',
      })
    }

    // 쿠폰 생성
    const coupons = []
    for (const [type, count] of Object.entries(counts)) {
      if (count > 0) {
        const { data: coupon, error } = await supabase
          .from('coupons')
          .insert({
            user_email: session.user.email,
            coupon_type: type,
            credits: count,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1년 유효
            issued_by: 'STORE',
          })
          .select()
          .single()

        if (error) {
          console.error('쿠폰 생성 오류:', error)
          continue
        }

        coupons.push(coupon)
      }
    }

    return NextResponse.json({
      success: true,
      message: '구매가 완료되었습니다',
      coupons,
    })
  } catch (error: any) {
    console.error('구매 처리 오류:', error)
    return NextResponse.json({ error: '구매 처리 중 오류가 발생했습니다' }, { status: 500 })
  }
}
