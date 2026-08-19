import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Vercel Cron Job: 탈퇴 처리 자동화
 * 매일 실행:
 * 1. withdrawing → withdrawn 전환 (plan_end_date 지난 경우)
 * 2. Hard delete (180일 경과 - 약관 준수: 6개월 보존)
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
        const deleteDate = new Date(new Date(now).getTime() + 180 * 24 * 60 * 60 * 1000) // 6개월 후

        const { error: updateError } = await supabase
          .from('users')
          .update({
            status: 'withdrawn',
            data_delete_at: deleteDate.toISOString(), // ✅ 6개월 후 삭제 예정
          })
          .eq('email', user.email)

        if (updateError) {
          console.error(`[cron/process-withdrawals] Update error for ${user.email}:`, updateError)
          return { email: user.email, success: false, error: updateError.message }
        }

        // 2. ✅ Soft delete (180일 후 삭제 예정 표시 - 약관 준수)
        await supabase.from('analyses').update({
          deleted_at: deleteDate.toISOString()
        }).eq('user_email', user.email).is('deleted_at', null)

        await supabase.from('jd_analyses').update({
          deleted_at: deleteDate.toISOString()
        }).eq('user_email', user.email).is('deleted_at', null)

        await supabase.from('interview_guides').update({
          deleted_at: deleteDate.toISOString()
        }).eq('user_email', user.email).is('deleted_at', null)

        await supabase.from('jobs').update({
          deleted_at: deleteDate.toISOString()
        }).eq('user_email', user.email).is('deleted_at', null)

        await supabase.from('generated_resumes').update({
          deleted_at: deleteDate.toISOString()
        }).eq('user_email', user.email).is('deleted_at', null)

        // ✅ 감사 로그 기록
        await supabase.from('audit_logs').insert({
          action: 'user_withdrawn',
          user_email: user.email,
          details: {
            status: 'withdrawn',
            deletion_stage: 'scheduled',
            delete_date: deleteDate.toISOString(),
            retention_days: 180
          },
          deletion_stage: 'scheduled'
        })

        // 📌 보존: payments, coupons는 삭제하지 않음

        console.log(`[cron/process-withdrawals] Successfully processed ${user.email} with 180-day retention`)
        return { email: user.email, success: true, stage: 'scheduled_delete', delete_date: deleteDate }
      } catch (err: any) {
        console.error(`[cron/process-withdrawals] Error processing ${user.email}:`, err)
        return { email: user.email, success: false, error: err.message }
      }
    }))

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    // ============================================
    // 3. Hard delete: deleted_at이 180일 지난 데이터 영구 삭제 (약관 준수: 6개월 보존)
    // ============================================
    const hardDeleteThreshold = new Date(new Date(now).getTime() - 180 * 24 * 60 * 60 * 1000)

    const { data: analysesToDelete } = await supabase
      .from('analyses')
      .select('id, user_email')
      .lt('deleted_at', hardDeleteThreshold.toISOString())
      .not('deleted_at', 'is', null)

    const { data: jdToDelete } = await supabase
      .from('jd_analyses')
      .select('id, user_email')
      .lt('deleted_at', hardDeleteThreshold.toISOString())
      .not('deleted_at', 'is', null)

    const { data: interviewToDelete } = await supabase
      .from('interview_guides')
      .select('id, user_email')
      .lt('deleted_at', hardDeleteThreshold.toISOString())
      .not('deleted_at', 'is', null)

    const { data: jobsToDelete } = await supabase
      .from('jobs')
      .select('id, user_email')
      .lt('deleted_at', hardDeleteThreshold.toISOString())
      .not('deleted_at', 'is', null)

    const { data: resumesToDelete } = await supabase
      .from('generated_resumes')
      .select('id, user_email')
      .lt('deleted_at', hardDeleteThreshold.toISOString())
      .not('deleted_at', 'is', null)

    let hardDeleteCount = 0

    // 외래 키 순서: interview_guides → jd_analyses → analyses → generated_resumes
    if (interviewToDelete && interviewToDelete.length > 0) {
      await supabase.from('interview_guides').delete().lt('deleted_at', hardDeleteThreshold.toISOString())
      hardDeleteCount += interviewToDelete.length
      console.log(`[cron/process-withdrawals] Hard deleted ${interviewToDelete.length} interview_guides`)
    }

    if (jdToDelete && jdToDelete.length > 0) {
      await supabase.from('jd_analyses').delete().lt('deleted_at', hardDeleteThreshold.toISOString())
      hardDeleteCount += jdToDelete.length
      console.log(`[cron/process-withdrawals] Hard deleted ${jdToDelete.length} jd_analyses`)
    }

    if (analysesToDelete && analysesToDelete.length > 0) {
      await supabase.from('analyses').delete().lt('deleted_at', hardDeleteThreshold.toISOString())
      hardDeleteCount += analysesToDelete.length
      console.log(`[cron/process-withdrawals] Hard deleted ${analysesToDelete.length} analyses`)
    }

    if (resumesToDelete && resumesToDelete.length > 0) {
      await supabase.from('generated_resumes').delete().lt('deleted_at', hardDeleteThreshold.toISOString())
      hardDeleteCount += resumesToDelete.length
      console.log(`[cron/process-withdrawals] Hard deleted ${resumesToDelete.length} generated_resumes`)
    }

    if (jobsToDelete && jobsToDelete.length > 0) {
      await supabase.from('jobs').delete().lt('deleted_at', hardDeleteThreshold.toISOString())
      hardDeleteCount += jobsToDelete.length
      console.log(`[cron/process-withdrawals] Hard deleted ${jobsToDelete.length} jobs`)
    }

    // 4. ✅ 개인정보 익명화 (data_delete_at이 지난 사용자)
    const { data: usersToAnonymize } = await supabase
      .from('users')
      .select('email')
      .eq('status', 'withdrawn')
      .lt('data_delete_at', now)
      .or('name.not.is.null,image.not.is.null')

    if (usersToAnonymize && usersToAnonymize.length > 0) {
      await supabase.from('users').update({
        name: null,
        image: null,
      }).eq('status', 'withdrawn').lt('data_delete_at', now)

      console.log(`[cron/process-withdrawals] Anonymized ${usersToAnonymize.length} users`)
      hardDeleteCount += usersToAnonymize.length
    }

    // ✅ Hard delete 감사 로그
    if (hardDeleteCount > 0) {
      await supabase.from('audit_logs').insert({
        action: 'data_hard_deleted',
        user_email: 'system',
        details: {
          deletion_stage: 'hard',
          count: hardDeleteCount,
          threshold_date: hardDeleteThreshold.toISOString(),
          anonymized_users: usersToAnonymize?.length || 0
        },
        deletion_stage: 'hard'
      })
    }

    return NextResponse.json({
      success: true,
      processed: users.length,
      successCount,
      failCount,
      hardDeleteCount,
      results
    })

  } catch (err: any) {
    console.error('[cron/process-withdrawals] Unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
