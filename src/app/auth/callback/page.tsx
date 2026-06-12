'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Supabase가 URL Hash에서 자동으로 세션을 복구하는 것을 기다림
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          // 기존 이메일 로그인 방식과 호환성을 위해 로컬 스토리지에 유저 ID 저장
          localStorage.setItem('user_token', session.user.id);
          router.push('/');
        } else {
          // 간혹 비동기 처리 지연으로 세션이 늦게 들어오는 경우
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              localStorage.setItem('user_token', session.user.id);
              subscription.unsubscribe();
              router.push('/');
            }
          });
          
          // 5초 지나도 반응 없으면 로그인 페이지로 튕겨냄 (예외 처리)
          setTimeout(() => {
            setError('로그인 처리에 시간이 너무 오래 걸립니다. 다시 시도해주세요.');
            setTimeout(() => router.push('/login'), 3000);
          }, 5000);
        }
      } catch (err: any) {
        setError(err.message || '인증 중 오류가 발생했습니다.');
        setTimeout(() => router.push('/login'), 3000);
      }
    };
    
    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white">
      {error ? (
        <div className="text-red-400 bg-red-400/10 px-6 py-4 rounded-lg font-medium">
          {error}
        </div>
      ) : (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mb-6"></div>
          <p className="text-slate-300 font-medium animate-pulse text-lg">구글 계정으로 로그인 중입니다...</p>
        </>
      )}
    </div>
  );
}
