import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client (Service Role Key)
 * - RLS (Row Level Security) 우회
 * - 관리자 작업 전용 (사용자 관리, 시스템 작업)
 * - ⚠️ 보안 주의: API 엔드포인트에서 사용 시 권한 검증 필수
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Supabase Client (Anon Key) - 기본 export
 * - RLS (Row Level Security) 정책 적용됨
 * - 일반 사용자 데이터 접근 시 사용
 * - 본인의 데이터만 접근 가능
 *
 * ⚠️ 현재 RLS 정책 미설정 상태 - Supabase Dashboard에서 설정 필요
 */
export const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// 기본 export (기존 코드와의 호환성)
// TODO: RLS 정책 설정 후 supabaseClient로 변경
export const supabase = supabaseAdmin
