"use client";

import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import {
  Calendar as CalendarIcon, Search, Users, MessageSquare, MapPin,
  Heart, Bookmark, Eye, MessageCircle, X, Plus, CheckCircle2,
  Circle, Map as MapIcon, Trash2, Zap, Clock, ArrowRight, Loader2, List as ListIcon
} from 'lucide-react';
import { allItems } from "@/lib/data";
import { getAllStudies } from "@/lib/study";
import KakaoMap from "@/components/KakaoMap";
import { useKakaoLoader } from "react-kakao-maps-sdk";

const initialUsers = [
  { id: 'u1', email: 'user@test.com', password: 'password123', nickname: '열공러', name: '홍길동', ageGroup: '20대', gender: '남성', location: '서울시 강남구' }
];

const realStudies = getAllStudies();
const studiesAsBoardData = realStudies.map(s => ({
  id: s.id, type: "study" as const, title: s.title, content: s.content, author: s.userNickname,
  location: s.locationName, lat: s.latitude, lng: s.longitude, views: s.viewCount, likes: s.favoriteCount, scraps: 0, comments: [], authorId: `u${s.id}`,
}));

const mockProfiles: Record<string, any> = realStudies.reduce((acc, s) => ({
  ...acc, [`u${s.id}`]: { id: `u${s.id}`, nickname: s.userNickname, name: "스터디 작성자", ageGroup: "비공개", gender: "비공개", location: s.userRegion }
}), {} as any);

mockProfiles['u2'] = { id: 'u2', nickname: '합격가즈아', name: '이수민', ageGroup: '20대', gender: '여성', location: '서울 강남역' };
mockProfiles['u3'] = { id: 'u3', nickname: '벼락치기장인', name: '김동현', ageGroup: '30대', gender: '남성', location: '부산 해운대구' };

const initialBoardData = [
  ...studiesAsBoardData,
  { id: 99991, type: 'free' as const, title: '필기 3일 남았는데 기출만 돌려도 될까요?', content: '기출문제 계속 돌리고 있는데 불안하네요.', author: '벼락치기장인', location: '부산 해운대구', lat: undefined, lng: undefined, views: 350, likes: 45, scraps: 1, comments: [{ id: 1, author: '합격가즈아', text: '5개년 확실하면 됩니다!' }], authorId: 'u3' },
];

