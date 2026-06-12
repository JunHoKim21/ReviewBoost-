import { createClient } from '@supabase/supabase-js'

// Vercel 빌드 단계에서 환경변수가 셋업되지 않아 'Invalid URL' 에러가 나는 것을 방어
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.startsWith('http') ? rawUrl : 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key'

// 클라이언트 사이드 & 공용(Anon 권한) 접근용
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 사이드 전용 (Service Role 권한, RLS 우회 등 강력한 권한 필요 시 사용)
// 주의: 브라우저 환경에서 노출 금지
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key';
  return createClient(supabaseUrl, serviceKey);
}
