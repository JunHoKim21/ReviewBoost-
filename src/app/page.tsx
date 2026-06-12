'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import html2canvas from 'html2canvas';
import { Quote, Download, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [originalText, setOriginalText] = useState('');
  const [summary, setSummary] = useState('너무 예쁘고 핏도 딱 맞아요! 데일리로 입기 너무 좋네요 💖');
  const [subText, setSubText] = useState('@스마트스토어고객님');
  const [theme, setTheme] = useState<'dark'|'light'|'gradient'|'nature'|'sunset'|'ocean'>('dark');
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [credit, setCredit] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'error'|'success'} | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Authentication Check & Fetch Credit
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('user_token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      // 사용자 크레딧 정보 조회
      const { data, error } = await supabase
        .from('users')
        .select('credit_limit, credit_used')
        .eq('id', token)
        .single();
        
      if (data) {
        setCredit(data.credit_limit - data.credit_used);
      }
      setIsAuthChecked(true);
    };
    fetchUser();
  }, [router]);

  const showToast = (msg: string, type: 'error'|'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!isAuthChecked) {
    return <div className="min-h-screen bg-slate-950 flex justify-center items-center text-white"><div className="animate-pulse">Loading...</div></div>;
  }

  const handleSummarize = async () => {
    if (!originalText.trim()) {
      showToast('리뷰 원본을 입력해주세요.', 'error');
      return;
    }
    
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalText })
      });

      if (!response.ok) throw new Error('요약 실패');
      
      const data = await response.json();
      setSummary(data.summary);
      setSubText(data.subText || subText);
      showToast('AI 요약 완료!', 'success');
    } catch (e) {
      showToast('요약에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDownload = async () => {
    if (credit <= 0) {
      setShowModal(true);
      return;
    }

    if (!cardRef.current) return;
    
    setIsDownloading(true);
    try {
      const userId = localStorage.getItem('user_token');
      
      // 백엔드 크레딧 차감 API 호출 (원자적 차감)
      const res = await fetch('/api/cards/create', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          originalText, 
          summarizedText: summary, 
          templateStyle: theme 
        }) 
      });

      if (!res.ok) {
        if (res.status === 403) {
           setShowModal(true);
        } else {
           throw new Error('서버 통신 오류');
        }
        return;
      }

      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // 고해상도
        useCORS: true,
        backgroundColor: null
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `review_boost_${Date.now()}.png`;
      link.click();
      
      setCredit(prev => prev - 1);
      showToast('카드뉴스가 다운로드 되었습니다!', 'success');
      
    } catch (e) {
      showToast('다운로드 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const getThemeClasses = () => {
    switch(theme) {
      case 'light': return 'bg-white text-slate-900 border-slate-200';
      case 'gradient': return 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-none';
      case 'nature': return 'bg-gradient-to-br from-emerald-100 to-teal-200 text-teal-950 border-teal-300';
      case 'sunset': return 'bg-gradient-to-br from-orange-400 to-rose-400 text-white border-none';
      case 'ocean': return 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white border-none';
      case 'dark': default: return 'bg-gradient-to-br from-slate-800 to-slate-950 text-white border-white/10';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen bg-slate-950 text-white">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl ${toast.type === 'error' ? 'bg-red-500/90' : 'bg-emerald-500/90'} backdrop-blur-md`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Credit Exceeded Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="text-xl font-bold">무료 크레딧 소진</h3>
            <p className="text-sm text-slate-300">이번 달 제공된 무료 크레딧(5회)을 모두 소진하셨습니다. Premium 플랜으로 업그레이드하여 무제한 이용해 보세요!</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm">닫기</button>
              <button className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 transition text-sm font-bold">월 $9.99 업그레이드</button>
            </div>
          </div>
        </div>
      )}

      {/* Left Column: Controls */}
      <div className="lg:col-span-5 border-r border-white/10 p-6 flex flex-col h-[50vh] lg:h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <span className="font-bold text-xl bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent">ReviewBoost</span>
          <div className="text-xs px-3 py-1.5 glass-panel rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            무료 크레딧: <span className="font-bold text-violet-400">{credit}개</span> 남음
          </div>
        </div>

        <div className="space-y-8 flex-1">
          {/* Step 1 */}
          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-xs">1</span>
              스마트스토어 리뷰 원본 붙여넣기
            </label>
            <textarea 
              value={originalText}
              onChange={e => setOriginalText(e.target.value)}
              className="w-full h-28 p-3 glass-input rounded-lg resize-none text-sm placeholder-slate-500"
              placeholder="여기에 고객이 남긴 리뷰 텍스트를 그대로 붙여넣어주세요..."
            />
            <button 
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-semibold transition flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {isSummarizing ? (
                <span className="animate-pulse">분석 및 요약 중...</span>
              ) : (
                <><Sparkles size={16}/> AI 핵심 카피 요약하기</>
              )}
            </button>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-xs">2</span>
              AI 요약본 확인 및 수정
            </label>
            <div className="space-y-2">
              <input 
                type="text" 
                value={summary}
                onChange={e => setSummary(e.target.value)}
                className="w-full p-3 glass-input rounded-lg text-sm"
                placeholder="메인 리뷰 문구"
              />
              <input 
                type="text" 
                value={subText}
                onChange={e => setSubText(e.target.value)}
                className="w-full p-3 glass-input rounded-lg text-sm text-slate-400"
                placeholder="고객 닉네임 또는 스토어명"
              />
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-xs">3</span>
              템플릿 스타일 선택
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-lg border text-xs transition ${theme === 'dark' ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:border-white/30'} glass-panel`}
              >
                다크 럭셔리
              </button>
              <button 
                onClick={() => setTheme('light')}
                className={`p-3 rounded-lg border text-xs transition ${theme === 'light' ? 'border-violet-500 bg-white/90 text-slate-900' : 'border-white/10 hover:border-white/30 bg-white/5'} `}
              >
                클린 화이트
              </button>
              <button 
                onClick={() => setTheme('gradient')}
                className={`p-3 rounded-lg border text-xs transition ${theme === 'gradient' ? 'border-violet-500' : 'border-transparent opacity-70 hover:opacity-100'} bg-gradient-to-r from-violet-500 to-fuchsia-500`}
              >
                비비드 팝
              </button>
              <button 
                onClick={() => setTheme('nature')}
                className={`p-3 rounded-lg border text-xs transition ${theme === 'nature' ? 'border-violet-500' : 'border-transparent opacity-70 hover:opacity-100'} bg-gradient-to-br from-emerald-100 to-teal-200 text-teal-950`}
              >
                네이처 그린
              </button>
              <button 
                onClick={() => setTheme('sunset')}
                className={`p-3 rounded-lg border text-xs transition ${theme === 'sunset' ? 'border-violet-500' : 'border-transparent opacity-70 hover:opacity-100'} bg-gradient-to-br from-orange-400 to-rose-400 text-white`}
              >
                선셋 코랄
              </button>
              <button 
                onClick={() => setTheme('ocean')}
                className={`p-3 rounded-lg border text-xs transition ${theme === 'ocean' ? 'border-violet-500' : 'border-transparent opacity-70 hover:opacity-100'} bg-gradient-to-br from-cyan-600 to-blue-700 text-white`}
              >
                오션 블루
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-4 mt-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 font-bold rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isDownloading ? '렌더링 중...' : <><Download size={18} /> 카드뉴스 다운로드 (크레딧 -1)</>}
        </button>
      </div>

      {/* Right Column: Preview Canvas */}
      <div className="lg:col-span-7 bg-slate-900/50 flex justify-center items-center p-8 relative overflow-hidden h-[50vh] lg:h-screen">
        {/* Background decorative patterns */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        {/* Instagram 1:1 Canvas */}
        <div 
          ref={cardRef}
          className={`aspect-square w-full max-w-[450px] rounded-xl shadow-2xl relative overflow-hidden flex flex-col justify-between p-10 border border-black/10 transition-colors duration-500 ${getThemeClasses()}`}
        >
          {/* Watermark (Free Tier) */}
          <div className="absolute top-4 right-4 text-[10px] font-bold opacity-30 tracking-widest">
            MADE BY REVIEWBOOST
          </div>

          <div className="text-xs font-bold tracking-widest opacity-60">
            CUSTOMER REVIEWS
          </div>

          <div className="flex flex-col justify-center flex-1 space-y-6">
            <Quote className="w-10 h-10 opacity-40" />
            
            {isSummarizing ? (
              <div className="space-y-3 w-full animate-pulse">
                <div className="h-6 bg-current opacity-20 rounded w-3/4"></div>
                <div className="h-6 bg-current opacity-20 rounded w-full"></div>
                <div className="h-6 bg-current opacity-20 rounded w-1/2"></div>
              </div>
            ) : (
              <p className="text-xl md:text-2xl font-bold leading-relaxed break-keep">
                {summary || "리뷰 내용을 기다리고 있어요..."}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center border-t border-current border-opacity-10 pt-5">
            <span className="text-sm font-medium opacity-80">{subText}</span>
            <div className="flex text-yellow-400 text-sm">
              ★★★★★
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
