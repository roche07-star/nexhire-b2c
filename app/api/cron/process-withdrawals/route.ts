import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Vercel Cron Job: 탈퇴 처리 자동화
 * 매일 실행: withdrawing 상태이고 plan_end_date가 지난 사용자를 withdrawn으로 전환
 */
export async function GET(req: NextRequest) {
  // Vercel Cron Secret 검증
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date().toISOString()

    // withdrawing 상태이고 plan_end_date가 지난 사용자 조회
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('email, plan_end_date')
      .eq('status', 'withdrawing')
      .lt('plan_end_date', now)

    if (selectError) {
      console.error('[cron/process-withdrawals] Select error:', selectError)
      return NextResponse.json({ error: selectError.message }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No users to process'
      })
    }

    console.log(`[cron/process-withdrawals] Found ${users.length} users to withdraw:`, users.map(u => u.email))

    // 각 사용자별로 처리
    const results = await Promise.all(users.map(async (user) => {
      try {
        // 1. 상태를 withdrawn으로 전환
        const { error: updateError } = await supabase
          .from('users')
          .update({
            status: 'withdrawn',
            data_delete_at: now, // 즉시 삭제로 표시
          })
          .eq('email', user.email)

        if (updateError) {
          console.error(`[cron/process-withdrawals] Update error for ${user.email}:`, updateError)
          return { email: user.email, success: false, error: updateError.message }
        }

        // 2. 데이터 삭제 (또는 익명화)
        // analyses, jd_analyses, interview_guides 등 삭제
        await supabase.from('analyses').delete().eq('user_email', user.email)
        await supabase.from('jd_analyses').delete().eq('user_email', user.email)
        await supabase.from('interview_guides').delete().eq('user_email', user.email)
        await supabase.from('coupons').delete().eq('claimed_by', user.email)
        await supabase.from('consents').delete().eq('user_email', user.email)

        console.log(`[cron/process-withdrawals] Successfully processed ${user.email}`)
        return { email: user.email, success: true }
      } catch (err: any) {
        console.error(`[cron/process-withdrawals] Error processing ${user.email}:`, err)
        return { email: user.email, success: false, error: err.message }
      }
    }))

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      processed: users.length,
      successCount,
      failCount,
      results
    })

  } catch (err: any) {
    console.error('[cron/process-withdrawals] Unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
