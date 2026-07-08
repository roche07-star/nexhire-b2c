import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Client (Anon Key)
 * - RLS (Row Level Security) 정책 적용됨
 * - 일반 사용자 데이터 접근 시 사용
 * - 본인의 데이터만 접근 가능
 */
export const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
