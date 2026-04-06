"use client";
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Calendar as CalendarIcon, Search, Users, MessageSquare, MessageCircle, X, Zap, MapPin, Loader2, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { useKakaoLoader } from 'react-kakao-maps-sdk';
import KakaoMap from '@/components/KakaoMap';
import { CERT_DATA, REGION_DATA } from '@/lib/constants';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser, isAuthenticated, logout, setCurrentUser,
    chatRooms, setChatRooms, setActiveChatRoomId,
    profileModal, setProfileModal,
    editProfileOpen, setEditProfileOpen,
    editNickname, setEditNickname,
    editAgeGroup, setEditAgeGroup,
    editGender, setEditGender,
    editLocation, setEditLocation,
    editSido, setEditSido,
    editSigungu, setEditSigungu,
    writeModalOpen, setWriteModalOpen,
    writeType, setWriteType,
    postTitle, setPostTitle,
    postContent, setPostContent,
    postCert, setPostCert,
    postCertCategory, setPostCertCategory,
    selectedPlace, setSelectedPlace,
    searchKeyword, setSearchKeyword,
    searchResults, setSearchResults,
    submitPost,
    mockProfiles,
  } = useApp();

  const [loadingKakao, errorKakao] = useKakaoLoader({
    appkey: '894423a9ffcffb29a1e5d50427ded82e',
    libraries: ['services', 'clusterer'],
  });

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !currentUser) return null;

  const navItems = [
    { tab: 'calendar', label: '나의 캘린더', icon: <CalendarIcon size={20} />, href: '/calendar' },
    { tab: 'search', label: '자격증 정보', icon: <Search size={20} />, href: '/search' },
  ];
  const communityItems = [
    { tab: 'study', label: '스터디 모집', icon: <Users size={20} />, href: '/study' },
    { tab: 'free', label: '자유 게시판', icon: <MessageSquare size={20} />, href: '/free' },
    { tab: 'chat', label: '채팅방', icon: <MessageCircle size={20} />, href: '/chat' },
  ];

  const searchPlacesOnKakao = () => {
    if (typeof window !== 'undefined' && (window as any).kakao?.maps?.services) {
      const ps = new (window as any).kakao.maps.services.Places();
      ps.keywordSearch(searchKeyword, (data: any, status: any) => {
        if (status === (window as any).kakao.maps.services.Status.OK) {
          setSearchResults(data.map((d: any) => ({ id: d.id, name: d.place_name, address: d.road_address_name || d.address_name, phone: d.phone, category: d.category_group_name || d.category_name?.split('>').pop()?.trim(), lat: parseFloat(d.y), lng: parseFloat(d.x) })));
        }
      });
    } else {
      alert('지도 스크립트가 아직 로드되지 않았습니다.');
    }
  };

  return (
    <div className="flex h-screen bg-hp-50 font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-hp-900 border-r-0 shadow-xl flex flex-col hidden md:flex z-10 relative">
        <div className="p-6 border-b border-hp-800">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Zap size={28} className="text-hp-600 fill-hp-600" /> HighPass
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-4">
          {navItems.map(item => (
            <button key={item.tab} onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${pathname === item.href ? 'bg-hp-700 text-white border-l-4 border-hp-300' : 'text-hp-200 hover:bg-hp-800 border-l-4 border-transparent'}`}>
              {item.icon} {item.label}
            </button>
          ))}
          <div className="pt-5 pb-2">
            <p className="px-4 text-[10px] font-black text-hp-400 uppercase tracking-widest">Community</p>
          </div>
          {communityItems.map(item => (
            <button key={item.tab} onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${pathname === item.href ? 'bg-hp-700 text-white border-l-4 border-hp-300' : 'text-hp-200 hover:bg-hp-800 border-l-4 border-transparent'}`}>
              {item.icon} {item.label}
              {item.tab === 'chat' && chatRooms.length > 0 && (
                <span className="ml-auto text-[10px] bg-hp-600 text-white rounded-full px-1.5 py-0.5 font-bold">{chatRooms.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-hp-700 bg-hp-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-hp-800 rounded-lg flex-1" onClick={() => setProfileModal(currentUser.id)}>
            <div className="w-9 h-9 bg-hp-600 rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white">
              {currentUser.nickname.substring(0, 1)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{currentUser.nickname}</p>
              <p className="text-[10px] text-hp-300 truncate">{currentUser.location}</p>
            </div>
          </div>
          <button onClick={logout} className="p-2.5 text-hp-300 hover:text-white"><X size={16} /></button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {children}
      </main>

      {/* ── Profile Modal ── */}
      {profileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setProfileModal(null); setEditProfileOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-hp-600 h-24 relative">
              <button onClick={() => { setProfileModal(null); setEditProfileOpen(false); }} className="absolute top-3 right-3 rounded-full bg-white/30 p-1"><X size={20} /></button>
            </div>
            <div className="px-6 pb-6 relative text-center">
              <div className="w-20 h-20 bg-white rounded-full border-4 border-hp-100 absolute -top-10 left-1/2 -translate-x-1/2 flex items-center justify-center text-hp-600 font-bold text-2xl shadow-sm">
                {(profileModal === currentUser.id ? currentUser : mockProfiles[profileModal])?.nickname.substring(0, 1)}
              </div>
              {editProfileOpen ? (
                <div className="pt-14 flex flex-col gap-3 text-left">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">닉네임</label>
                    <input type="text" value={editNickname} onChange={e => setEditNickname(e.target.value)} className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">연령대</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {['10대', '20대', '30대', '40대', '50대+'].map(ag => (
                        <button type="button" key={ag} onClick={() => setEditAgeGroup(ag)} className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${editAgeGroup === ag ? 'bg-hp-600 text-white' : 'bg-white border border-hp-200 text-slate-500 hover:border-hp-400'}`}>{ag}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">성별</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['남성', '여성', '기타'].map(g => (
                        <button type="button" key={g} onClick={() => setEditGender(g)} className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${editGender === g ? 'bg-hp-600 text-white' : 'bg-white border border-hp-200 text-slate-500 hover:border-hp-400'}`}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">지역</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={editSido} onChange={e => { setEditSido(e.target.value); setEditSigungu(''); setEditLocation(e.target.value); }} className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500 appearance-none">
                        <option value="">시/도 선택</option>
                        {Object.keys(REGION_DATA).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={editSigungu} onChange={e => { setEditSigungu(e.target.value); setEditLocation(`${editSido} ${e.target.value}`); }} disabled={!editSido} className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500 appearance-none disabled:opacity-40">
                        <option value="">군/구 선택</option>
                        {(REGION_DATA[editSido] || []).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setEditProfileOpen(false)} className="flex-1 py-2.5 rounded-xl border border-hp-200 text-sm font-bold text-hp-600 hover:bg-hp-50">취소</button>
                    <button onClick={() => {
                      setCurrentUser((prev: any) => ({ ...prev, nickname: editNickname || prev.nickname, ageGroup: editAgeGroup || prev.ageGroup, gender: editGender || prev.gender, location: editLocation || prev.location }));
                      setEditProfileOpen(false);
                      setProfileModal(null);
                    }} className="flex-1 py-2.5 rounded-xl bg-hp-600 text-white text-sm font-bold hover:bg-hp-700">저장</button>
                  </div>
                </div>
              ) : (
                <div className="pt-14 flex flex-col items-center">
                  <h3 className="text-xl font-bold flex gap-2">
                    {(profileModal === currentUser.id ? currentUser : mockProfiles[profileModal])?.nickname}
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-normal">{(profileModal === currentUser.id ? currentUser : mockProfiles[profileModal])?.name}</span>
                  </h3>
                  <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2"><Users size={16} />{(profileModal === currentUser.id ? currentUser : mockProfiles[profileModal])?.ageGroup}</p>
                    <p className="flex items-center gap-2"><Users size={16} />{(profileModal === currentUser.id ? currentUser : mockProfiles[profileModal])?.gender}</p>
                    <p className="flex items-center gap-2"><MapPin size={16} />{(profileModal === currentUser.id ? currentUser : mockProfiles[profileModal])?.location}</p>
                  </div>
                  {profileModal === currentUser.id
                    ? <button onClick={() => { setEditNickname(currentUser.nickname); setEditAgeGroup(currentUser.ageGroup); setEditGender(currentUser.gender); setEditLocation(currentUser.location); setEditProfileOpen(true); }} className="w-full mt-6 bg-hp-600 text-white py-2.5 rounded-xl font-bold hover:bg-hp-700 transition-colors">프로필 수정하기</button>
                    : <button onClick={() => {
                      const partnerNickname = mockProfiles[profileModal]?.nickname || '알 수 없음';
                      const existing = chatRooms.find((r: any) => r.partnerId === profileModal);
                      if (existing) { setActiveChatRoomId(existing.id); }
                      else { const newRoom = { id: `chat_${Date.now()}`, partnerId: profileModal, partnerNickname, messages: [] }; setChatRooms((prev: any) => [...prev, newRoom]); setActiveChatRoomId(newRoom.id); }
                      setProfileModal(null); setEditProfileOpen(false);
                      router.push('/chat');
                    }} className="w-full mt-6 bg-hp-600 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2"><MessageSquare size={18} /> 1:1 채팅하기</button>
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Write Modal ── */}
      {writeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="font-bold text-xl">HighPass 새 글 쓰기</h3>
              <button onClick={() => setWriteModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <label className="block text-sm font-bold mb-1">게시판 선택</label>
              <select value={writeType} onChange={e => setWriteType(e.target.value as any)} className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-hp-500 font-medium">
                <option value="study">스터디 모집</option>
                <option value="free">자유 게시판</option>
              </select>
              {writeType === 'study' && (
                <>
                  <label className="block text-sm font-bold mb-1">자격증 선택</label>
                  <div className={`grid ${postCertCategory === '기타' ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mb-4`}>
                    <select value={postCertCategory} onChange={e => { setPostCertCategory(e.target.value); setPostCert(''); }} className="border p-3 rounded-lg outline-none focus:border-hp-500 font-medium appearance-none">
                      <option value="">카테고리 선택</option>
                      {Object.keys(CERT_DATA).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="기타">기타</option>
                    </select>
                    {postCertCategory !== '기타' && (
                      <select value={postCert} onChange={e => setPostCert(e.target.value)} disabled={!postCertCategory} className="border p-3 rounded-lg outline-none focus:border-hp-500 font-medium appearance-none disabled:opacity-40">
                        <option value="">자격증 선택</option>
                        {(CERT_DATA[postCertCategory] || []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>
                </>
              )}
              <label className="block text-sm font-bold mb-1">제목</label>
              <input type="text" value={postTitle} onChange={e => setPostTitle(e.target.value)} className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-hp-500 font-medium" placeholder="제목을 입력하세요" />
              <label className="block text-sm font-bold mb-1">내용</label>
              <textarea rows={5} value={postContent} onChange={e => setPostContent(e.target.value)} className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-hp-500 font-medium resize-none" placeholder="내용을 작성하세요"></textarea>
              {writeType === 'study' && (
                <div className="bg-hp-900 border border-hp-700 p-4 rounded-xl text-white mt-4 shadow-xl">
                  <label className="block text-sm font-bold mb-3 text-slate-300">장소 검색 (카카오맵 API)</label>
                  <div className="flex gap-2 mb-4">
                    <input type="text" value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') searchPlacesOnKakao(); }} className="border border-hp-600 bg-hp-800 p-2.5 rounded-lg flex-1 outline-none text-sm placeholder:text-hp-400 text-white" placeholder="키워드 입력 (예: 강남역 카페)" />
                    <button onClick={searchPlacesOnKakao} className="bg-hp-600 hover:bg-hp-500 transition-colors text-white px-5 rounded-lg font-bold text-sm">검색</button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="flex flex-col md:flex-row gap-4 h-72">
                      <div className="w-full md:w-1/2 overflow-y-auto space-y-2 pr-2">
                        {searchResults.map(res => (
                          <div key={res.id} onClick={() => setSelectedPlace(res)} className={`p-4 rounded-xl text-sm cursor-pointer border transition-all ${selectedPlace?.id === res.id ? 'bg-slate-800 border-hp-500 ring-1 ring-hp-500' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'}`}>
                            <div className="flex justify-between items-start mb-1"><h4 className="font-bold text-base truncate">{res.name}</h4></div>
                            <div className="flex items-center gap-2 mb-2"><span className="text-yellow-400 font-bold text-xs">4.0 ★</span><span className="text-slate-500 text-xs">· {res.category || '장소'}</span></div>
                            <p className="text-slate-400 text-xs mb-1 truncate">{res.address}</p>
                            {res.phone && <p className="text-slate-500 text-xs font-mono">{res.phone}</p>}
                          </div>
                        ))}
                      </div>
                      <div className="w-full md:w-1/2 h-full rounded-xl overflow-hidden shadow-inner border border-slate-700 bg-slate-800 flex items-center justify-center">
                        {loadingKakao ? (
                          <div className="text-slate-500 flex flex-col items-center gap-2"><Loader2 className="animate-spin" /> 지도 로딩 중...</div>
                        ) : errorKakao ? (
                          <div className="text-red-400 text-xs p-4 text-center">지도 로드 실패</div>
                        ) : (
                          <KakaoMap apiKey="894423a9ffcffb29a1e5d50427ded82e" markers={searchResults.map(r => ({ lat: r.lat, lng: r.lng, locationName: r.name }))} center={selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lng } : { lat: searchResults[0].lat, lng: searchResults[0].lng }} level={4} />
                        )}
                      </div>
                    </div>
                  )}
                  {selectedPlace && <div className="mt-4 p-3 bg-hp-900/30 border border-hp-800/50 rounded-lg flex items-center justify-between"><p className="text-sm text-hp-300 font-bold">📍 선택된 확정 장소: {selectedPlace.name}</p></div>}
                </div>
              )}
            </div>
            <div className="p-5 border-t flex justify-end gap-3 bg-hp-50">
              <button onClick={() => { setWriteModalOpen(false); setPostTitle(''); setPostContent(''); setSelectedPlace(null); setSearchKeyword(''); setSearchResults([]); }} className="px-5 py-2.5 rounded-lg bg-hp-50 text-hp-700 border border-hp-200 font-bold">취소</button>
              <button onClick={submitPost} className="px-5 py-2.5 rounded-lg bg-hp-600 text-white font-bold">등록하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
