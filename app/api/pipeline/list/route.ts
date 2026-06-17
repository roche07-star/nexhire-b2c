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

    // 후보자 리스트 조회 (경량화)
    let query = supabase
      .from('analyses')
      .select(
        includeDetails
          ? `
            id,
            result,
            created_at,
            pipeline_stage,
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
            result,
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

    // 데이터 가공 (필수 필드만 추출)
    let candidates = (data || []).map((item: any) => {
      let name = '미정'
      let position = '미정'
      let score = 0
      let phone = ''
      let candidateEmail = ''

      try {
        const result = typeof item.result === 'string' ? JSON.parse(item.result) : item.result
        name = result?.candidate_name || result?.name || result?.candidateName || '미정'
        position = result?.position || result?.targetPosition || result?.job_title || '미정'
        score = result?.scores?.job_fit || result?.score || result?.totalScore || 0
        phone = result?.phone || result?.contact?.phone || ''
        candidateEmail = result?.email || result?.contact?.email || ''
      } catch {
        // 파싱 실패 시 기본값 사용
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
