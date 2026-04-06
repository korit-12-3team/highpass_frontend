"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllStudies } from '@/lib/study';
import { INITIAL_USERS } from '@/lib/constants';

// ── 타입 ──────────────────────────────────────────────────────────
export interface EventType {
  id: number;
  title: string;
  month: number;
  startDay: number;
  endDay: number;
  color: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
}
export type TodoMap = { [key: number]: any[] };

interface AppContextType {
  // Auth
  currentUser: any;
  isAuthenticated: boolean;
  handleAuthSuccess: (user: any) => void;
  logout: () => void;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;

  // Board
  boardData: any[];
  setBoardData: React.Dispatch<React.SetStateAction<any[]>>;

  // Events & Todos
  events: EventType[];
  setEvents: React.Dispatch<React.SetStateAction<EventType[]>>;
  todos: TodoMap;
  setTodos: React.Dispatch<React.SetStateAction<TodoMap>>;

  // Chat
  chatRooms: any[];
  setChatRooms: React.Dispatch<React.SetStateAction<any[]>>;
  activeChatRoomId: string | null;
  setActiveChatRoomId: React.Dispatch<React.SetStateAction<string | null>>;

  // Profile modal
  profileModal: string | null;
  setProfileModal: React.Dispatch<React.SetStateAction<string | null>>;
  editProfileOpen: boolean;
  setEditProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editNickname: string; setEditNickname: React.Dispatch<React.SetStateAction<string>>;
  editAgeGroup: string; setEditAgeGroup: React.Dispatch<React.SetStateAction<string>>;
  editGender: string; setEditGender: React.Dispatch<React.SetStateAction<string>>;
  editLocation: string; setEditLocation: React.Dispatch<React.SetStateAction<string>>;
  editSido: string; setEditSido: React.Dispatch<React.SetStateAction<string>>;
  editSigungu: string; setEditSigungu: React.Dispatch<React.SetStateAction<string>>;

  // Write modal
  writeModalOpen: boolean;
  setWriteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  writeType: 'study' | 'free';
  setWriteType: React.Dispatch<React.SetStateAction<'study' | 'free'>>;
  postTitle: string; setPostTitle: React.Dispatch<React.SetStateAction<string>>;
  postContent: string; setPostContent: React.Dispatch<React.SetStateAction<string>>;
  postCert: string; setPostCert: React.Dispatch<React.SetStateAction<string>>;
  postCertCategory: string; setPostCertCategory: React.Dispatch<React.SetStateAction<string>>;
  selectedPlace: any; setSelectedPlace: React.Dispatch<React.SetStateAction<any>>;
  searchKeyword: string; setSearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  searchResults: any[]; setSearchResults: React.Dispatch<React.SetStateAction<any[]>>;
  submitPost: () => void;

  // Helpers
  mockProfiles: Record<string, any>;
  users: any[];
}

// ── 초기 게시판 데이터 ────────────────────────────────────────────
function buildInitialBoardData() {
  const realStudies = getAllStudies();
  const studiesAsBoardData = realStudies.map(s => ({
    id: s.id, type: 'study' as const, title: s.title, content: s.content, author: s.userNickname,
    location: s.locationName, lat: s.latitude, lng: s.longitude,
    views: s.viewCount, likes: s.favoriteCount, scraps: 0, comments: [],
    authorId: `u${s.id}`, createdAt: s.createdAt.slice(0, 10), cert: s.cert,
  }));

  const mockProfiles: Record<string, any> = realStudies.reduce((acc, s) => ({
    ...acc, [`u${s.id}`]: { id: `u${s.id}`, nickname: s.userNickname, name: s.userName, ageGroup: s.userAge, gender: s.userGender, location: s.userRegion }
  }), {} as any);
  mockProfiles['uf1'] = { id: 'uf1', nickname: '벼락치기장인', name: '김동현', ageGroup: '30대', gender: '남성', location: '부산 해운대구' };
  mockProfiles['uf2'] = { id: 'uf2', nickname: '시험왕', name: '이지훈', ageGroup: '20대', gender: '남성', location: '서울 관악구' };
  mockProfiles['uf3'] = { id: 'uf3', nickname: '조용한공부러', name: '박세연', ageGroup: '20대', gender: '여성', location: '경기 수원시 영통구' };

  const freePosts = [
    { id: 99991, type: 'free' as const, title: '필기 3일 남았는데 기출만 돌려도 될까요?', content: '기출문제 계속 돌리고 있는데 불안하네요. 새로운 문제보다 기출 위주로 하는 게 맞는 건지 고민이에요.', author: '벼락치기장인', location: '부산 해운대구', lat: undefined, lng: undefined, views: 350, likes: 45, scraps: 12, comments: [{ id: 1, author: '합격가즈아', text: '5개년 확실하면 됩니다!' }, { id: 2, author: '단기합격러', text: '저도 기출만 했는데 합격했어요!' }], authorId: 'uf1', createdAt: '2026-04-01', cert: null },
    { id: 99992, type: 'free' as const, title: '스터디 자리 추천해주세요 (서울 관악구)', content: '관악구 주변에 조용하고 오래 있을 수 있는 카페나 스터디룸 추천 받아요. 주말에 주로 이용할 것 같아요!', author: '시험왕', location: '서울 관악구', lat: undefined, lng: undefined, views: 128, likes: 22, scraps: 5, comments: [{ id: 3, author: '조용한공부러', text: '신림역 근처 작은 스터디카페 괜찮아요~' }], authorId: 'uf2', createdAt: '2026-04-02', cert: null },
    { id: 99993, type: 'free' as const, title: '정보처리기사 실기 후기 공유', content: '오늘 정보처리기사 실기 보고 왔어요. 생각보다 SQL 문제가 많이 나왔고, 통합테스트 관련 내용도 꼭 보세요. 모두 파이팅!', author: '공부왕철수', location: '서울 강남구', lat: undefined, lng: undefined, views: 512, likes: 87, scraps: 34, comments: [], authorId: 'u1', createdAt: '2026-04-03', cert: null },
  ];

  return { boardData: [...studiesAsBoardData, ...freePosts], mockProfiles };
}

