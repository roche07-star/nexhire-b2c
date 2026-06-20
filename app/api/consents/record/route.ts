import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

/**
 * POST /api/consents/record
 * 오프라인으로 받은 제3자 제공 동의를 시스템에 기록
 * B2B 헤드헌터만 접근 가능
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // B2B 헤드헌터 권한 확인
    const { data: user } = await supabase
      .from('users')
      .select('service_type, user_type')
      .eq('email', session.user.email)
      .single()

    if (user?.service_type !== 'B2B') {
      return NextResponse.json({ error: '권한이 없습니다. B2B 계정만 접근 가능합니다.' }, { status: 403 })
    }

    const {
      candidateEmail,
      candidateName,
      candidatePhone,
      recipientCompany,
      position,
      providedItems,
      consentMethod,
      consentDocumentUrl,
      agreedAt,
      notes
    } = await req.json()

    // 필수 항목 검증
    if (!candidateEmail || !candidateName || !recipientCompany || !consentMethod || !agreedAt) {
      return NextResponse.json({
        error: '필수 항목이 누락되었습니다.'
      }, { status: 400 })
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(candidateEmail)) {
      return NextResponse.json({
        error: '올바른 이메일 형식이 아닙니다.'
      }, { status: 400 })
    }

    // 동의 방법 검증
    const validMethods = ['phone', 'email', 'in-person', 'document']
    if (!validMethods.includes(consentMethod)) {
      return NextResponse.json({
        error: '올바른 동의 방법이 아닙니다.'
      }, { status: 400 })
    }

    // 1. 후보자 존재 확인 (Adam B2C 회원일 수도, 아닐 수도 있음)
    const { data: existingCandidate } = await supabase
      .from('users')
      .select('email, service_type')
      .eq('email', candidateEmail)
      .single()

    // 2. 중복 동의 확인 (같은 회사에 대한 유효한 동의가 이미 있는지)
    const { data: existingConsent } = await supabase
      .from('consents')
      .select('id, agreed_at')
      .eq('user_email', candidateEmail)
      .eq('consent_type', 'third_party_provision')
      .eq('recipient_company', recipientCompany)
      .eq('is_agreed', true)
      .is('withdrawn_at', null)
      .single()

    if (existingConsent) {
      return NextResponse.json({
        error: `이미 ${recipientCompany}에 대한 동의 기록이 존재합니다. (동의일: ${new Date(existingConsent.agreed_at).toLocaleString('ko-KR')})`
      }, { status: 409 })
    }

    // 3. 동의 기록 저장
    const { data: consent, error: consentError } = await supabase
      .from('consents')
      .insert({
        user_email: candidateEmail,
        consent_type: 'third_party_provision',
        consent_version: 'v1.0.0',
        is_agreed: true,
        agreed_at: new Date(agreedAt),

        // 제3자 제공 정보
        recipient_company: recipientCompany,
        provision_purpose: position ? `${recipientCompany} ${position} 채용 전형` : `${recipientCompany} 채용 전형`,
        provided_items: providedItems || ['이름', '전화번호', '이메일', '이력서'],
        provision_period: '채용 전형 종료 시까지',

        // 오프라인 동의 관련 정보
        consent_method: consentMethod,
        consent_document_url: consentDocumentUrl || null,
        recorded_by: session.user.email,
        notes: notes || null,

        // 메타데이터
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        user_agent: req.headers.get('user-agent') || null
      })
      .select()
      .single()

    if (consentError) {
      console.error('[consents/record] Consent insert error:', consentError)
      return NextResponse.json({ error: '동의 기록 저장 실패' }, { status: 500 })
    }

    // 4. 외부 후보자 정보 등록 (Adam 회원이 아닌 경우)
    if (!existingCandidate) {
      const { error: candidateError } = await supabase
        .from('external_candidates')
        .insert({
          email: candidateEmail,
          name: candidateName,
          phone: candidatePhone || null,
          source: 'offline',
          registered_by: session.user.email
        })

      if (candidateError) {
        console.error('[consents/record] External candidate insert error:', candidateError)
        // 후보자 등록 실패는 치명적이지 않으므로 계속 진행
      }
    }

    // 5. 감사 로그 기록
    await supabase.from('audit_logs').insert({
      action: 'record_consent',
      actor_email: session.user.email,
      target_email: candidateEmail,
      details: {
        recipient_company: recipientCompany,
        position: position || null,
        consent_method: consentMethod,
        provided_items: providedItems || ['이름', '전화번호', '이메일', '이력서']
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      consentId: consent.id,
      message: '동의 기록이 성공적으로 등록되었습니다.'
    })

  } catch (e) {
    console.error('[consents/record] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

/**
 * GET /api/consents/record?candidateEmail={email}&company={company}
 * 특정 후보자의 특정 회사에 대한 동의 기록 조회
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const candidateEmail = searchParams.get('candidateEmail')
    const company = searchParams.get('company')

    if (!candidateEmail || !company) {
      return NextResponse.json({
        error: 'candidateEmail과 company 파라미터가 필요합니다.'
      }, { status: 400 })
    }

    // 동의 기록 조회
    const { data: consents, error } = await supabase
      .from('consents')
      .select('*')
      .eq('user_email', candidateEmail)
      .eq('consent_type', 'third_party_provision')
      .eq('recipient_company', company)
      .eq('is_agreed', true)
      .is('withdrawn_at', null)
      .order('agreed_at', { ascending: false })

    if (error) {
      console.error('[consents/record GET] Error:', error)
      return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }

    return NextResponse.json({
      consents: consents || [],
      hasValidConsent: consents && consents.length > 0
    })

  } catch (e) {
    console.error('[consents/record GET] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
