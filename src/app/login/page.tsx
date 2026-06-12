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

      if (error) throw new Error(error.message);
      
      if (data.user) {
        localStorage.setItem('user_token', data.user.id);
      }
      router.push('/');
    } catch (err: any) {
      setErrorMsg('로그인 실패: ' + (err.message || '오류가 발생했습니다.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Supabase 회원가입 시도
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw new Error(error.message);
      
      alert('회원가입이 완료되었습니다! 동일한 정보로 로그인해주세요.');
    } catch (err: any) {
      setErrorMsg('회원가입 실패: ' + (err.message || '오류가 발생했습니다.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw new Error(error.message);
    } catch (err: any) {
      setErrorMsg('구글 로그인 실패: ' + (err.message || '오류가 발생했습니다.'));
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

            <div className="flex flex-col gap-3 mt-4">
              <button 
                type="button" 
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg font-semibold shadow-lg shadow-violet-500/25 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '이메일로 로그인'}
              </button>
              
              <button 
                type="button" 
                onClick={handleSignup}
                disabled={isLoading}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700"
              >
                이메일로 10초 회원가입
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">또는</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>

              <button 
                type="button" 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 bg-white hover:bg-gray-100 text-slate-900 rounded-lg font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google 계정으로 계속하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
