"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Client } from "@stomp/stompjs";
import { toast } from "sonner";
import { fetchCurrentUserProfile, logoutSession, notifyAuthExpired, subscribeAuthExpired } from "@/services/auth/auth";
import { createBoard } from "@/features/free-board/api/boards";
import { createStudy } from "@/features/study/api/study-api";
import type { ChatRoom, EventType, SearchPlace, TodoMap, UserProfile } from "@/entities/common/types";
import { CHAT_API_BASE_URL } from "@/services/config/config";

interface AppContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  authReady: boolean;
  handleAuthSuccess: (user: UserProfile) => void;
  logout: () => void;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;

  events: EventType[];
  setEvents: React.Dispatch<React.SetStateAction<EventType[]>>;
  todos: TodoMap;
  setTodos: React.Dispatch<React.SetStateAction<TodoMap>>;

  chatRooms: ChatRoom[];
  setChatRooms: React.Dispatch<React.SetStateAction<ChatRoom[]>>;
  activeChatRoomId: string | null;
  setActiveChatRoomId: React.Dispatch<React.SetStateAction<string | null>>;
  chatClient: Client | null;
  setChatClient: React.Dispatch<React.SetStateAction<Client | null>>;

  profileModal: string | null;
  setProfileModal: React.Dispatch<React.SetStateAction<string | null>>;

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
  createChatRoom : boolean;
  setCreateChatRoom: React.Dispatch<React.SetStateAction<boolean>>; 
  searchKeyword: string;
  setSearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  searchResults: SearchPlace[];
  setSearchResults: React.Dispatch<React.SetStateAction<SearchPlace[]>>;
  submitPost: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [events, setEvents] = useState<EventType[]>([]);
  const [todos, setTodos] = useState<TodoMap>({});
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [chatClient, setChatClient] = useState<Client | null>(null);

  const [profileModal, setProfileModal] = useState<string | null>(null);

  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [writeType, setWriteType] = useState<"study" | "free">("study");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postCert, setPostCert] = useState("");
  const [postCertCategory, setPostCertCategory] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<SearchPlace | null>(null);
  
  const [createChatRoom, setCreateChatRoom] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<SearchPlace[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const user = await fetchCurrentUserProfile();
        if (!cancelled) {
          setCurrentUser(user);
        }
      } catch {
        if (!cancelled) {
          notifyAuthExpired();
        }
      } finally {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authReady || !currentUser) return;
    localStorage.removeItem(`hp_events_${currentUser.id}`);
    localStorage.removeItem(`hp_todos_${currentUser.id}`);
  }, [authReady, currentUser]);

  useEffect(() => {
    return subscribeAuthExpired(() => {
      setCurrentUser(null);
      setActiveChatRoomId(null);
      setEvents([]);
      setTodos({});
    });
  }, []);

  const handleAuthSuccess = useCallback((user: UserProfile) => {
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    void logoutSession();
    setCurrentUser(null);
    setActiveChatRoomId(null);
    setEvents([]);
    setTodos({});
    toast.success("로그아웃되었습니다.");
  }, []);

  const submitPost = useCallback(async () => {
    if (!currentUser) return false;
    if (!postContent.trim() && !postTitle.trim()) return false;

    const numericUserId = String(currentUser.id).trim();
    if (!/^\d+$/.test(numericUserId)) {
      throw new Error(`Board POST requires numeric userId. Current user id: "${currentUser.id}"`);
    }

    const certValue = writeType === "study" ? postCert || postCertCategory || null : null;

    const created =
      writeType === "study"
        ? await createStudy({
            userId: numericUserId,
            author: currentUser.nickname,
            title: postTitle.trim(),
            content: postContent.trim(),
            cert: certValue,
            locationName: selectedPlace?.name,
            address: selectedPlace?.address,
            latitude: selectedPlace?.lat,
            longitude: selectedPlace?.lng,
            placeId: selectedPlace?.id,
            createChatRoom,
          })
        : await createBoard({
            userId: numericUserId,
            author: currentUser.nickname,
            type: writeType,
            title: postTitle.trim(),
            content: postContent.trim(),
            cert: certValue,
            location: selectedPlace?.address,
            lat: selectedPlace?.lat,
            lng: selectedPlace?.lng,
          });


      return true;
  }, [currentUser, postContent, postTitle, postCert, postCertCategory, selectedPlace, writeType, createChatRoom]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        authReady,
        handleAuthSuccess,
        logout,
        setCurrentUser,
        events,
        setEvents,
        todos,
        setTodos,
        chatRooms,
        setChatRooms,
        activeChatRoomId,
        setActiveChatRoomId,
        chatClient,
        setChatClient,
        profileModal,
        setProfileModal,
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
        createChatRoom,
        setCreateChatRoom,
        searchKeyword,
        setSearchKeyword,
        searchResults,
        setSearchResults,
        submitPost,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export type {
  ChatMessage,
  ChatRoom,
  EventType,
  PostComment,
  SearchPlace,
  TodoItem,
  TodoMap,
  UserProfile,
} from "@/entities/common/types";
