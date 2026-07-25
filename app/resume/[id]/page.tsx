import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'
import ResumeViewer from './ResumeViewer'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ResumePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login')
  }

  const { id } = await params

  // 이력서 조회
  const { data: resume, error } = await supabase
    .from('generated_resumes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !resume) {
    return (
      <main style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>이력서를 찾을 수 없습니다</h1>
        <p style={{ color: 'var(--muted)' }}>요청하신 이력서가 존재하지 않습니다.</p>
      </main>
    )
  }

  // 권한 확인
  if (resume.user_email !== session.user.email) {
    return (
      <main style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>접근 권한이 없습니다</h1>
        <p style={{ color: 'var(--muted)' }}>본인의 이력서만 확인할 수 있습니다.</p>
      </main>
    )
  }

  // 사용자 플랜 및 사용량 조회
  const { data: userData } = await supabase
    .from('users')
    .select('plan, user_type, rewrite_count, monthly_reset_at')
    .eq('email', session.user.email)
    .single()

  const userPlan = userData?.plan || 'FREE'
  const userType = userData?.user_type || 'JOBSEEKER'

  // rewrite 사용 가능 여부 확인
  let canDownload = userPlan !== 'FREE' // PRO/EXPERT는 기본 가능

  if (!canDownload) {
    // FREE 플랜: 플랜 한도 또는 쿠폰 확인
    const { PLAN_LIMITS } = await import('@/lib/constants/planLimits')
    const limit = PLAN_LIMITS[userType as keyof typeof PLAN_LIMITS]?.[userPlan]?.rewrite || 0
    const current = userData?.rewrite_count || 0

    // 플랜 한도 내
    if (current < limit) {
      canDownload = true
    } else {
      // 쿠폰 확인
      const { data: coupons } = await supabase
        .from('coupons')
        .select('id, credits, used')
        .eq('claimed_by', session.user.email)
        .eq('feature', 'rewrite')
        .gt('expires_at', new Date().toISOString())
        .is('deleted_at', null)

      const hasAvailableCoupon = coupons?.some(c => c.used < c.credits)
      if (hasAvailableCoupon) {
        canDownload = true
      }
    }
  }

  return <ResumeViewer resume={resume} userPlan={userPlan} canDownload={canDownload} />
}
