import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    // 인증 확인
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email

    // 사용자 플랜 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // PRO 플랜 이상만 접근 가능
    if (userData.plan !== 'PRO' && userData.plan !== 'EXPERT') {
      return NextResponse.json(
        { error: 'PRO 플랜 이상만 이용 가능합니다.' },
        { status: 403 }
      )
    }

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage') // 특정 단계만 조회
    const search = searchParams.get('search') // 검색어
    const tag = searchParams.get('tag') // 태그 필터
    const limit = parseInt(searchParams.get('limit') || '50') // 페이지 크기 (기본 50)
    const offset = parseInt(searchParams.get('offset') || '0') // 오프셋
    const includeDetails = searchParams.get('details') === 'true' // 상세 정보 포함 여부

    // 후보자 리스트 조회 (경량화 + 정규화된 필드 사용)
    let query = supabase
      .from('analyses')
      .select(
        includeDetails
          ? `
            id,
            candidate_name,
            position,
            score,
            phone,
            candidate_email,
            created_at,
            pipeline_stage,
            result,
            candidate_notes (
              id,
              note,
              created_at
            ),
            candidate_tags (
              id,
              tag
            )
          `
          : `
            id,
            candidate_name,
            position,
            score,
            phone,
            candidate_email,
            created_at,
            pipeline_stage
          `,
        { count: 'exact' }
      )
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 단계 필터
    if (stage && stage !== 'all') {
      query = query.eq('pipeline_stage', stage)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Pipeline list error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pipeline list' },
        { status: 500 }
      )
    }

    // 데이터 가공 (정규화된 필드 직접 사용 - JSON 파싱 불필요!)
    let candidates = (data || []).map((item: any) => {
      // 정규화된 컬럼 사용 (마이그레이션 후)
      // 마이그레이션 전 호환성: 컬럼이 null이면 result에서 fallback
      let name = item.candidate_name
      let position = item.position
      let score = item.score
      let phone = item.phone
      let candidateEmail = item.candidate_email

      // Fallback: 마이그레이션 전이거나 컬럼이 null인 경우
      if (!name || !position) {
        try {
          const result = typeof item.result === 'string' ? JSON.parse(item.result) : item.result
          if (!name) {
            name = result?.candidate_name || result?.name || result?.candidateName || '미정'
          }
          if (!position) {
            position = result?.position || result?.targetPosition || result?.job_title || '미정'
          }
          if (score === null || score === undefined) {
            score = result?.scores?.job_fit || result?.score || result?.totalScore || 0
          }
          if (!phone) {
            phone = result?.phone || result?.contact?.phone || ''
          }
          if (!candidateEmail) {
            candidateEmail = result?.email || result?.contact?.email || ''
          }
        } catch {
          // 파싱 실패 시 기본값 유지
          name = name || '미정'
          position = position || '미정'
          score = score || 0
          phone = phone || ''
          candidateEmail = candidateEmail || ''
        }
      }

      // 검색 필터 (서버 사이드)
      if (search) {
        const searchLower = search.toLowerCase()
        if (
          !name.toLowerCase().includes(searchLower) &&
          !position.toLowerCase().includes(searchLower)
        ) {
          return null
        }
      }

      const candidate: any = {
        id: item.id,
        name,
        position,
        score,
        phone,
        email: candidateEmail,
        stage: item.pipeline_stage || 'pending',
        createdAt: item.created_at,
      }

      // 상세 정보는 요청 시에만 포함
      if (includeDetails) {
        candidate.notes = item.candidate_notes || []
        candidate.tags = (item.candidate_tags || []).map((t: any) => t.tag)
        candidate.result = typeof item.result === 'string' ? JSON.parse(item.result) : item.result
      }

      return candidate
    }).filter(Boolean) // null 제거

    // 태그 필터 (서버 사이드에서 처리하기 어려우므로 클라이언트에서 처리)
    if (tag && includeDetails) {
      candidates = candidates.filter((c: any) =>
        c.tags?.some((t: string) => t.toLowerCase().includes(tag.toLowerCase()))
      )
    }

    return NextResponse.json({
      candidates,
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
      offset,
      limit,
    })
  } catch (error) {
    console.error('Pipeline list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline list' },
      { status: 500 }
    )
  }
}
