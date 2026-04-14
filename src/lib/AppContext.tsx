"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clearAuthSession, loadAuthSession, logoutSession, saveAuthSession, subscribeAuthExpired } from "@/lib/auth";
import { createBoard, listBoards } from "@/lib/boards";
import { isPostLiked } from "@/lib/likes";
import { createStudy, listStudies } from "@/lib/study-api";
import type { BoardPost, ChatRoom, EventType, SearchPlace, TodoMap, UserProfile } from "@/lib/types";

function dedupeBoardPosts(posts: BoardPost[]) {
  const map = new Map<string, BoardPost>();
  for (const post of posts) {
    map.set(`${post.type}:${post.id}`, post);
  }
  return Array.from(map.values());
}

interface AppContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  authReady: boolean;
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
  submitPost: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [boardData, setBoardData] = useState<BoardPost[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [todos, setTodos] = useState<TodoMap>({});
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);

  const [profileModal, setProfileModal] = useState<string | null>(null);

  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [writeType, setWriteType] = useState<"study" | "free">("study");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postCert, setPostCert] = useState("");
  const [postCertCategory, setPostCertCategory] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<SearchPlace | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<SearchPlace[]>([]);

  const hydrateLikedBoards = useCallback((posts: BoardPost[], userId: string) => {
    return dedupeBoardPosts(
      posts.map((post) => ({
        ...post,
        likedByUser:
          typeof post.likedByUser === "boolean"
            ? post.likedByUser
            : isPostLiked(userId, post.type === "free" ? "FREE" : "STUDY", post.id),
      })),
    );
  }, []);

  useEffect(() => {
    setCurrentUser(loadAuthSession()?.user ?? null);
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authReady || !currentUser) return;
    localStorage.removeItem(`hp_events_${currentUser.id}`);
    localStorage.removeItem(`hp_todos_${currentUser.id}`);
  }, [authReady, currentUser]);

  useEffect(() => {
    if (!authReady || !currentUser) return;
    let cancelled = false;

    (async () => {
      try {
        const [freeBoards, studies] = await Promise.all([listBoards(currentUser.id), listStudies(currentUser.id)]);
        if (cancelled) return;
        setBoardData(hydrateLikedBoards([...freeBoards, ...studies], currentUser.id));
      } catch {
        // Keep UI usable even if boards API is not ready.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, currentUser, hydrateLikedBoards]);

  useEffect(() => {
    if (!authReady || !currentUser) return;
    saveAuthSession(currentUser);
  }, [authReady, currentUser]);

  useEffect(() => {
    return subscribeAuthExpired(() => {
      setCurrentUser(null);
      setActiveChatRoomId(null);
      setBoardData([]);
      setEvents([]);
      setTodos({});
      clearAuthSession();
    });
  }, []);

  const handleAuthSuccess = useCallback((user: UserProfile) => {
    setCurrentUser(user);
    saveAuthSession(user);
  }, []);

  const logout = useCallback(() => {
    void logoutSession();
    setCurrentUser(null);
    setActiveChatRoomId(null);
    setBoardData([]);
    setEvents([]);
    setTodos({});
    clearAuthSession();
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

    setBoardData((prev) => dedupeBoardPosts([created, ...prev]));
    return true;
  }, [currentUser, postContent, postTitle, postCert, postCertCategory, selectedPlace, writeType]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        authReady,
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
  BoardPost,
  ChatMessage,
  ChatRoom,
  EventType,
  PostComment,
  SearchPlace,
  TodoItem,
  TodoMap,
  UserProfile,
} from "@/lib/types";
