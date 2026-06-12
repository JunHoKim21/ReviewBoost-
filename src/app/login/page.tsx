'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Supabase 로그인 시도
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }
      
      // 로컬 스토리지에 유저 ID 임시 저장 (추후 전역 상태나 Auth Token 활용 권장)
      if (data.user) {
        localStorage.setItem('user_token', data.user.id);
      }
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-950 text-white p-4">
      <div className="glass-panel p-8 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
        {/* Decorative blur elements */}
        <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-violet-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-32 h-32 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent text-center mb-2">
            ReviewBoost
          </h1>
          <p className="text-sm text-slate-400 text-center mb-8">
            리뷰를 감성 카드뉴스로 변환하세요
          </p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 ml-1">이메일</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seller@example.com"
                className="w-full px-4 py-3 glass-input rounded-lg focus:outline-none text-white placeholder-slate-500" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 ml-1">비밀번호</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 glass-input rounded-lg focus:outline-none text-white placeholder-slate-500" 
              />
            </div>

            {errorMsg && (
              <p className="text-red-400 text-xs text-center">{errorMsg}</p>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg font-semibold shadow-lg shadow-violet-500/25 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로그인 중...
                </>
              ) : '로그인 / 시작하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