const { boardData: initialBoardData, mockProfiles: initialMockProfiles } = buildInitialBoardData();

// ── Context ───────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [boardData, setBoardData] = useState<any[]>(initialBoardData);
  const [events, setEvents] = useState<EventType[]>([
    { id: 101, title: '정보처리기사 1회 필기 접수', month: 3, startDay: 15, endDay: 18, color: 'bg-hp-500', isAllDay: true }
  ]);
  const [todos, setTodos] = useState<TodoMap>({
    15: [
      { id: 1, text: '기출문제 1회분 풀기', done: true, createdAt: '09:00', completedAt: '11:30' },
      { id: 2, text: '오답 노트 정리하기', done: false, createdAt: '09:05' }
    ]
  });
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);

  // Profile modal
  const [profileModal, setProfileModal] = useState<string | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editAgeGroup, setEditAgeGroup] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSido, setEditSido] = useState('');
  const [editSigungu, setEditSigungu] = useState('');

  // Write modal
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [writeType, setWriteType] = useState<'study' | 'free'>('study');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCert, setPostCert] = useState('');
  const [postCertCategory, setPostCertCategory] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // localStorage 동기화
  useEffect(() => {
    if (!currentUser) return;
    const savedEvents = localStorage.getItem(`hp_events_${currentUser.id}`);
    const savedTodos = localStorage.getItem(`hp_todos_${currentUser.id}`);
    if (savedEvents) { try { setEvents(JSON.parse(savedEvents)); } catch { } }
    if (savedTodos) { try { setTodos(JSON.parse(savedTodos)); } catch { } }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(`hp_events_${currentUser.id}`, JSON.stringify(events));
  }, [events, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(`hp_todos_${currentUser.id}`, JSON.stringify(todos));
  }, [todos, currentUser]);

  const handleAuthSuccess = useCallback((user: any) => {
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const submitPost = useCallback(() => {
    if (!postTitle || !postContent || !currentUser) return;
    const newPost = {
      id: Date.now(), type: writeType, title: postTitle, content: postContent,
      author: currentUser.nickname, location: selectedPlace?.name || currentUser.location,
      lat: selectedPlace?.lat, lng: selectedPlace?.lng,
      cert: postCert || null,
      views: 0, likes: 0, scraps: 0, comments: [], authorId: currentUser.id, createdAt: '방금 전'
    };
    setBoardData(prev => [newPost, ...prev]);
    setWriteModalOpen(false);
    setPostTitle(''); setPostContent(''); setSelectedPlace(null);
    setSearchKeyword(''); setSearchResults([]);
    setPostCertCategory(''); setPostCert('');
  }, [postTitle, postContent, currentUser, writeType, selectedPlace, postCert]);

  const value: AppContextType = {
    currentUser, isAuthenticated: !!currentUser, handleAuthSuccess, logout, setCurrentUser,
    boardData, setBoardData,
    events, setEvents, todos, setTodos,
    chatRooms, setChatRooms, activeChatRoomId, setActiveChatRoomId,
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
    mockProfiles: initialMockProfiles,
    users: INITIAL_USERS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