export default function App() {
  const [loadingKakao, errorKakao] = useKakaoLoader({
    appkey: "894423a9ffcffb29a1e5d50427ded82e",
    libraries: ["services", "clusterer"],
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'calendar' | 'search' | 'study' | 'free' | 'chat'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0: 1월, 1: 2월...

  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [profileModal, setProfileModal] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

  const [todos, setTodos] = useState<{ [key: number]: any[] }>({
    15: [
      { id: 1, text: '기출문제 1회분 풀기', done: true, createdAt: '09:00', completedAt: '11:30' },
      { id: 2, text: '오답 노트 정리하기', done: false, createdAt: '09:05' }
    ]
  });

  const [events, setEvents] = useState<{ id: number, title: string, month: number, startDay: number, endDay: number, color: string }[]>([
    { id: 101, title: '정보처리기사 1회 필기 접수', month: 3, startDay: 15, endDay: 18, color: 'bg-hp-500' }
  ]);

  const [newTodoText, setNewTodoText] = useState('');
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [writeType, setWriteType] = useState<'study' | 'free'>('study');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCertCategory, setPostCertCategory] = useState('');
  const [postCert, setPostCert] = useState('');
  const [certFilter, setCertFilter] = useState('');
  const [locationFilterSido, setLocationFilterSido] = useState('');
  const [locationFilterSigungu, setLocationFilterSigungu] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<{ id: string, name: string, category?: string, phone?: string, lat: number, lng: number } | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [boardData, setBoardData] = useState<any[]>(initialBoardData);

  const [addEventModalOpen, setAddEventModalOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState<any>(null);
  const [certModalCertCat, setCertModalCertCat] = useState('');
  const [certModalCert, setCertModalCert] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editAgeGroup, setEditAgeGroup] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSido, setEditSido] = useState('');
  const [editSigungu, setEditSigungu] = useState('');

  const [chatRooms, setChatRooms] = useState<{ id: string; partnerId: string; partnerNickname: string; messages: { id: number; senderId: string; text: string; createdAt: string }[] }[]>([]);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [viewPostModal, setViewPostModal] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [isDraggingEvent, setIsDraggingEvent] = useState(false);

  const [eventTitle, setEventTitle] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') inputRef.current?.focus();
      if (e.key === 'Escape') inputRef.current?.blur();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  const toggleTodo = (date: number, id: number) => {
    const timeString = new Date().toTimeString().slice(0, 5);
    setTodos(prev => ({
      ...prev, [date]: prev[date]?.map(t => t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? timeString : undefined } : t) ?? []
    }));
  };

  const deleteTodo = (date: number, id: number) => {
    setTodos(prev => ({ ...prev, [date]: prev[date]?.filter(t => t.id !== id) ?? [] }));
  };

  const handleAddTodo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTodoText.trim() !== '') {
      const newTodo = { id: Date.now(), text: newTodoText.trim(), done: false, createdAt: new Date().toTimeString().slice(0, 5) };
      setTodos(prev => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), newTodo] }));
      setNewTodoText('');
    }
  };

  const submitPost = () => {
    if (!postTitle || !postContent) return;
    const newPost = {
      id: Date.now(), type: writeType, title: postTitle, content: postContent,
      author: currentUser.nickname, location: selectedPlace?.name || currentUser.location,
      lat: selectedPlace?.lat, lng: selectedPlace?.lng,
      cert: postCert || null,
      views: 0, likes: 0, scraps: 0, comments: [], authorId: currentUser.id, createdAt: '방금 전'
    };
    setBoardData([newPost, ...boardData]);
    setWriteModalOpen(false);
    setPostTitle(''); setPostContent(''); setSelectedPlace(null); setSearchKeyword(''); setSearchResults([]);
    setPostCertCategory(''); setPostCert('');
  };

  const addComment = () => {
    if (!commentText.trim()) return;
    const updatedPost = {
      ...viewPostModal,
      comments: [...(viewPostModal.comments || []), { id: Date.now(), author: currentUser.nickname, text: commentText, createdAt: '방금 전' }]
    };
    setViewPostModal(updatedPost);
    setBoardData(boardData.map(b => b.id === updatedPost.id ? updatedPost : b));
    setCommentText('');
  };

  const deleteComment = (commentId: number) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    const updatedPost = { ...viewPostModal, comments: viewPostModal.comments.filter((c: any) => c.id !== commentId) };
    setViewPostModal(updatedPost);
    setBoardData(boardData.map(b => b.id === updatedPost.id ? updatedPost : b));
  };

  const deleteEvent = (id: number) => {
    setEvents(events.filter(e => e.id !== id));
  };

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

  if (!isAuthenticated) return <AuthScreen onAuthSuccess={(u) => { setCurrentUser(u); setIsAuthenticated(true); }} />;

  return (
    <div className="flex h-screen bg-hp-50 font-sans text-slate-800">
      <aside className="w-64 bg-hp-900 border-r-0 shadow-xl flex flex-col hidden md:flex z-10 relative">
        <div className="p-6 border-b border-hp-800">
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Zap size={28} className="text-hp-600 fill-hp-600" /> HighPass</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-4">
          <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${activeTab === 'calendar' ? 'bg-hp-700 text-white border-l-4 border-hp-300' : 'text-hp-200 hover:bg-hp-800 border-l-4 border-transparent'}`}>
            <CalendarIcon size={20} /> 나의 캘린더
          </button>
          <button onClick={() => setActiveTab('search')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${activeTab === 'search' ? 'bg-hp-700 text-white border-l-4 border-hp-300' : 'text-hp-200 hover:bg-hp-800 border-l-4 border-transparent'}`}>
            <Search size={20} /> 자격증 정보
          </button>
          <div className="pt-5 pb-2"><p className="px-4 text-[10px] font-black text-hp-400 uppercase tracking-widest">Community</p></div>
          <button onClick={() => setActiveTab('study')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${activeTab === 'study' ? 'bg-hp-700 text-white border-l-4 border-hp-300' : 'text-hp-200 hover:bg-hp-800 border-l-4 border-transparent'}`}>
            <Users size={20} /> 스터디 모집
          </button>
          <button onClick={() => setActiveTab('free')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${activeTab === 'free' ? 'bg-hp-700 text-white border-l-4 border-hp-300' : 'text-hp-200 hover:bg-hp-800 border-l-4 border-transparent'}`}>
            <MessageSquare size={20} /> 자유 게시판
          </button>
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${activeTab === 'chat' ? 'bg-hp-700 text-white border-l-4 border-hp-300' : 'text-hp-200 hover:bg-hp-800 border-l-4 border-transparent'}`}>
            <MessageCircle size={20} /> 채팅방
            {chatRooms.length > 0 && <span className="ml-auto text-[10px] bg-hp-600 text-white rounded-full px-1.5 py-0.5 font-bold">{chatRooms.length}</span>}
          </button>
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
          <button onClick={() => { setIsAuthenticated(false); setCurrentUser(null); }} className="p-2.5 text-hp-300 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {activeTab === 'calendar' && (
          <div className="flex flex-col lg:flex-row gap-6 h-full animate-in fade-in duration-500">
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-hp-100 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-800">{currentYear}년 {currentMonth + 1}월</h2>
                  <div className="flex gap-1">
                    <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1.5 hover:bg-hp-50 rounded-lg transition-colors"><ArrowRight size={20} className="rotate-180 text-slate-400" /></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-2 text-xs font-bold text-hp-600 hover:bg-hp-50 rounded-lg">오늘</button>
                    <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1.5 hover:bg-hp-50 rounded-lg transition-colors"><ArrowRight size={20} className="text-slate-400" /></button>
                  </div>
                </div>
                <button onClick={() => { setEventStartDate(''); setEventEndDate(''); setAddEventModalOpen(true); }} className="px-4 py-2 bg-hp-600 hover:bg-hp-700 text-white rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> 일정 추가하기</button>
              </div>
              <div className="grid grid-cols-7 border border-hp-500 rounded-t-xl overflow-hidden bg-hp-600 text-center text-sm font-bold text-white border-b-0">
                <div className="p-2 text-red-300 border-r border-hp-500">일</div>
                <div className="p-2 border-r border-hp-500">월</div>
                <div className="p-2 border-r border-hp-500">화</div>
                <div className="p-2 border-r border-hp-500">수</div>
                <div className="p-2 border-r border-hp-500">목</div>
                <div className="p-2 border-r border-hp-500">금</div>
                <div className="p-2 text-hp-200">토</div>
              </div>
              <div className="grid grid-cols-7 border border-hp-100 rounded-b-xl overflow-hidden flex-1 bg-white">
                {/* 시작 요일까지 빈 칸 채우기 */}
                {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-hp-50 bg-hp-50/30"></div>
                ))}

                {/* 실제 날짜들 */}
                {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                  const crossingEvents = events.filter(e => e.month === currentMonth && day >= e.startDay && day <= e.endDay).sort((a, b) => a.startDay - b.startDay);
                  const colIndex = (new Date(currentYear, currentMonth, 1).getDay() + day - 1) % 7;
                  const isToday = new Date().getFullYear() === currentYear && new Date().getMonth() === currentMonth && new Date().getDate() === day;

                  return (
                    <div key={day} onClick={() => setSelectedDate(day)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverDay(day); }}
                      onDragLeave={() => setDragOverDay(null)}
                      onDrop={(e) => { e.preventDefault(); setDragOverDay(null); setIsDraggingEvent(false); const eventId = e.dataTransfer.getData('eventId'); const sourceDay = parseInt(e.dataTransfer.getData('sourceDay'), 10); if (eventId && !isNaN(sourceDay)) { const diff = day - sourceDay; const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); setEvents(prev => prev.map(ev => { if (ev.id.toString() !== eventId) return ev; const newStart = ev.startDay + diff; const newEnd = ev.endDay + diff; if (newStart < 1 || newEnd > daysInMonth || newStart > newEnd) return ev; return { ...ev, startDay: newStart, endDay: newEnd }; })); } }}
                      className={`min-h-[100px] border-b border-r border-slate-100 cursor-pointer p-0 flex flex-col transition-colors duration-150 ${dragOverDay === day && isDraggingEvent ? 'bg-hp-100 ring-2 ring-inset ring-hp-400' : selectedDate === day ? 'bg-hp-50 relative' : 'hover:bg-hp-50'}`}>
                      {selectedDate === day && <div className="absolute inset-0 border-2 border-hp-500 pointer-events-none"></div>}
                      <div className="p-1.5 flex justify-between items-start z-10">
                        <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-red-500 text-white' : selectedDate === day ? 'bg-hp-600 text-white' : 'text-slate-700'}`}>{day}</span>
                        {todos[day] && todos[day].length > 0 && <div className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-1 ${todos[day].every(t => t.done) ? 'bg-hp-600' : 'bg-slate-300'}`}></div>}
                      </div>
                      <div className="flex-1 flex flex-col gap-[1px] mt-0.5">
                        {crossingEvents.slice(0, 3).map(evt => {
                          const isStart = day === evt.startDay;
                          const isEnd = day === evt.endDay;
                          return (
                            <div key={evt.id} draggable={true}
                              onDragStart={(e) => { e.stopPropagation(); setIsDraggingEvent(true); e.dataTransfer.setData('eventId', evt.id.toString()); e.dataTransfer.setData('sourceDay', day.toString()); e.dataTransfer.effectAllowed = 'move'; }}
                              onDragEnd={() => { setIsDraggingEvent(false); setDragOverDay(null); }}
                              onDragOver={(e) => { e.stopPropagation(); e.preventDefault(); }}
                              className={`h-[26px] ${evt.color} ${!isStart && colIndex !== 0 && '-ml-[1px]'} ${!isEnd && colIndex !== 6 && 'w-[calc(100%+1px)]'} ${isStart || colIndex === 0 ? 'rounded-l-full ml-1' : ''} ${isEnd || colIndex === 6 ? 'rounded-r-full mr-1' : ''} flex items-center relative z-20 cursor-grab active:cursor-grabbing hover:brightness-110 hover:shadow-md active:opacity-70 transition-all select-none`}>
                              {(isStart || colIndex === 0) && <span className="text-[11px] text-white font-bold ml-2 whitespace-nowrap overflow-visible z-10 truncate pointer-events-none drop-shadow-sm">{evt.title}</span>}
                            </div>
                          )
                        })}
                        {crossingEvents.length > 3 && (
                          <div className="text-[10px] text-slate-500 font-bold px-1.5 leading-[18px]">+{crossingEvents.length - 3}개</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Draggable nodeRef={draggableRef} handle=".drag-handle">
              <div ref={draggableRef} className="w-full lg:w-80 bg-white rounded-2xl border border-hp-100 p-5 flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden shadow-2xl z-20">
                <div className="flex justify-between items-center mb-5 drag-handle cursor-move bg-hp-50 -m-5 p-5 border-b border-hp-100">
                  <div className="flex items-center gap-2">
                    <ListIcon size={18} className="text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-800">{currentMonth + 1}월 {selectedDate}일</h3>
                  </div>
                  <span className="text-[10px] text-hp-600 font-bold border border-hp-200 rounded px-2 py-1 bg-hp-50">Focus Mode</span>
                </div>
                <div className="mt-5 flex-1 flex flex-col overflow-hidden">
                  {events.filter(e => e.month === currentMonth && selectedDate >= e.startDay && selectedDate <= e.endDay).map(evt => (
                    <div key={evt.id} className="mb-4 bg-white border border-hp-100 rounded-xl p-4 shadow-sm flex gap-3 group relative overflow-hidden">
                      <div className={`w-1.5 ${evt.color} rounded-full`}></div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 mb-1">포커스 스케줄</p>
                        <p className="font-bold text-sm">{evt.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{evt.startDay}일 ~ {evt.endDay}일</p>
                      </div>
                      <button onClick={() => deleteEvent(evt.id)} className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 opacity-0 group-hover:opacity-100 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <div className="flex-1 overflow-y-auto flex flex-col mt-2">
                    <p className="text-xs font-bold text-slate-500 mb-3">나의 실행 목표 (To-Do)</p>
                    <div className="space-y-2 mb-4 flex-1">
                      {(!todos[selectedDate] || todos[selectedDate].length === 0) ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                          <Zap size={32} className="mb-3" /><p className="text-sm font-medium">비어있습니다.</p>
                        </div>
                      ) : todos[selectedDate].map(todo => (
                        <div key={todo.id} className={`flex items-start gap-3 bg-white p-3.5 rounded-xl border border-hp-100 shadow-sm group ${todo.done ? 'opacity-50' : ''}`}>
                          <button onClick={() => toggleTodo(selectedDate, todo.id)} className="mt-0.5">{todo.done ? <CheckCircle2 size={20} className="text-slate-500" /> : <Circle size={20} className="text-slate-300" />}</button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${todo.done ? 'line-through text-slate-500' : 'font-bold'}`}>{todo.text}</p>
                          </div>
                          <button onClick={() => deleteTodo(selectedDate, todo.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto bg-hp-50 rounded-xl border-2 border-hp-200 flex items-center px-3 focus-within:border-hp-600 shadow-sm">
                      <Plus size={20} className="text-slate-400" />
                      <input ref={inputRef} type="text" value={newTodoText} onChange={e => setNewTodoText(e.target.value)} onKeyDown={handleAddTodo} placeholder="새 목표 입력..." className="w-full py-4 px-2 text-sm outline-none font-bold placeholder:font-normal bg-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            </Draggable>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-hp-100 p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">Q-Net 국가기술자격 시험일정</h2>
              <div className="space-y-4">
                {allItems.map(item => (
                  <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md">
                    <div className="bg-hp-50 border-b border-hp-100 px-5 py-4 flex justify-between items-center">
                      <div><span className="text-xs font-bold bg-hp-100 text-hp-700 px-2 py-1 rounded-full">{item.category}</span><h3 className="font-bold text-lg mt-2">{item.name}</h3></div>
                      {item.category === "시험일정" && (
                        <button onClick={() => setCertModalOpen(item)} className="bg-hp-600 text-white hover:bg-hp-700 py-2 px-5 rounded-lg flex items-center gap-2 font-bold"><CalendarIcon size={16} /> 캘린더에 담기</button>
                      )}
                    </div>
                    <div className="p-5 grid grid-cols-2 text-sm gap-4">
                      {item.category === "시험일정" && <div><p className="text-xs text-slate-500">일정</p><p className="font-bold">{item.startDate} ~ {item.endDate}</p></div>}
                      <div><p className="text-xs text-slate-500">대상</p><p className="font-bold">{item.target}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'study' && (
          <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
            {viewPostModal ? (
              <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10">
                <button onClick={() => setViewPostModal(null)} className="mb-6 text-sm font-bold text-hp-600 hover:text-hp-800 flex items-center gap-1 transition-colors"><ArrowRight size={16} className="rotate-180" /> 목록으로</button>
                <div className="border-b pb-5 mb-5">
                  <div><span className="text-xs font-bold bg-hp-100 text-hp-700 px-2 py-1 rounded-full mr-2">스터디 모집</span><h3 className="font-bold text-2xl md:text-3xl mt-4 leading-tight">{viewPostModal.title}</h3></div>
                  <div className="flex justify-between items-center mt-5 text-sm font-medium text-slate-500">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-slate-800 transition-colors" onClick={() => setProfileModal(viewPostModal.authorId)}><div className="w-8 h-8 bg-hp-100 rounded-full flex items-center justify-center text-hp-600 font-bold">{viewPostModal.author.substring(0, 1)}</div><span className="font-bold text-slate-800">{viewPostModal.author}</span><span>· {viewPostModal.createdAt || '오늘'}</span></div>
                    <div className="flex gap-4"><span className="flex gap-1 items-center"><Eye size={16} />{viewPostModal.views}</span><span className="flex gap-1 items-center"><Heart size={16} />{viewPostModal.likes}</span></div>
                  </div>
                </div>
                <div className="font-mono text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[150px] text-base">{viewPostModal.content || '내용이 없습니다.'}</div>
                {viewPostModal.lat && (
                  <div className="mt-8 border rounded-xl overflow-hidden h-72 relative bg-slate-100 shadow-inner">
                    <KakaoMap apiKey="894423a9ffcffb29a1e5d50427ded82e" markers={[{ lat: viewPostModal.lat, lng: viewPostModal.lng, locationName: viewPostModal.location }]} center={{ lat: viewPostModal.lat, lng: viewPostModal.lng }} level={3} />
                    <div className="absolute top-4 left-4 z-10 bg-white px-3 py-2 rounded-lg shadow-md font-bold text-sm border flex items-center gap-1"><MapPin size={16} className="text-hp-600" />{viewPostModal.location}</div>
                  </div>
                )}
                <div className="border-t border-slate-100 mt-10 pt-8">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><MessageCircle size={20} /> 댓글 <span className="text-hp-600">{viewPostModal.comments?.length || 0}</span></h4>
                  <div className="flex gap-2 mb-8">
                    <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addComment(); }} className="flex-1 border rounded-xl p-3 outline-none font-medium text-sm bg-hp-50 focus:bg-white focus:ring-2 ring-hp-500 transition-all shadow-inner" placeholder="댓글을 남겨주세요." />
                    <button onClick={addComment} className="bg-hp-600 text-white rounded-xl px-6 font-bold hover:bg-hp-700 transition-colors shadow-sm">작성</button>
                  </div>
                  <div className="space-y-4">
                    {viewPostModal.comments?.map((c: any) => (
                      <div key={c.id} className="p-4 rounded-xl bg-hp-50 border border-hp-100 flex gap-3 group">
                        <div className="w-9 h-9 bg-hp-100 rounded-full flex items-center justify-center font-bold text-hp-600 text-xs shrink-0 cursor-pointer" onClick={() => setProfileModal('u' + c.id)}>{c.author.substring(0, 1)}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex gap-2 items-center"><span className="font-bold text-sm cursor-pointer hover:underline text-slate-800" onClick={() => setProfileModal('u' + c.id)}>{c.author}</span><span className="text-[10px] text-slate-400 font-medium">{c.createdAt || '방금 전'}</span></div>
                            {c.author === currentUser.nickname && (
                              <button onClick={(e) => { e.stopPropagation(); deleteComment(c.id); }} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 text-xs flex items-center gap-1 transition-all"><Trash2 size={12} /> 삭제</button>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">스터디 모집</h2>
                    <p className="text-slate-500 mt-1">합격을 위해 단기간 몰입할 동료를 찾아보세요.</p>
                  </div>
                  <button onClick={() => { setWriteType('study'); setWriteModalOpen(true); }} className="bg-hp-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Zap size={16} /> 새 글 쓰기</button>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <select value={certFilter} onChange={e => setCertFilter(e.target.value)} className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500 appearance-none bg-white">
                    <option value="">전체 자격증</option>
                    {Object.entries(CERT_DATA).map(([cat, certs]) => (
                      <optgroup key={cat} label={cat}>
                        {certs.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <select value={locationFilterSido} onChange={e => { setLocationFilterSido(e.target.value); setLocationFilterSigungu(''); }} className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500 appearance-none bg-white">
                    <option value="">전체 지역</option>
                    {Object.keys(REGION_DATA).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={locationFilterSigungu} onChange={e => setLocationFilterSigungu(e.target.value)} disabled={!locationFilterSido} className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500 appearance-none bg-white disabled:opacity-40">
                    <option value="">전체 군/구</option>
                    {(REGION_DATA[locationFilterSido] || []).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {(certFilter || locationFilterSido) && (
                    <button onClick={() => { setCertFilter(''); setLocationFilterSido(''); setLocationFilterSigungu(''); }} className="flex items-center gap-1 text-xs text-slate-500 border rounded-xl px-3 py-2 hover:bg-slate-50">
                      <X size={12} /> 필터 초기화
                    </button>
                  )}
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-hp-100 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {boardData.filter(d => {
                      if (d.type !== 'study') return false;
                      if (certFilter && d.cert !== certFilter) return false;
                      if (locationFilterSigungu && !d.location?.includes(locationFilterSigungu)) return false;
                      else if (locationFilterSido && !locationFilterSigungu && !d.location?.includes(locationFilterSido)) return false;
                      return true;
                    }).map((post) => (
                      <div key={post.id} className="p-5 hover:bg-hp-50 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4" onClick={() => setViewPostModal(post)}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold bg-hp-100 text-hp-700 px-2 py-0.5 rounded flex items-center gap-1"><MapPin size={12} />{post.location}</span>
                            {post.cert && <span className="text-xs font-bold bg-hp-100 text-hp-700 px-2 py-0.5 rounded">{post.cert}</span>}
                          </div>
                          <h3 className="text-lg font-bold mb-2">{post.title}</h3>
                          <div className="text-xs text-slate-500 font-medium cursor-pointer hover:text-slate-800 inline-block" onClick={(e) => { e.stopPropagation(); setProfileModal(post.authorId); }}>{post.author} · {post.createdAt || '오늘'}</div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex gap-1"><Eye size={16} />{post.views}</div>
                          <div className="flex gap-1"><Heart size={16} />{post.likes}</div>
                          <div className="flex gap-1"><MessageCircle size={16} />{post.comments?.length || 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'free' && (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
            {viewPostModal ? (
              /* ── X 스타일 스레드 상세 ── */
              <div className="bg-white border-x border-b rounded-b-2xl overflow-hidden">
                {/* 헤더 */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-4 z-10">
                  <button onClick={() => setViewPostModal(null)} className="hover:bg-slate-100 p-2 rounded-full transition-colors"><ArrowRight size={20} className="rotate-180" /></button>
                  <span className="font-bold text-lg">게시글</span>
                </div>
                {/* 원본 포스트 */}
                <div className="px-4 pt-4 pb-3 border-b">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 bg-hp-500 rounded-full flex items-center justify-center font-bold text-white shrink-0 cursor-pointer" onClick={() => setProfileModal(viewPostModal.authorId)}>
                      {viewPostModal.author.substring(0, 1)}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight cursor-pointer hover:underline" onClick={() => setProfileModal(viewPostModal.authorId)}>{viewPostModal.author}</p>
                      <p className="text-slate-400 text-xs">@{viewPostModal.author.toLowerCase().replace(/\s/g, '_')}</p>
                    </div>
                  </div>
                  {viewPostModal.title && <p className="font-bold text-base mb-1">{viewPostModal.title}</p>}
                  <p className="text-slate-900 text-base leading-relaxed whitespace-pre-wrap mb-4">{viewPostModal.content}</p>
                  <p className="text-slate-400 text-sm mb-4">{viewPostModal.createdAt || '오늘'} · <span className="font-bold text-slate-700">{viewPostModal.views}</span> 조회</p>
                  <div className="border-t border-b py-3 flex gap-6 text-slate-500 text-sm">
                    <span><span className="font-bold text-slate-900">{viewPostModal.comments?.length || 0}</span> 답글</span>
                    <span><span className="font-bold text-slate-900">{viewPostModal.likes}</span> 좋아요</span>
                    <span><span className="font-bold text-slate-900">{viewPostModal.scraps || 0}</span> 북마크</span>
                  </div>
                  {/* 액션 바 */}
                  <div className="flex justify-around pt-1 text-slate-400">
                    <button className="flex items-center gap-1.5 hover:text-hp-500 p-2 rounded-full hover:bg-hp-50 transition-colors text-sm"><MessageCircle size={20} /></button>
                    <button className="flex items-center gap-1.5 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors text-sm"><Heart size={20} /></button>
                    <button className="flex items-center gap-1.5 hover:text-hp-500 p-2 rounded-full hover:bg-hp-50 transition-colors text-sm"><Bookmark size={20} /></button>
                    <button className="flex items-center gap-1.5 hover:text-green-500 p-2 rounded-full hover:bg-green-50 transition-colors text-sm"><Eye size={20} /></button>
                  </div>
                </div>
                {/* 답글 입력 */}
                <div className="px-4 py-3 border-b flex gap-3 items-start">
                  <div className="w-9 h-9 bg-hp-600 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm">{currentUser.nickname.substring(0, 1)}</div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addComment(); }}
                      className="flex-1 outline-none text-sm py-2 text-slate-800 placeholder:text-slate-400 bg-transparent border-b border-slate-200 focus:border-hp-400 transition-colors"
                      placeholder="답글 남기기..."
                    />
                    <button onClick={addComment} className="bg-hp-600 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-hp-700 transition-colors self-end">답글</button>
                  </div>
                </div>
                {/* 댓글 목록 */}
                <div className="divide-y divide-slate-100">
                  {(viewPostModal.comments?.length === 0 || !viewPostModal.comments) ? (
                    <div className="py-12 text-center text-slate-400 text-sm">아직 답글이 없습니다.</div>
                  ) : viewPostModal.comments?.map((c: any) => (
                    <div key={c.id} className="px-4 py-3 flex gap-3 hover:bg-hp-50 transition-colors group">
                      <div className="w-9 h-9 bg-hp-100 rounded-full flex items-center justify-center font-bold text-hp-600 text-xs shrink-0 cursor-pointer" onClick={() => setProfileModal('u' + c.id)}>{c.author.substring(0, 1)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm cursor-pointer hover:underline" onClick={() => setProfileModal('u' + c.id)}>{c.author}</span>
                            <span className="text-slate-400 text-xs">· {c.createdAt || '방금 전'}</span>
                          </div>
                          {c.author === currentUser.nickname && (
                            <button onClick={(e) => { e.stopPropagation(); deleteComment(c.id); }} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                          )}
                        </div>
                        <p className="text-sm text-slate-800 leading-relaxed">{c.text}</p>
                        <div className="flex gap-4 mt-2 text-slate-400">
                          <button className="hover:text-red-500 transition-colors flex items-center gap-1 text-xs"><Heart size={14} /></button>
                          <button className="hover:text-hp-500 transition-colors flex items-center gap-1 text-xs"><MessageCircle size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ── X 스타일 피드 목록 ── */
              <div className="bg-white border-x rounded-2xl overflow-hidden shadow-sm">
                {/* 상단 헤더 */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b px-4 py-3 z-10">
                  <h2 className="font-bold text-xl">자유게시판</h2>
                </div>
                {/* 글쓰기 컴포즈 */}
                <div className="border-b px-4 py-3 flex justify-end">
                  <button onClick={() => { setWriteType('free'); setWriteModalOpen(true); }} className="bg-hp-600 text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-hp-700 transition-colors">
                    글쓰기
                  </button>
                </div>
                {/* 피드 */}
                <div className="divide-y divide-slate-100">
                  {boardData.filter(d => d.type === 'free').length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-sm">아직 게시글이 없습니다.<br />첫 번째 글을 작성해보세요!</div>
                  ) : boardData.filter(d => d.type === 'free').map((post) => (
                    <div key={post.id} className="px-4 py-3 hover:bg-hp-50 cursor-pointer flex gap-3 transition-colors" onClick={() => setViewPostModal(post)}>
                      {/* 아바타 */}
                      <div
                        className="w-10 h-10 bg-hp-100 rounded-full flex items-center justify-center font-bold text-hp-600 shrink-0 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setProfileModal(post.authorId); }}
                      >
                        {post.author.substring(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* 이름 + 시간 */}
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="font-bold text-sm cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); setProfileModal(post.authorId); }}>{post.author}</span>
                          <span className="text-slate-400 text-sm">@{post.author.toLowerCase().replace(/\s/g, '_')}</span>
                          <span className="text-slate-400 text-sm">· {post.createdAt || '오늘'}</span>
                        </div>
                        {/* 제목 (있을 경우) */}
                        {post.title && <p className="font-bold text-sm text-slate-900 mb-0.5">{post.title}</p>}
                        {/* 본문 미리보기 */}
                        <p className="text-sm text-slate-800 leading-relaxed line-clamp-3 mb-3">{post.content}</p>
                        {/* 액션 바 */}
                        <div className="flex gap-5 text-slate-400 text-sm -ml-1">
                          <button className="flex items-center gap-1.5 hover:text-hp-500 p-1 rounded-full hover:bg-hp-50 transition-colors" onClick={(e) => e.stopPropagation()}>
                            <MessageCircle size={16} /><span className="text-xs">{post.comments?.length || 0}</span>
                          </button>
                          <button className="flex items-center gap-1.5 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors" onClick={(e) => e.stopPropagation()}>
                            <Heart size={16} /><span className="text-xs">{post.likes}</span>
                          </button>
                          <button className="flex items-center gap-1.5 hover:text-hp-500 p-1 rounded-full hover:bg-hp-50 transition-colors" onClick={(e) => e.stopPropagation()}>
                            <Bookmark size={16} /><span className="text-xs">{post.scraps || 0}</span>
                          </button>
                          <span className="flex items-center gap-1.5 p-1">
                            <Eye size={16} /><span className="text-xs">{post.views}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-5xl mx-auto h-full animate-in fade-in duration-500 flex flex-col">
            <h2 className="text-2xl font-bold mb-6">채팅방</h2>
            {chatRooms.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border flex-1 flex flex-col items-center justify-center text-center p-12">
                <MessageCircle size={52} className="text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold text-lg">채팅방이 없습니다</p>
                <p className="text-slate-400 text-sm mt-1">스터디 모집 또는 게시글의 작성자 프로필에서<br />1:1 채팅하기를 눌러 대화를 시작하세요.</p>
              </div>
            ) : (
              <div className="flex gap-4" style={{ height: 'calc(100vh - 11rem)' }}>
                <div className="w-72 bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col shrink-0">
                  <div className="p-4 border-b"><p className="font-bold text-slate-800">대화 목록</p></div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                    {chatRooms.map(room => (
                      <button key={room.id} onClick={() => setActiveChatRoomId(room.id)}
                        className={`w-full p-4 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors ${activeChatRoomId === room.id ? 'bg-hp-50' : ''}`}>
                        <div className="w-10 h-10 bg-hp-100 rounded-full flex items-center justify-center text-hp-600 font-bold text-sm shrink-0">
                          {room.partnerNickname.substring(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-800 truncate">{room.partnerNickname}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {room.messages.length > 0 ? room.messages[room.messages.length - 1].text : '대화를 시작해보세요'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {activeChatRoomId ? (() => {
                  const room = chatRooms.find(r => r.id === activeChatRoomId);
                  if (!room) return null;
                  return (
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
                      <div className="p-4 border-b flex items-center gap-3">
                        <div className="w-9 h-9 bg-hp-100 rounded-full flex items-center justify-center text-hp-600 font-bold text-sm">
                          {room.partnerNickname.substring(0, 1)}
                        </div>
                        <p className="font-bold text-slate-800">{room.partnerNickname}</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                        {room.messages.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">첫 메시지를 보내보세요</div>
                        ) : room.messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-hp-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                              <p>{msg.text}</p>
                              <p className={`text-[10px] mt-1 ${msg.senderId === currentUser.id ? 'text-hp-200' : 'text-slate-400'}`}>{msg.createdAt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 border-t flex gap-2">
                        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && chatInput.trim()) { const msg = { id: Date.now(), senderId: currentUser.id, text: chatInput.trim(), createdAt: new Date().toTimeString().slice(0, 5) }; setChatRooms(prev => prev.map(r => r.id === activeChatRoomId ? { ...r, messages: [...r.messages, msg] } : r)); setChatInput(''); } }}
                          placeholder="메시지를 입력하세요..." className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-hp-500" />
                        <button onClick={() => { if (!chatInput.trim()) return; const msg = { id: Date.now(), senderId: currentUser.id, text: chatInput.trim(), createdAt: new Date().toTimeString().slice(0, 5) }; setChatRooms(prev => prev.map(r => r.id === activeChatRoomId ? { ...r, messages: [...r.messages, msg] } : r)); setChatInput(''); }}
                          className="px-4 py-2.5 bg-hp-600 text-white rounded-xl font-bold hover:bg-hp-700 transition-colors">
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="flex-1 bg-white rounded-2xl shadow-sm border flex items-center justify-center text-slate-400 text-sm">채팅방을 선택해주세요</div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- INLINE MODALS (To prevent focus loss) --- */}
      {addEventModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b"><h3 className="font-bold text-lg">일정 추가하기</h3><button onClick={() => setAddEventModalOpen(false)}><X size={20} /></button></div>
            <div className="p-5 space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 mb-1">일정 제목</label><input type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-hp-500" /></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">시작일</label><input type="date" value={eventStartDate} onChange={e => { setEventStartDate(e.target.value); if (!eventEndDate) setEventEndDate(e.target.value); }} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-hp-500" /></div>
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">종료일</label><input type="date" value={eventEndDate} min={eventStartDate} onChange={e => setEventEndDate(e.target.value)} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-hp-500" /></div>
              </div>
            </div>
            <div className="p-4 bg-hp-50 border-t flex justify-end gap-2">
              <button onClick={() => setAddEventModalOpen(false)} className="px-4 py-2 rounded-lg bg-hp-50 text-hp-700 border border-hp-200 hover:bg-hp-100">취소</button>
              <button onClick={() => {
                if (!eventTitle || !eventStartDate || !eventEndDate) return;
                const [sy, sm, sd] = eventStartDate.split('-').map(Number);
                const [, , ed] = eventEndDate.split('-').map(Number);
                setEvents([...events, { id: Date.now(), title: eventTitle, month: sm - 1, startDay: sd, endDay: ed, color: 'bg-orange-500' }]);
                setCurrentDate(new Date(sy, sm - 1, 1));
                setAddEventModalOpen(false); setEventTitle(''); setEventStartDate(''); setEventEndDate('');
              }} className="px-4 py-2 rounded-lg bg-hp-600 text-white">저장</button>
            </div>
          </div>
        </div>
      )}

      {certModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col align-middle justify-center">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="font-bold flex flex-col"><span className="text-xs text-slate-400 font-normal">[{certModalOpen.name}]</span>캘린더에 추가하기</h3>
              <button onClick={() => { setCertModalOpen(null); setCertModalCertCat(''); setCertModalCert(''); }}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <label className="font-bold text-sm text-hp-700 block">자격증 선택</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={certModalCertCat}
                  onChange={e => { setCertModalCertCat(e.target.value); setCertModalCert(''); }}
                  className="border rounded-lg p-2 text-sm outline-none focus:border-hp-500 appearance-none"
                >
                  <option value="">카테고리</option>
                  {Object.keys(CERT_DATA).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select
                  value={certModalCert}
                  onChange={e => setCertModalCert(e.target.value)}
                  disabled={!certModalCertCat}
                  className="border rounded-lg p-2 text-sm outline-none focus:border-hp-500 appearance-none disabled:opacity-40"
                >
                  <option value="">자격증 선택</option>
                  {(CERT_DATA[certModalCertCat] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label className="font-bold text-sm text-hp-700 block">시험 일자 선택</label>
              <p className="text-xs text-slate-400">시험 기간: {certModalOpen.startDate} ~ {certModalOpen.endDate}</p>
              <input
                type="date"
                id="certDate"
                min={certModalOpen.startDate}
                max={certModalOpen.endDate}
                defaultValue={certModalOpen.startDate}
                className="border rounded-lg p-2 w-full text-sm outline-none focus:border-hp-500"
              />
              <button className="w-full mt-4 bg-hp-600 text-white font-bold p-3 rounded-lg" onClick={() => {
                const dateStr = (document.getElementById('certDate') as HTMLInputElement).value;
                if (!dateStr) return;
                const [year, month, day] = dateStr.split('-').map(Number);
                const title = certModalCert || certModalOpen.name;
                setCurrentDate(new Date(year, month - 1, 1));
                setEvents([...events, { id: Date.now(), title, month: month - 1, startDay: day, endDay: day, color: 'bg-green-500' }]);
                setCertModalOpen(null); setCertModalCertCat(''); setCertModalCert('');
                setActiveTab('calendar');
              }}>일정 확정 및 추가</button>
            </div>
          </div>
        </div>
      )}

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
                        <button type="button" key={ag} onClick={() => setEditAgeGroup(ag)}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${editAgeGroup === ag ? 'bg-hp-600 text-white' : 'bg-white border border-hp-200 text-slate-500 hover:border-hp-400'}`}>
                          {ag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">성별</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['남성', '여성', '기타'].map(g => (
                        <button type="button" key={g} onClick={() => setEditGender(g)}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${editGender === g ? 'bg-hp-600 text-white' : 'bg-white border border-hp-200 text-slate-500 hover:border-hp-400'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">지역</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editSido}
                        onChange={e => { setEditSido(e.target.value); setEditSigungu(''); setEditLocation(e.target.value); }}
                        className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500 appearance-none"
                      >
                        <option value="">시/도 선택</option>
                        {Object.keys(REGION_DATA).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select
                        value={editSigungu}
                        onChange={e => { setEditSigungu(e.target.value); setEditLocation(`${editSido} ${e.target.value}`); }}
                        disabled={!editSido}
                        className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500 appearance-none disabled:opacity-40"
                      >
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
                      const existing = chatRooms.find(r => r.partnerId === profileModal);
                      if (existing) {
                        setActiveChatRoomId(existing.id);
                      } else {
                        const newRoom = { id: `chat_${Date.now()}`, partnerId: profileModal, partnerNickname, messages: [] };
                        setChatRooms(prev => [...prev, newRoom]);
                        setActiveChatRoomId(newRoom.id);
                      }
                      setProfileModal(null);
                      setEditProfileOpen(false);
                      setActiveTab('chat');
                    }} className="w-full mt-6 bg-hp-600 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2"><MessageSquare size={18} /> 1:1 채팅하기</button>
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {writeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b"><h3 className="font-bold text-xl">HighPass 새 글 쓰기</h3><button onClick={() => setWriteModalOpen(false)}><X size={24} /></button></div>
            <div className="p-5 overflow-y-auto flex-1">
              <label className="block text-sm font-bold mb-1">게시판 선택</label>
              <select value={writeType} onChange={e => setWriteType(e.target.value as any)} className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-hp-500 font-medium"><option value="study">스터디 모집</option><option value="free">자유 게시판</option></select>
              {writeType === 'study' && (
                <>
                  <label className="block text-sm font-bold mb-1">자격증 선택</label>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <select
                      value={postCertCategory}
                      onChange={e => { setPostCertCategory(e.target.value); setPostCert(''); }}
                      className="border p-3 rounded-lg outline-none focus:border-hp-500 font-medium appearance-none"
                    >
                      <option value="">카테고리 선택</option>
                      {Object.keys(CERT_DATA).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select
                      value={postCert}
                      onChange={e => setPostCert(e.target.value)}
                      disabled={!postCertCategory}
                      className="border p-3 rounded-lg outline-none focus:border-hp-500 font-medium appearance-none disabled:opacity-40"
                    >
                      <option value="">자격증 선택</option>
                      {(CERT_DATA[postCertCategory] || []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
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
                      <div className="w-full md:w-1/2 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {searchResults.map(res => (
                          <div key={res.id} onClick={() => setSelectedPlace(res)} className={`p-4 rounded-xl text-sm cursor-pointer border transition-all ${selectedPlace?.id === res.id ? 'bg-slate-800 border-hp-500 ring-1 ring-hp-500' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'}`}>
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-base truncate">{res.name}</h4>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-yellow-400 font-bold text-xs">4.0 ★</span><span className="text-slate-500 text-xs">· {res.category || '장소'}</span>
                            </div>
                            <p className="text-slate-400 text-xs mb-1 truncate">{res.address}</p>
                            {res.phone && <p className="text-slate-500 text-xs font-mono">{res.phone}</p>}
                          </div>
                        ))}
                      </div>
                      <div className="w-full md:w-1/2 h-full rounded-xl overflow-hidden shadow-inner border border-slate-700 bg-slate-800 flex items-center justify-center">
                        {loadingKakao ? (
                          <div className="text-slate-500 flex flex-col items-center gap-2"><Loader2 className="animate-spin" /> 지도 로딩 중...</div>
                        ) : errorKakao ? (
                          <div className="text-red-400 text-xs p-4 text-center">지도 로드 실패<br />도메인 등록을 확인해 주세요.</div>
                        ) : (
                          <KakaoMap
                            apiKey="894423a9ffcffb29a1e5d50427ded82e"
                            markers={searchResults.map(r => ({ lat: r.lat, lng: r.lng, locationName: r.name }))}
                            center={selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lng } : { lat: searchResults[0].lat, lng: searchResults[0].lng }}
                            level={4}
                          />
                        )}
                      </div>

                    </div>
                  )}
                  {selectedPlace && <div className="mt-4 p-3 bg-hp-900/30 border border-hp-800/50 rounded-lg flex items-center justify-between"><p className="text-sm text-hp-300 font-bold">📍 선택된 확정 장소: {selectedPlace.name}</p></div>}
                </div>
              )}
            </div>
            <div className="p-5 border-t flex justify-end gap-3 bg-hp-50"><button onClick={() => { setWriteModalOpen(false); setPostTitle(''); setPostContent(''); setSelectedPlace(null); setSearchKeyword(''); setSearchResults([]); }} className="px-5 py-2.5 rounded-lg bg-hp-50 text-hp-700 border border-hp-200 font-bold">취소</button><button onClick={submitPost} className="px-5 py-2.5 rounded-lg bg-hp-600 text-white font-bold">등록하기</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

const CERT_DATA: Record<string, string[]> = {
  '기사': ['정보처리기사','전기기사','건축기사','토목기사','기계기사','화학기사','소방설비기사(전기)','소방설비기사(기계)','산업안전기사','식품기사','환경기사','전자기사','대기환경기사','수질환경기사','컴퓨터시스템응용기사','조경기사','측량및지형공간정보기사'],
  '기능사': ['정보처리기능사','전기기능사','전자기기기능사','용접기능사','제과기능사','제빵기능사','한식조리기능사','양식조리기능사','일식조리기능사','중식조리기능사','미용사(일반)','미용사(피부)','미용사(네일)','지게차운전기능사','굴삭기운전기능사'],
  '산업기사': ['정보처리산업기사','전기산업기사','소방설비산업기사(전기)','소방설비산업기사(기계)','산업안전산업기사','기계설계산업기사','화학분석산업기사','환경산업기사'],
  // '기술사': ['정보관리기술사','컴퓨터시스템응용기술사','건축구조기술사','토목시공기술사','전기응용기술사','화공기술사','소방기술사'],
  // '전문자격': ['공인중개사','공인노무사','행정사','사회복지사(1급)','임상심리사','영양사','세무사','공인회계사(CPA)','변리사','감정평가사','보험계리사'],
  // 'IT/SW': ['SQLD','SQLP','ADsP','빅데이터분석기사','정보보안기사','네트워크관리사','리눅스마스터(1급)','컴퓨터활용능력(1급)','컴퓨터활용능력(2급)','AWS Solutions Architect','정보보안산업기사'],
  // '어학': ['TOEIC','TOEFL','IELTS','OPIc','JLPT N1','JLPT N2','JLPT N3','HSK 5급','HSK 6급','SNSAT'],
};

const REGION_DATA: Record<string, string[]> = {
  '서울': ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'],
  '부산': ['강서구','금정구','기장군','남구','동구','동래구','부산진구','북구','사상구','사하구','서구','수영구','연제구','영도구','중구','해운대구'],
  '대구': ['군위군','남구','달서구','달성군','동구','북구','서구','수성구','중구'],
  '인천': ['강화군','계양구','남동구','동구','미추홀구','부평구','서구','연수구','옹진군','중구'],
  '광주': ['광산구','남구','동구','북구','서구'],
  '대전': ['대덕구','동구','서구','유성구','중구'],
  '울산': ['남구','동구','북구','울주군','중구'],
  '세종': ['세종시'],
  '경기': ['가평군','고양시 덕양구','고양시 일산동구','고양시 일산서구','과천시','광명시','광주시','구리시','군포시','김포시','남양주시','동두천시','부천시','성남시 분당구','성남시 수정구','성남시 중원구','수원시 권선구','수원시 영통구','수원시 장안구','수원시 팔달구','시흥시','안산시 단원구','안산시 상록구','안성시','안양시 동안구','안양시 만안구','양주시','양평군','여주시','연천군','오산시','용인시 기흥구','용인시 수지구','용인시 처인구','의왕시','의정부시','이천시','파주시','평택시','포천시','하남시','화성시'],
  '강원': ['강릉시','고성군','동해시','삼척시','속초시','양구군','양양군','영월군','원주시','인제군','정선군','철원군','춘천시','태백시','평창군','홍천군','화천군','횡성군'],
  '충북': ['괴산군','단양군','보은군','영동군','옥천군','음성군','제천시','증평군','진천군','청주시 상당구','청주시 서원구','청주시 청원구','청주시 흥덕구','충주시'],
  '충남': ['계룡시','공주시','금산군','논산시','당진시','보령시','부여군','서산시','서천군','아산시','예산군','천안시 동남구','천안시 서북구','청양군','태안군','홍성군'],
  '전북': ['고창군','군산시','김제시','남원시','무주군','부안군','순창군','완주군','익산시','임실군','장수군','전주시 덕진구','전주시 완산구','정읍시','진안군'],
  '전남': ['강진군','고흥군','곡성군','광양시','구례군','나주시','담양군','목포시','무안군','보성군','순천시','신안군','여수시','영광군','영암군','완도군','장성군','장흥군','진도군','함평군','해남군','화순군'],
  '경북': ['경산시','경주시','고령군','구미시','군위군','김천시','문경시','봉화군','상주시','성주군','안동시','영덕군','영양군','영주시','영천시','예천군','울릉군','울진군','의성군','청도군','청송군','칠곡군','포항시 남구','포항시 북구'],
  '경남': ['거제시','거창군','고성군','김해시','남해군','밀양시','사천시','산청군','양산시','의령군','창녕군','창원시 마산합포구','창원시 마산회원구','창원시 성산구','창원시 의창구','창원시 진해구','통영시','하동군','함안군','함양군','합천군'],
  '제주': ['서귀포시','제주시'],
};

// 로그인 화면
const AuthScreen = ({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState(''); const [location, setLocation] = useState('');
  const [sido, setSido] = useState(''); const [sigungu, setSigungu] = useState('');
  const [ageGroup, setAgeGroup] = useState(''); const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    setTimeout(() => {
      if (isLoginMode) {
        const u = initialUsers.find(x => x.email === email && x.password === password);
        if (u) { onAuthSuccess(u); } else { setError('계정 불일치'); setLoading(false); }
      } else {
        const newUser = { id: `u${Date.now()}`, email, password, nickname, name: '신규', ageGroup: ageGroup || '비공개', gender: gender || '비공개', location: location || '지역 미상' };
        initialUsers.push(newUser); onAuthSuccess(newUser);
      }
    }, 800);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-hp-900 via-hp-800 to-hp-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8">
        <h1 className="text-3xl font-black text-hp-900 text-center mb-6"><Zap size={32} className="inline text-hp-600 fill-hp-600 mb-1" /> HighPass</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일" className="w-full bg-hp-50 border border-hp-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-hp-500" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호" className="w-full bg-hp-50 border border-hp-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-hp-500" />
          {!isLoginMode && (
            <>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="별명" className="w-full bg-hp-50 border border-hp-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-hp-500" />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={sido}
                  onChange={e => { setSido(e.target.value); setSigungu(''); setLocation(e.target.value); }}
                  className="bg-hp-50 border border-hp-200 rounded-xl px-3 py-3 text-slate-800 outline-none focus:border-hp-500 appearance-none"
                >
                  <option value="">시/도 선택</option>
                  {Object.keys(REGION_DATA).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={sigungu}
                  onChange={e => { setSigungu(e.target.value); setLocation(`${sido} ${e.target.value}`); }}
                  disabled={!sido}
                  className="bg-hp-50 border border-hp-200 rounded-xl px-3 py-3 text-slate-800 outline-none focus:border-hp-500 appearance-none disabled:opacity-40"
                >
                  <option value="">군/구 선택</option>
                  {(REGION_DATA[sido] || []).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-2">연령대</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {['10대', '20대', '30대', '40대', '50대+'].map(ag => (
                    <button type="button" key={ag} onClick={() => setAgeGroup(ag)}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${ageGroup === ag ? 'bg-hp-600 text-white' : 'bg-white border border-hp-200 text-slate-600 hover:border-hp-400'}`}>
                      {ag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-2">성별</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {['남성', '여성', '기타'].map(g => (
                    <button type="button" key={g} onClick={() => setGender(g)}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${gender === g ? 'bg-hp-600 text-white' : 'bg-white border border-hp-200 text-slate-600 hover:border-hp-400'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {error && <p className="text-red-500">{error}</p>}
          <button type="submit" className="w-full bg-hp-600 text-white font-bold py-3.5 rounded-xl">{loading ? '...' : (isLoginMode ? '로그인' : '가입하기')}</button>
        </form>
        {isLoginMode && (
          <div className="mt-6">
            <div className="relative flex items-center py-2 mb-4">
              <div className="flex-grow border-t border-hp-200"></div>
              <span className="flex-shrink-0 mx-4 text-hp-400 text-xs font-medium">소셜 간편 로그인</span>
              <div className="flex-grow border-t border-hp-200"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onAuthSuccess({ id: `oauth_${Date.now()}`, email: `user@google.com`, password: '', nickname: `Google유저`, name: '간편로그인', ageGroup: '20대', gender: '비공개', location: 'Busan' })} className="flex items-center justify-center gap-2 bg-white text-slate-800 hover:bg-hp-50 border border-hp-100 font-bold py-2.5 rounded-xl text-sm transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Google
              </button>
              <button onClick={() => onAuthSuccess({ id: `oauth_${Date.now()}`, email: `user@kakao.com`, password: '', nickname: `Kakao유저`, name: '간편로그인', ageGroup: '20대', gender: '비공개', location: 'SEOUL' })} className="flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FDD800] text-black font-bold py-2.5 rounded-xl text-sm transition-colors">
                <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-1.52 5.44c-.16.48.32.88.72.64l6.32-4.24c.48.08 1.04.08 1.52.08 6.96 0 12.64-4.48 12.64-10.08S22.96 4.64 16 4.64z" /></svg>
                카카오
              </button>
            </div>
          </div>
        )}
        <button onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} className="w-full text-hp-400 hover:text-hp-600 mt-5 text-sm">{isLoginMode ? '회원가입' : '로그인으로 돌아가기'}</button>
      </div>
    </div>
  );
};
