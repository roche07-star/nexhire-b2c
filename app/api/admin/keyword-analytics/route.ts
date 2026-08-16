/**
 * 키워드 성과 분석 API
 *
 * 관리자 전용: 키워드별 클릭/가입/전환율 분석
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

interface KeywordStat {
  keyword: string
  source: string
  signups: number
  conversions: number
  conversionRate: number
  revenue: number
  lastSignup: string
}

export async function GET(req: NextRequest) {
  try {
    // 1. 관리자 권한 확인
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('email', session.user.email)
      .single()

    if (userData?.user_type !== 'SUPER_ADMIN' && userData?.user_type !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. UTM 데이터가 있는 사용자 조회
    const { data: users, error } = await supabase
      .from('users')
      .select('utm_term, utm_source, utm_medium, utm_campaign, plan, created_at, first_visit_at')
      .not('utm_term', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Keyword Analytics] Query error:', error)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    // 3. 키워드별 그룹화 및 집계
    const keywordMap = new Map<string, KeywordStat>()

    users?.forEach(user => {
      const keyword = user.utm_term || 'Unknown'
      const source = user.utm_source || 'Unknown'
      const key = `${keyword}|${source}`

      if (!keywordMap.has(key)) {
        keywordMap.set(key, {
          keyword,
          source,
          signups: 0,
          conversions: 0,
          conversionRate: 0,
          revenue: 0,
          lastSignup: user.created_at || '',
        })
      }

      const stat = keywordMap.get(key)!
      stat.signups++

      // 유료 플랜 전환
      if (user.plan === 'PRO' || user.plan === 'EXPERT') {
        stat.conversions++

        // 예상 수익 (간단한 추정)
        if (user.plan === 'PRO') {
          stat.revenue += 30000 // PRO 플랜 월 30,000원
        } else if (user.plan === 'EXPERT') {
          stat.revenue += 80000 // EXPERT 플랜 월 80,000원
        }
      }

      // 최근 가입일 업데이트
      if (user.created_at && user.created_at > stat.lastSignup) {
        stat.lastSignup = user.created_at
      }
    })

    // 4. 전환율 계산 및 배열 변환
    const keywordStats: KeywordStat[] = Array.from(keywordMap.values()).map(stat => ({
      ...stat,
      conversionRate: stat.signups > 0 ? (stat.conversions / stat.signups) * 100 : 0,
    }))

    // 5. 가입 수 기준 정렬 (내림차순)
    keywordStats.sort((a, b) => b.signups - a.signups)

    // 6. 요약 통계
    const summary = {
      totalKeywords: keywordStats.length,
      totalSignups: keywordStats.reduce((sum, stat) => sum + stat.signups, 0),
      totalConversions: keywordStats.reduce((sum, stat) => sum + stat.conversions, 0),
      totalRevenue: keywordStats.reduce((sum, stat) => sum + stat.revenue, 0),
      avgConversionRate: keywordStats.length > 0
        ? keywordStats.reduce((sum, stat) => sum + stat.conversionRate, 0) / keywordStats.length
        : 0,
    }

    return NextResponse.json({
      success: true,
      summary,
      keywords: keywordStats,
    })
  } catch (error) {
    console.error('[Keyword Analytics] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
