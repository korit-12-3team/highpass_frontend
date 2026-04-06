"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2 } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { REGION_DATA, INITIAL_USERS } from '@/lib/constants';

export default function LoginPage() {
  const { handleAuthSuccess, isAuthenticated } = useApp();
  const router = useRouter();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [location, setLocation] = useState('');
  const [sido, setSido] = useState('');
  const [sigungu, setSigungu] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/calendar');
  }, [isAuthenticated, router]);

  useEffect(() => {
    if ((window as any).Kakao?.Auth) { setKakaoReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.async = true;
    script.onload = () => {
      const kakao = (window as any).Kakao;
      const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY_local || process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
      if (kakao && jsKey && !kakao.isInitialized()) kakao.init(jsKey);
      setKakaoReady(true);
    };
    script.onerror = () => console.error('카카오 SDK 스크립트 로드 실패');
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (isLoginMode) {
        const u = INITIAL_USERS.find(x => x.email === email && x.password === password);
        if (u) { handleAuthSuccess(u); }
        else { setError('계정 불일치'); setLoading(false); }
      } else {
        const newUser = {
          id: `u${Date.now()}`, email, password, nickname, name: '신규',
          ageGroup: ageGroup || '비공개', gender: gender || '비공개', location: location || '지역 미상'
        };
        (INITIAL_USERS as any[]).push(newUser);
        handleAuthSuccess(newUser);
      }
    }, 800);
  };

  const handleKakaoLogin = () => {
    const kakao = (window as any).Kakao;
    if (!kakaoReady || !kakao?.Auth) {
      alert('카카오 SDK가 아직 로드 중입니다. 잠시 후 다시 눌러주세요.');
      return;
    }
    setKakaoLoading(true);
    console.log('[카카오] 로그인 시도, SDK 초기화 여부:', kakao.isInitialized());
    console.log('[카카오] JS Key:', process.env.NEXT_PUBLIC_KAKAO_JS_KEY_local || process.env.NEXT_PUBLIC_KAKAO_JS_KEY);

    if (!kakao.isInitialized()) {
      alert('카카오 SDK 초기화 실패.');
      setKakaoLoading(false);
      return;
    }

    const popupTimeout = setTimeout(() => {
      setKakaoLoading(false);
      alert('카카오 로그인 응답 없음 (10초 초과).\n카카오 개발자 콘솔에서 사이트 도메인을 확인하세요.');
    }, 10000);

    console.log('[카카오] Auth.login 호출');
    kakao.Auth.login({
      scope: 'profile_nickname,account_email',
      success: () => {
        clearTimeout(popupTimeout);
        kakao.API.request({
          url: '/v2/user/me',
          success: (res: any) => {
            const kakaoAccount = res.kakao_account || {};
            const profile = kakaoAccount.profile || {};
            handleAuthSuccess({
              id: `kakao_${res.id}`,
              email: kakaoAccount.email || `kakao_${res.id}@kakao.com`,
              password: '',
              nickname: profile.nickname || '카카오유저',
              name: profile.nickname || '카카오유저',
              profileImage: profile.profile_image_url || null,
              ageGroup: '비공개', gender: '비공개', location: '비공개', loginType: 'kakao',
            });
            setKakaoLoading(false);
          },
          fail: (err: any) => {
            console.error('사용자 정보 요청 실패:', err);
            alert('사용자 정보를 가져오지 못했습니다.');
            setKakaoLoading(false);
          },
        });
      },
      fail: (err: any) => {
        clearTimeout(popupTimeout);
        console.error('카카오 로그인 실패:', err);
        alert(`카카오 로그인 실패: ${err.error_description || err.error || '알 수 없는 오류'}`);
        setKakaoLoading(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hp-900 via-hp-800 to-hp-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8">
        <h1 className="text-3xl font-black text-hp-900 text-center mb-6">
          <Zap size={32} className="inline text-hp-600 fill-hp-600 mb-1" /> HighPass
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일" className="w-full bg-hp-50 border border-hp-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-hp-500" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호" className="w-full bg-hp-50 border border-hp-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-hp-500" />
          {!isLoginMode && (
            <>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="별명" className="w-full bg-hp-50 border border-hp-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-hp-500" />
              <div className="grid grid-cols-2 gap-2">
                <select value={sido} onChange={e => { setSido(e.target.value); setSigungu(''); setLocation(e.target.value); }} className="bg-hp-50 border border-hp-200 rounded-xl px-3 py-3 text-slate-800 outline-none focus:border-hp-500 appearance-none">
                  <option value="">시/도 선택</option>
                  {Object.keys(REGION_DATA).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={sigungu} onChange={e => { setSigungu(e.target.value); setLocation(`${sido} ${e.target.value}`); }} disabled={!sido} className="bg-hp-50 border border-hp-200 rounded-xl px-3 py-3 text-slate-800 outline-none focus:border-hp-500 appearance-none disabled:opacity-40">
                  <option value="">군/구 선택</option>
                  {(REGION_DATA[sido] || []).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-2">연령대</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {['10대', '20대', '30대', '40대', '50대+'].map(ag => (
                    <button type="button" key={ag} onClick={() => setAgeGroup(ag)} className={`py-2 rounded-lg text-sm font-medium transition-colors ${ageGroup === ag ? 'bg-hp-600 text-white' : 'bg-white border border-hp-200 text-slate-600 hover:border-hp-400'}`}>{ag}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-2">성별</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {['남성', '여성', '기타'].map(g => (
                    <button type="button" key={g} onClick={() => setGender(g)} className={`py-2 rounded-lg text-sm font-medium transition-colors ${gender === g ? 'bg-hp-600 text-white' : 'bg-white border border-hp-200 text-slate-600 hover:border-hp-400'}`}>{g}</button>
                  ))}
                </div>
              </div>
            </>
          )}
          {error && <p className="text-red-500">{error}</p>}
          <button type="submit" className="w-full bg-hp-600 text-white font-bold py-3.5 rounded-xl">
            {loading ? '...' : (isLoginMode ? '로그인' : '가입하기')}
          </button>
        </form>
        {isLoginMode && (
          <div className="mt-6">
            <div className="relative flex items-center py-2 mb-4">
              <div className="flex-grow border-t border-hp-200"></div>
              <span className="flex-shrink-0 mx-4 text-hp-400 text-xs font-medium">소셜 간편 로그인</span>
              <div className="flex-grow border-t border-hp-200"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleAuthSuccess({ id: `oauth_${Date.now()}`, email: 'user@google.com', password: '', nickname: 'Google유저', name: '간편로그인', ageGroup: '20대', gender: '비공개', location: 'Busan' })} className="flex items-center justify-center gap-2 bg-white text-slate-800 hover:bg-hp-50 border border-hp-100 font-bold py-2.5 rounded-xl text-sm transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Google
              </button>
              <button onClick={handleKakaoLogin} disabled={kakaoLoading || !kakaoReady} className="flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FDD800] disabled:opacity-60 text-black font-bold py-2.5 rounded-xl text-sm transition-colors">
                {(kakaoLoading || !kakaoReady) ? <Loader2 size={18} className="animate-spin" /> : <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.52 5.44c-.16.48.32.88.72.64l6.32-4.24c.48.08 1.04.08 1.52.08 6.96 0 12.64-4.48 12.64-10.08S22.96 4.64 16 4.64z" /></svg>}
                {kakaoLoading ? '로그인 중...' : !kakaoReady ? '로딩 중...' : '카카오 로그인'}
              </button>
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs text-blue-600 font-bold mb-1">🔑 테스트 계정 (빠른 로그인)</p>
              <p className="text-xs text-blue-500">이메일: <span className="font-mono font-bold">user@test.com</span></p>
              <p className="text-xs text-blue-500">비밀번호: <span className="font-mono font-bold">password123</span></p>
            </div>
          </div>
        )}
        <button onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} className="w-full text-hp-400 hover:text-hp-600 mt-5 text-sm">
          {isLoginMode ? '회원가입' : '로그인으로 돌아가기'}
        </button>
      </div>
    </div>
  );
}
