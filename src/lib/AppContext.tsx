"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clearAuthSession, loadAuthSession, saveAuthSession } from "@/lib/auth";

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

export interface UserProfile {
  id: string;
  email?: string;
  password?: string;
  nickname: string;
  name: string;
  ageGroup: string;
  gender: string;
  location: string;
  profileImage?: string | null;
  loginType?: string;
}

export interface PostComment {
  id: number;
  author: string;
  text: string;
  createdAt?: string;
}

export interface BoardPost {
  id: number;
  type: "study" | "free";
  title: string;
  content: string;
  author: string;
  location?: string;
  lat?: number;
  lng?: number;
  views: number;
  likes: number;
  scraps: number;
  comments: PostComment[];
  authorId: string;
  createdAt: string;
  cert: string | null;
}

export interface ChatMessage {
  id: number;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  partnerId: string;
  partnerNickname: string;
  messages: ChatMessage[];
}

export interface SearchPlace {
  id: string;
  name: string;
  address: string;
  phone?: string;
  category?: string;
  lat: number;
  lng: number;
}

export type TodoItem = {
  id: number;
  text: string;
  done: boolean;
  createdAt: string;
  completedAt?: string;
};

export type TodoMap = Record<number, TodoItem[]>;

interface AppContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  handleAuthSuccess: (user: UserProfile) => void;
  logout: () => void;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;

  boardData: BoardPost[];
  setBoardData: React.Dispatch<React.SetStateAction<BoardPost[]>>;

  events: EventType[];
  setEvents: React.Dispatch<React.SetStateAction<EventType[]>>;
  todos: TodoMap;
  setTodos: React.Dispatch<React.SetStateAction<TodoMap>>;

  chatRooms: ChatRoom[];
  setChatRooms: React.Dispatch<React.SetStateAction<ChatRoom[]>>;
  activeChatRoomId: string | null;
  setActiveChatRoomId: React.Dispatch<React.SetStateAction<string | null>>;

  profileModal: string | null;
  setProfileModal: React.Dispatch<React.SetStateAction<string | null>>;
  editProfileOpen: boolean;
  setEditProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editNickname: string;
  setEditNickname: React.Dispatch<React.SetStateAction<string>>;
  editAgeGroup: string;
  setEditAgeGroup: React.Dispatch<React.SetStateAction<string>>;
  editGender: string;
  setEditGender: React.Dispatch<React.SetStateAction<string>>;
  editLocation: string;
  setEditLocation: React.Dispatch<React.SetStateAction<string>>;
  editSido: string;
  setEditSido: React.Dispatch<React.SetStateAction<string>>;
  editSigungu: string;
  setEditSigungu: React.Dispatch<React.SetStateAction<string>>;

  writeModalOpen: boolean;
  setWriteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  writeType: "study" | "free";
  setWriteType: React.Dispatch<React.SetStateAction<"study" | "free">>;
  postTitle: string;
  setPostTitle: React.Dispatch<React.SetStateAction<string>>;
  postContent: string;
  setPostContent: React.Dispatch<React.SetStateAction<string>>;
  postCert: string;
  setPostCert: React.Dispatch<React.SetStateAction<string>>;
  postCertCategory: string;
  setPostCertCategory: React.Dispatch<React.SetStateAction<string>>;
  selectedPlace: SearchPlace | null;
  setSelectedPlace: React.Dispatch<React.SetStateAction<SearchPlace | null>>;
  searchKeyword: string;
  setSearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  searchResults: SearchPlace[];
  setSearchResults: React.Dispatch<React.SetStateAction<SearchPlace[]>>;
  submitPost: () => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => loadAuthSession()?.user ?? null);
  const [boardData, setBoardData] = useState<BoardPost[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [todos, setTodos] = useState<TodoMap>({});
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);

  const [profileModal, setProfileModal] = useState<string | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editAgeGroup, setEditAgeGroup] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editSido, setEditSido] = useState("");
  const [editSigungu, setEditSigungu] = useState("");

  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [writeType, setWriteType] = useState<"study" | "free">("study");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postCert, setPostCert] = useState("");
  const [postCertCategory, setPostCertCategory] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<SearchPlace | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<SearchPlace[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const savedEvents = localStorage.getItem(`hp_events_${currentUser.id}`);
    const savedTodos = localStorage.getItem(`hp_todos_${currentUser.id}`);
    if (savedEvents) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEvents(JSON.parse(savedEvents));
      } catch {}
    }
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch {}
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(`hp_events_${currentUser.id}`, JSON.stringify(events));
  }, [events, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(`hp_todos_${currentUser.id}`, JSON.stringify(todos));
  }, [todos, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    saveAuthSession(currentUser);
  }, [currentUser]);

  const handleAuthSuccess = useCallback((user: UserProfile) => {
    setCurrentUser(user);
    saveAuthSession(user);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setActiveChatRoomId(null);
    clearAuthSession();
  }, []);

  const submitPost = useCallback(() => {
    // Post creation is intentionally disabled until backend APIs are connected.
    return false;
  }, []);

  const value: AppContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    handleAuthSuccess,
    logout,
    setCurrentUser,
    boardData,
    setBoardData,
    events,
    setEvents,
    todos,
    setTodos,
    chatRooms,
    setChatRooms,
    activeChatRoomId,
    setActiveChatRoomId,
    profileModal,
    setProfileModal,
    editProfileOpen,
    setEditProfileOpen,
    editNickname,
    setEditNickname,
    editAgeGroup,
    setEditAgeGroup,
    editGender,
    setEditGender,
    editLocation,
    setEditLocation,
    editSido,
    setEditSido,
    editSigungu,
    setEditSigungu,
    writeModalOpen,
    setWriteModalOpen,
    writeType,
    setWriteType,
    postTitle,
    setPostTitle,
    postContent,
    setPostContent,
    postCert,
    setPostCert,
    postCertCategory,
    setPostCertCategory,
    selectedPlace,
    setSelectedPlace,
    searchKeyword,
    setSearchKeyword,
    searchResults,
    setSearchResults,
    submitPost,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
