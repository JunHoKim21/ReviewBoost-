import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// 클라이언트 사이드 & 공용(Anon 권한) 접근용
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 사이드 전용 (Service Role 권한, RLS 우회 등 강력한 권한 필요 시 사용)
// 주의: 브라우저 환경에서 노출 금지
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl, serviceKey);
}
