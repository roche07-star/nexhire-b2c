import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

/**
 * POST /api/candidates/provide
 * 동의받은 후보자의 정보를 채용사에 제공
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
      recipientCompany,
      position,
      providedItems,
      resumeFileUrl,
      notes
    } = await req.json()

    // 필수 항목 검증
    if (!candidateEmail || !recipientCompany || !providedItems || providedItems.length === 0) {
      return NextResponse.json({
        error: '필수 항목이 누락되었습니다.'
      }, { status: 400 })
    }

    // 1. 동의 확인
    const { data: consent, error: consentError } = await supabase
      .from('consents')
      .select('*')
      .eq('user_email', candidateEmail)
      .eq('consent_type', 'third_party_provision')
      .eq('recipient_company', recipientCompany)
      .eq('is_agreed', true)
      .is('withdrawn_at', null)
      .order('agreed_at', { ascending: false })
      .limit(1)
      .single()

    if (consentError || !consent) {
      return NextResponse.json({
        error: `동의 기록이 없습니다. 먼저 후보자로부터 ${recipientCompany}에 대한 제3자 제공 동의를 받고 기록해주세요.`,
        code: 'CONSENT_NOT_FOUND'
      }, { status: 400 })
    }

    // 2. 중복 제공 확인 (같은 회사/포지션에 이미 제공했는지)
    const { data: existingProvision } = await supabase
      .from('third_party_provision_logs')
      .select('id, provided_at')
      .eq('candidate_email', candidateEmail)
      .eq('recipient_company', recipientCompany)
      .eq('position', position || '')
      .single()

    if (existingProvision) {
      return NextResponse.json({
        warning: `이미 ${recipientCompany}${position ? ` ${position}` : ''}에 제공한 기록이 있습니다. (제공일: ${new Date(existingProvision.provided_at).toLocaleString('ko-KR')})`,
        code: 'ALREADY_PROVIDED',
        provisionId: existingProvision.id
      }, { status: 200 }) // 409 대신 200으로 (경고이지만 진행 가능)
    }

    // 3. 제공 기록 저장 (3년 보관)
    const now = new Date()
    const retentionUntil = new Date(now)
    retentionUntil.setFullYear(retentionUntil.getFullYear() + 3) // 3년 후

    const { data: provisionLog, error: provisionError } = await supabase
      .from('third_party_provision_logs')
      .insert({
        candidate_email: candidateEmail,
        recipient_company: recipientCompany,
        position: position || null,
        provided_items: providedItems,
        resume_file_url: resumeFileUrl || null,
        provided_by: session.user.email,
        provided_at: now,
        retention_until: retentionUntil,
        consent_id: consent.id
      })
      .select()
      .single()

    if (provisionError) {
      console.error('[candidates/provide] Provision log insert error:', provisionError)
      return NextResponse.json({ error: '제공 기록 저장 실패' }, { status: 500 })
    }

    // 4. 감사 로그 기록
    await supabase.from('audit_logs').insert({
      action: 'provide_candidate_info',
      actor_email: session.user.email,
      target_email: candidateEmail,
      details: {
        recipient_company: recipientCompany,
        position: position || null,
        provided_items: providedItems,
        has_resume: !!resumeFileUrl
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent')
    })

    // 5. (선택) 채용사에 이메일 발송
    // TODO: 채용사 담당자 이메일로 후보자 정보 발송
    // await sendCandidateInfoEmail({
    //   to: recipientCompanyEmail,
    //   candidateEmail,
    //   position,
    //   resumeUrl: resumeFileUrl
    // })

    return NextResponse.json({
      success: true,
      provisionId: provisionLog.id,
      message: '후보자 정보가 성공적으로 제공되었습니다.',
      retentionUntil: retentionUntil.toISOString()
    })

  } catch (e) {
    console.error('[candidates/provide] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

/**
 * GET /api/candidates/provide?candidateEmail={email}&company={company}
 * 특정 후보자의 특정 회사에 대한 제공 기록 조회
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

    if (!candidateEmail) {
      return NextResponse.json({
        error: 'candidateEmail 파라미터가 필요합니다.'
      }, { status: 400 })
    }

    let query = supabase
      .from('third_party_provision_logs')
      .select('*')
      .eq('candidate_email', candidateEmail)
      .order('provided_at', { ascending: false })

    if (company) {
      query = query.eq('recipient_company', company)
    }

    const { data: provisionLogs, error } = await query

    if (error) {
      console.error('[candidates/provide GET] Error:', error)
      return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }

    return NextResponse.json({
      provisionLogs: provisionLogs || [],
      count: provisionLogs?.length || 0
    })

  } catch (e) {
    console.error('[candidates/provide GET] Unexpected error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
