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
  const [loadingKakao] = useKakaoLoader({
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

  const [events, setEvents] = useState<{ id: number, title: string, startDay: number, endDay: number, color: string }[]>([
    { id: 101, title: '정보처리기사 1회 필기 접수', startDay: 15, endDay: 18, color: 'bg-blue-500' }
  ]);

  const [newTodoText, setNewTodoText] = useState('');
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [writeType, setWriteType] = useState<'study' | 'free'>('study');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<{ id: string, name: string, category?: string, phone?: string, lat: number, lng: number } | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [boardData, setBoardData] = useState<any[]>(initialBoardData);

  const [addEventModalOpen, setAddEventModalOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editAgeGroup, setEditAgeGroup] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const [chatRooms, setChatRooms] = useState<{ id: string; partnerId: string; partnerNickname: string; messages: { id: number; senderId: string; text: string; createdAt: string }[] }[]>([]);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [viewPostModal, setViewPostModal] = useState<any>(null);
  const [commentText, setCommentText] = useState('');

  const [eventTitle, setEventTitle] = useState('');
  const [eventStartDay, setEventStartDay] = useState(1);
  const [eventEndDay, setEventEndDay] = useState(1);

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
      views: 0, likes: 0, scraps: 0, comments: [], authorId: currentUser.id, createdAt: '방금 전'
    };
    setBoardData([newPost, ...boardData]);
    setWriteModalOpen(false);
    setPostTitle(''); setPostContent(''); setSelectedPlace(null); setSearchKeyword(''); setSearchResults([]);
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
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex z-10 relative">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Zap size={28} className="text-blue-600 fill-blue-600" /> HighPass</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-4">
          <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${activeTab === 'calendar' ? 'bg-slate-100 text-slate-900 border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 border-l-4 border-transparent'}`}>
            <CalendarIcon size={20} /> 나의 캘린더
          </button>
          <button onClick={() => setActiveTab('search')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${activeTab === 'search' ? 'bg-slate-100 text-slate-900 border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 border-l-4 border-transparent'}`}>
            <Search size={20} /> 자격증 정보
          </button>
          <div className="pt-5 pb-2"><p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Community</p></div>
          <button onClick={() => setActiveTab('study')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${activeTab === 'study' ? 'bg-slate-100 text-slate-900 border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 border-l-4 border-transparent'}`}>
            <Users size={20} /> 스터디 모집
          </button>
          <button onClick={() => setActiveTab('free')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${activeTab === 'free' ? 'bg-slate-100 text-slate-900 border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 border-l-4 border-transparent'}`}>
            <MessageSquare size={20} /> 자유 게시판
          </button>
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-colors ${activeTab === 'chat' ? 'bg-slate-100 text-slate-900 border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 border-l-4 border-transparent'}`}>
            <MessageCircle size={20} /> 채팅방
            {chatRooms.length > 0 && <span className="ml-auto text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-bold">{chatRooms.length}</span>}
          </button>
        </nav>
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-white rounded-lg flex-1" onClick={() => setProfileModal(currentUser.id)}>
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white">
              {currentUser.nickname.substring(0, 1)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{currentUser.nickname}</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser.location}</p>
            </div>
          </div>
          <button onClick={() => { setIsAuthenticated(false); setCurrentUser(null); }} className="p-2.5 text-slate-400 hover:text-red-500">
            <X size={16} />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {activeTab === 'calendar' && (
          <div className="flex flex-col lg:flex-row gap-6 h-full animate-in fade-in duration-500">
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-800">{currentYear}년 {currentMonth + 1}월</h2>
                  <div className="flex gap-1">
                    <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ArrowRight size={20} className="rotate-180 text-slate-400" /></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg">오늘</button>
                    <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ArrowRight size={20} className="text-slate-400" /></button>
                  </div>
                </div>
                <button onClick={() => setAddEventModalOpen(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> 일정 추가하기</button>
              </div>
              <div className="grid grid-cols-7 border border-slate-200 rounded-t-xl overflow-hidden bg-slate-50 text-center text-sm font-bold text-slate-500 border-b-0">
                <div className="p-2 text-red-500 border-r border-slate-200">일</div>
                <div className="p-2 border-r border-slate-200">월</div>
                <div className="p-2 border-r border-slate-200">화</div>
                <div className="p-2 border-r border-slate-200">수</div>
                <div className="p-2 border-r border-slate-200">목</div>
                <div className="p-2 border-r border-slate-200">금</div>
                <div className="p-2 text-blue-500">토</div>
              </div>
              <div className="grid grid-cols-7 border border-slate-200 rounded-b-xl overflow-hidden flex-1 bg-white">
                {/* 시작 요일까지 빈 칸 채우기 */}
                {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-slate-50 bg-slate-50/30"></div>
                ))}

                {/* 실제 날짜들 */}
                {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                  const crossingEvents = events.filter(e => day >= e.startDay && day <= e.endDay).sort((a, b) => a.startDay - b.startDay);
                  const colIndex = (new Date(currentYear, currentMonth, 1).getDay() + day - 1) % 7;
                  const isToday = new Date().getFullYear() === currentYear && new Date().getMonth() === currentMonth && new Date().getDate() === day;

                  return (
                    <div key={day} onClick={() => setSelectedDate(day)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const eventId = e.dataTransfer.getData('eventId'); const sourceDay = parseInt(e.dataTransfer.getData('sourceDay'), 10); if (eventId && !isNaN(sourceDay)) { const diff = day - sourceDay; const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); setEvents(prev => prev.map(ev => { if (ev.id.toString() !== eventId) return ev; const newStart = ev.startDay + diff; const newEnd = ev.endDay + diff; if (newStart < 1 || newEnd > daysInMonth || newStart > newEnd) return ev; return { ...ev, startDay: newStart, endDay: newEnd }; })); } }} className={`min-h-[100px] border-b border-r border-slate-100 cursor-pointer p-0 flex flex-col ${selectedDate === day ? 'bg-blue-50 relative' : 'hover:bg-slate-50'}`}>
                      {selectedDate === day && <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none"></div>}
                      <div className="p-1.5 flex justify-between items-start z-10">
                        <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-red-500 text-white' : selectedDate === day ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>{day}</span>
                        {todos[day] && todos[day].length > 0 && <div className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-1 ${todos[day].every(t => t.done) ? 'bg-blue-600' : 'bg-slate-300'}`}></div>}
                      </div>
                      <div className="flex-1 flex flex-col gap-[1px] mt-0.5">
                        {crossingEvents.slice(0, 3).map(evt => {
                          const isStart = day === evt.startDay;
                          const isEnd = day === evt.endDay;
                          return (
                            <div key={evt.id} draggable={true} onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('eventId', evt.id.toString()); e.dataTransfer.setData('sourceDay', day.toString()); e.dataTransfer.effectAllowed = 'move'; }} onDragOver={(e) => { e.stopPropagation(); e.preventDefault(); }} className={`h-[18px] ${evt.color} ${!isStart && colIndex !== 0 && '-ml-[1px]'} ${!isEnd && colIndex !== 6 && 'w-[calc(100%+1px)]'} ${isStart || colIndex === 0 ? 'rounded-l-full ml-1' : ''} ${isEnd || colIndex === 6 ? 'rounded-r-full mr-1' : ''} flex items-center relative z-0 cursor-grab active:cursor-grabbing`}>
                              {(isStart || colIndex === 0) && <span className="text-[10px] text-white font-bold ml-1.5 whitespace-nowrap overflow-visible z-10 truncate pointer-events-none">{evt.title}</span>}
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
              <div ref={draggableRef} className="w-full lg:w-80 bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden shadow-2xl z-20">
                <div className="flex justify-between items-center mb-5 drag-handle cursor-move bg-slate-100 -m-5 p-5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ListIcon size={18} className="text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-800">3월 {selectedDate}일</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold border rounded px-2 py-1 bg-white">Focus Mode</span>
                </div>
                <div className="mt-5 flex-1 flex flex-col overflow-hidden">
                  {events.filter(e => selectedDate >= e.startDay && selectedDate <= e.endDay).map(evt => (
                    <div key={evt.id} className="mb-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-3 group relative overflow-hidden">
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
                        <div key={todo.id} className={`flex items-start gap-3 bg-white p-3.5 rounded-xl border shadow-sm group ${todo.done ? 'opacity-50' : ''}`}>
                          <button onClick={() => toggleTodo(selectedDate, todo.id)} className="mt-0.5">{todo.done ? <CheckCircle2 size={20} className="text-slate-500" /> : <Circle size={20} className="text-slate-300" />}</button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${todo.done ? 'line-through text-slate-500' : 'font-bold'}`}>{todo.text}</p>
                          </div>
                          <button onClick={() => deleteTodo(selectedDate, todo.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto bg-white rounded-xl border-2 border-slate-300 flex items-center px-3 focus-within:border-slate-800 shadow-sm">
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
            <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">Q-Net 국가기술자격 시험일정</h2>
              <div className="space-y-4">
                {allItems.map(item => (
                  <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md">
                    <div className="bg-slate-50 border-b px-5 py-4 flex justify-between items-center">
                      <div><span className="text-xs font-bold bg-slate-200 px-2 py-1 rounded-full">{item.category}</span><h3 className="font-bold text-lg mt-2">{item.name}</h3></div>
                      {item.category === "시험일정" && (
                        <button onClick={() => setCertModalOpen(item)} className="bg-slate-800 text-white py-2 px-5 rounded-lg flex items-center gap-2 font-bold"><CalendarIcon size={16} /> 캘린더에 담기</button>
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

        {(activeTab === 'study' || activeTab === 'free') && (
          <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
            {viewPostModal ? (
              <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10">
                <button onClick={() => setViewPostModal(null)} className="mb-6 text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"><ArrowRight size={16} className="rotate-180" /> 목록으로</button>
                <div className="border-b pb-5 mb-5">
                  <div><span className="text-xs font-bold bg-slate-200 px-2 py-1 rounded-full mr-2">{viewPostModal.type === 'study' ? '스터디 모집' : '자유 게시판'}</span><h3 className="font-bold text-2xl md:text-3xl mt-4 leading-tight">{viewPostModal.title}</h3></div>
                  <div className="flex justify-between items-center mt-5 text-sm font-medium text-slate-500">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-slate-800 transition-colors" onClick={() => setProfileModal(viewPostModal.authorId)}><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">{viewPostModal.author.substring(0, 1)}</div><span className="font-bold text-slate-800">{viewPostModal.author}</span><span>· {viewPostModal.createdAt || '오늘'}</span></div>
                    <div className="flex gap-4"><span className="flex gap-1 items-center"><Eye size={16} />{viewPostModal.views}</span><span className="flex gap-1 items-center"><Heart size={16} />{viewPostModal.likes}</span></div>
                  </div>
                </div>
                <div className="font-mono text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[150px] text-base">{viewPostModal.content || '내용이 없습니다.'}</div>
                {viewPostModal.type === 'study' && viewPostModal.lat && (
                  <div className="mt-8 border rounded-xl overflow-hidden h-72 relative bg-slate-100 shadow-inner">
                    <KakaoMap apiKey="894423a9ffcffb29a1e5d50427ded82e" markers={[{ lat: viewPostModal.lat, lng: viewPostModal.lng, locationName: viewPostModal.location }]} center={{ lat: viewPostModal.lat, lng: viewPostModal.lng }} level={3} />
                    <div className="absolute top-4 left-4 z-10 bg-white px-3 py-2 rounded-lg shadow-md font-bold text-sm border flex items-center gap-1"><MapPin size={16} className="text-blue-600" />{viewPostModal.location}</div>
                  </div>
                )}

                <div className="border-t border-slate-100 mt-10 pt-8">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><MessageCircle size={20} /> 댓글 <span className="text-blue-600">{viewPostModal.comments?.length || 0}</span></h4>
                  <div className="flex gap-2 mb-8">
                    <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addComment(); }} className="flex-1 border rounded-xl p-3 outline-none font-medium text-sm bg-slate-50 focus:bg-white focus:ring-2 ring-blue-500 transition-all shadow-inner" placeholder="댓글을 남겨주세요." />
                    <button onClick={addComment} className="bg-slate-800 text-white rounded-xl px-6 font-bold hover:bg-black transition-colors shadow-sm">작성</button>
                  </div>
                  <div className="space-y-4">
                    {viewPostModal.comments?.map((c: any) => (
                      <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex gap-3 group">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-xs shrink-0 cursor-pointer" onClick={() => setProfileModal('u' + c.id)}>{c.author.substring(0, 1)}</div>
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
                    <h2 className="text-2xl font-bold">{activeTab === 'study' ? '스터디 모집' : '자유 게시판'}</h2>
                    <p className="text-slate-500 mt-1">{activeTab === 'study' ? '합격을 위해 단기간 몰입할 동료를 찾아보세요.' : '정보와 노하우를 자유롭게 공유하세요.'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setWriteType(activeTab); setWriteModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Zap size={16} /> 새 글 쓰기</button>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {boardData.filter(d => d.type === activeTab).map((post) => (
                      <div key={post.id} className="p-5 hover:bg-slate-50 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4" onClick={(e) => { e.stopPropagation(); setViewPostModal(post); }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {post.type === 'study' && <span className="text-xs font-bold bg-slate-200 px-2 py-0.5 rounded flex items-center gap-1"><MapPin size={12} />{post.location}</span>}
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">게시글</span>
                          </div>
                          <h3 className="text-lg font-bold mb-2">{post.title}</h3>
                          <div className="text-xs text-slate-500 font-medium cursor-pointer hover:font-bold hover:text-slate-800 transition-colors inline-block" onClick={(e) => { e.stopPropagation(); setProfileModal(post.authorId); }}>{post.author} · {post.createdAt || '오늘'}</div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex gap-1"><Eye size={16} />{post.views}</div>
                          <div className="flex gap-1"><Heart size={16} />{post.likes}</div>
                          <div className="flex gap-1 text-slate-700"><MessageCircle size={16} />{post.comments?.length || 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
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
                        className={`w-full p-4 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors ${activeChatRoomId === room.id ? 'bg-blue-50' : ''}`}>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
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
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                          {room.partnerNickname.substring(0, 1)}
                        </div>
                        <p className="font-bold text-slate-800">{room.partnerNickname}</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                        {room.messages.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">첫 메시지를 보내보세요</div>
                        ) : room.messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                              <p>{msg.text}</p>
                              <p className={`text-[10px] mt-1 ${msg.senderId === currentUser.id ? 'text-blue-200' : 'text-slate-400'}`}>{msg.createdAt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 border-t flex gap-2">
                        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && chatInput.trim()) { const msg = { id: Date.now(), senderId: currentUser.id, text: chatInput.trim(), createdAt: new Date().toTimeString().slice(0, 5) }; setChatRooms(prev => prev.map(r => r.id === activeChatRoomId ? { ...r, messages: [...r.messages, msg] } : r)); setChatInput(''); } }}
                          placeholder="메시지를 입력하세요..." className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                        <button onClick={() => { if (!chatInput.trim()) return; const msg = { id: Date.now(), senderId: currentUser.id, text: chatInput.trim(), createdAt: new Date().toTimeString().slice(0, 5) }; setChatRooms(prev => prev.map(r => r.id === activeChatRoomId ? { ...r, messages: [...r.messages, msg] } : r)); setChatInput(''); }}
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
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
              <div><label className="block text-xs font-bold text-slate-500 mb-1">일정 제목</label><input type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">시작일 (3월)</label><input type="number" value={eventStartDay} onChange={e => setEventStartDay(Number(e.target.value))} className="w-full border rounded-lg p-2.5 outline-none" /></div>
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">종료일 (3월)</label><input type="number" value={eventEndDay} onChange={e => setEventEndDay(Number(e.target.value))} className="w-full border rounded-lg p-2.5 outline-none" /></div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-2"><button onClick={() => setAddEventModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-200">취소</button><button onClick={() => { if (eventTitle) { setEvents([...events, { id: Date.now(), title: eventTitle, startDay: Number(eventStartDay), endDay: Number(eventEndDay), color: "bg-orange-500" }]); setAddEventModalOpen(false); setEventTitle(''); } }} className="px-4 py-2 rounded-lg bg-blue-600 text-white border-blue-600">저장</button></div>
          </div>
        </div>
      )}

      {certModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col align-middle justify-center">
            <div className="flex justify-between items-center p-5 border-b"><h3 className="font-bold flex flex-col"><span className="text-xs text-slate-400 font-normal">[{certModalOpen.name}]</span>캘린더에 추가하기</h3><button onClick={() => setCertModalOpen(null)}><X size={20} /></button></div>
            <div className="p-4 space-y-3">
              <label className="font-bold text-sm text-slate-600 block">시험 일자 선택</label>
              <p className="text-xs text-slate-400">시험 기간: {certModalOpen.startDate} ~ {certModalOpen.endDate}</p>
              <input
                type="date"
                id="certDate"
                min={certModalOpen.startDate}
                max={certModalOpen.endDate}
                defaultValue={certModalOpen.startDate}
                className="border rounded-lg p-2 w-full text-sm outline-none focus:border-blue-500"
              />
              <button className="w-full mt-4 bg-blue-600 text-white font-bold p-3 rounded-lg" onClick={() => {
                const dateStr = (document.getElementById('certDate') as HTMLInputElement).value;
                if (!dateStr) return;
                const [year, month, day] = dateStr.split('-').map(Number);
                setCurrentDate(new Date(year, month - 1, 1));
                setEvents([...events, { id: Date.now(), title: certModalOpen.name, startDay: day, endDay: day, color: 'bg-green-500' }]);
                setCertModalOpen(null); setActiveTab('calendar');
              }}>일정 확정 및 추가</button>
            </div>
          </div>
        </div>
      )}

      {profileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setProfileModal(null); setEditProfileOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-100 h-24 relative">
              <button onClick={() => { setProfileModal(null); setEditProfileOpen(false); }} className="absolute top-3 right-3 rounded-full bg-white/50 p-1"><X size={20} /></button>
            </div>
            <div className="px-6 pb-6 relative text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full border-4 border-white absolute -top-10 left-1/2 -translate-x-1/2 flex items-center justify-center text-blue-600 font-bold text-2xl shadow-sm">
                {(profileModal === currentUser.id ? currentUser : mockProfiles[profileModal])?.nickname.substring(0, 1)}
              </div>
              {editProfileOpen ? (
                <div className="pt-14 flex flex-col gap-3 text-left">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">닉네임</label>
                    <input type="text" value={editNickname} onChange={e => setEditNickname(e.target.value)} className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">연령대</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {['10대', '20대', '30대', '40대', '50대+'].map(ag => (
                        <button type="button" key={ag} onClick={() => setEditAgeGroup(ag)}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${editAgeGroup === ag ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-500 hover:border-slate-400'}`}>
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
                          className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${editGender === g ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">지역</label>
                    <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="예: 서울 강남구" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setEditProfileOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50">취소</button>
                    <button onClick={() => {
                      setCurrentUser((prev: any) => ({ ...prev, nickname: editNickname || prev.nickname, ageGroup: editAgeGroup || prev.ageGroup, gender: editGender || prev.gender, location: editLocation || prev.location }));
                      setEditProfileOpen(false);
                      setProfileModal(null);
                    }} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-black">저장</button>
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
                    ? <button onClick={() => { setEditNickname(currentUser.nickname); setEditAgeGroup(currentUser.ageGroup); setEditGender(currentUser.gender); setEditLocation(currentUser.location); setEditProfileOpen(true); }} className="w-full mt-6 bg-slate-800 text-white py-2.5 rounded-xl font-bold hover:bg-black transition-colors">프로필 수정하기</button>
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
                    }} className="w-full mt-6 bg-blue-600 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2"><MessageSquare size={18} /> 1:1 채팅하기</button>
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
              <select value={writeType} onChange={e => setWriteType(e.target.value as any)} className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-blue-500 font-medium"><option value="study">스터디 모집</option><option value="free">자유 게시판</option></select>
              <label className="block text-sm font-bold mb-1">제목</label>
              <input type="text" value={postTitle} onChange={e => setPostTitle(e.target.value)} className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-blue-500 font-medium" placeholder="제목을 입력하세요" />
              <label className="block text-sm font-bold mb-1">내용</label>
              <textarea rows={5} value={postContent} onChange={e => setPostContent(e.target.value)} className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-blue-500 font-medium resize-none" placeholder="내용을 작성하세요"></textarea>

              {writeType === 'study' && (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-white mt-4 shadow-xl">
                  <label className="block text-sm font-bold mb-3 text-slate-300">장소 검색 (카카오맵 API)</label>
                  <div className="flex gap-2 mb-4">
                    <input type="text" value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') searchPlacesOnKakao(); }} className="border border-slate-600 bg-slate-800 p-2.5 rounded-lg flex-1 outline-none text-sm placeholder:text-slate-500 text-white" placeholder="키워드 입력 (예: 강남역 카페)" />
                    <button onClick={searchPlacesOnKakao} className="bg-blue-600 hover:bg-blue-500 transition-colors text-white px-5 rounded-lg font-bold text-sm">검색</button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="flex flex-col md:flex-row gap-4 h-72">
                      <div className="w-full md:w-1/2 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {searchResults.map(res => (
                          <div key={res.id} onClick={() => setSelectedPlace(res)} className={`p-4 rounded-xl text-sm cursor-pointer border transition-all ${selectedPlace?.id === res.id ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'}`}>
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
                  {selectedPlace && <div className="mt-4 p-3 bg-blue-900/30 border border-blue-800/50 rounded-lg flex items-center justify-between"><p className="text-sm text-blue-300 font-bold">📍 선택된 확정 장소: {selectedPlace.name}</p></div>}
                </div>
              )}
            </div>
            <div className="p-5 border-t flex justify-end gap-3 bg-slate-50"><button onClick={() => { setWriteModalOpen(false); setPostTitle(''); setPostContent(''); setSelectedPlace(null); setSearchKeyword(''); setSearchResults([]); }} className="px-5 py-2.5 rounded-lg bg-slate-200 font-bold">취소</button><button onClick={submitPost} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold">등록하기</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// 로그인 화면
const AuthScreen = ({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState(''); const [location, setLocation] = useState('');
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-8">
        <h1 className="text-3xl font-black text-white text-center mb-6"><Zap size={32} className="inline text-blue-500 fill-blue-500 mb-1" /> HighPass</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />
          {!isLoginMode && (
            <>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="별명" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="지역 (예: 서울 강남구)" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />
              <div>
                <p className="text-xs text-slate-400 mb-2">연령대</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {['10대', '20대', '30대', '40대', '50대+'].map(ag => (
                    <button type="button" key={ag} onClick={() => setAgeGroup(ag)}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${ageGroup === ag ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                      {ag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">성별</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {['남성', '여성', '기타'].map(g => (
                    <button type="button" key={g} onClick={() => setGender(g)}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${gender === g ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {error && <p className="text-red-400">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl">{loading ? '...' : (isLoginMode ? '로그인' : '가입하기')}</button>
        </form>
        {isLoginMode && (
          <div className="mt-6">
            <div className="relative flex items-center py-2 mb-4">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-medium">소셜 간편 로그인</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onAuthSuccess({ id: `oauth_${Date.now()}`, email: `user@google.com`, password: '', nickname: `Google유저`, name: '간편로그인', ageGroup: '20대', gender: '비공개', location: 'Busan' })} className="flex items-center justify-center gap-2 bg-white text-slate-800 hover:bg-slate-100 font-bold py-2.5 rounded-xl text-sm transition-colors">
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
        <button onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} className="w-full text-slate-400 mt-5 text-sm">{isLoginMode ? '회원가입' : '로그인으로 돌아가기'}</button>
      </div>
    </div>
  );
};
