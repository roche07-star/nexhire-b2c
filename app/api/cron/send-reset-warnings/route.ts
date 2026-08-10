import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Cron job: 초기화 임박 경고 발송
 *
 * 매일 실행:
 * - monthly_reset_at이 3일 이내인 PRO/EXPERT 사용자에게 이메일 발송
 * - 하루 1회만 발송 (중복 방지)
 */
export async function GET(req: NextRequest) {
  // Vercel Cron 인증 (선택)
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    warnings: 0,
    errors: [] as string[],
  }

  try {
    const now = new Date()
    const threeDaysLater = new Date(now)
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)

    // 3일 이내 초기화되는 PRO/EXPERT 사용자 조회
    const { data: users } = await supabase
      .from('users')
      .select('email, name, plan, monthly_reset_at')
      .in('plan', ['PRO', 'EXPERT'])
      .not('monthly_reset_at', 'is', null)
      .lte('monthly_reset_at', threeDaysLater.toISOString())
      .gte('monthly_reset_at', now.toISOString())

    for (const user of users ?? []) {
      try {
        const resetDate = new Date(user.monthly_reset_at)
        const diffDays = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        // TODO: 이메일 발송 (Resend, SendGrid 등)
        // await sendEmail({
        //   to: user.email,
        //   subject: `[JOBIZIC] ${diffDays}일 후 플랜 초기화 예정`,
        //   html: `
        //     <h2>플랜 초기화 안내</h2>
        //     <p>안녕하세요, ${user.name ?? '고객'}님!</p>
        //     <p>${user.plan} 플랜의 사용 기간이 ${diffDays}일 후 종료됩니다.</p>
        //     <p>계속 이용하시려면 플랜을 갱신해 주세요.</p>
        //     <a href="https://jobizic.vercel.app/store">플랜 갱신하기</a>
        //   `
        // })

        console.log(`[cron] ⏰ Reset warning: ${user.email} (${diffDays}일 남음)`)
        results.warnings++

      } catch (err) {
        results.errors.push(`Email failed for ${user.email}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })

  } catch (error) {
    console.error('[cron] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
      },
      { status: 500 }
    )
  }
}
