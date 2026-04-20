"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import { Client } from "@stomp/stompjs";
import MainSidebar from "@/shared/components/layout/MainSidebar";
import ProfileModal from "@/shared/components/profile/ProfileModal";
import WritePostModal from "@/features/boards/components/WritePostModal";
import { useApp } from "@/shared/context/AppContext";
import { createUserProfile, getUserProfile } from "@/features/mypage/api/profile";
import { createChatClient } from "@/services/realtime/stomp";
import type { SearchPlace, UserProfile } from "@/entities/common/types";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser,
    isAuthenticated,
    authReady,
    logout,
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
  } = useApp();

  const [loadingKakao, errorKakao] = useKakaoLoader({
    appkey: "894423a9ffcffb29a1e5d50427ded82e",
    libraries: ["services", "clusterer"],
  });

  const [profileRemote, setProfileRemote] = useState<UserProfile | null>(null);
  const [profileRemoteLoading, setProfileRemoteLoading] = useState(false);
  const [profileRemoteError, setProfileRemoteError] = useState("");
  const chatClientRef = useRef<Client | null>(null);
  const chatRoomIdsKey = chatRooms.map((room) => room.id).join(",");

  useEffect(() => {
    if (authReady && !isAuthenticated) router.replace("/login");
  }, [authReady, isAuthenticated, router]);

  useEffect(() => {
    if (!profileModal) {
      setProfileRemote(null);
      setProfileRemoteError("");
      setProfileRemoteLoading(false);
      return;
    }

    let cancelled = false;
    setProfileRemoteLoading(true);
    setProfileRemoteError("");

    void (async () => {
      try {
        const fetched = await getUserProfile(profileModal);
        if (!cancelled) {
          setProfileRemote(fetched);
        }
      } catch (error) {
        if (!cancelled) {
          setProfileRemote(null);
          setProfileRemoteError(error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setProfileRemoteLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileModal]);

  useEffect(() => {
    if (!authReady || !currentUser?.id) return;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`http://localhost:8080/chat/rooms?userId=${currentUser.id}`);
        if (!response.ok) return;
        const rooms = await response.json();
        if (cancelled) return;

        setChatRooms(rooms);
        setActiveChatRoomId((prev) => prev ?? (rooms[0]?.id ?? null));
      } catch {
        // Keep app usable even if chat server is unavailable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, currentUser?.id, setActiveChatRoomId, setChatRooms]);

  useEffect(() => {
    if (!currentUser?.id || chatRooms.length === 0) return;

    const client = createChatClient(chatRooms.map((room) => Number(room.id)).filter(Number.isFinite), (newMessage) => {
      setChatRooms((prev) =>
        prev.map((room) => {
          if (Number(room.id) !== Number(newMessage.roomId)) return room;

          const roomMessages = Array.isArray(room.messages) ? room.messages : [];
          const alreadyExists = roomMessages.some((message) => Number(message.id) === Number(newMessage.id));
          const nextUnread =
            pathname === "/chat" && String(activeChatRoomId) === String(room.id)
              ? 0
              : (room.unreadCount ?? 0) + (alreadyExists ? 0 : 1);

          return {
            ...room,
            messages: alreadyExists ? roomMessages : [...roomMessages, newMessage],
            lastMessage: newMessage.message,
            unreadCount: nextUnread,
          };
        }),
      );
    });

    client.activate();
    chatClientRef.current = client;

    return () => {
      chatClientRef.current = null;
      void client.deactivate();
    };
  }, [activeChatRoomId, chatRoomIdsKey, currentUser?.id, pathname, setChatRooms]);

  const ready = authReady && isAuthenticated && !!currentUser;
  if (!ready || !currentUser) return null;

  const getProfileById = (profileId: string) => {
    if (profileId === currentUser.id) return currentUser;

    const chatProfile = chatRooms.find((room) => room.partnerId === profileId);
    if (chatProfile) {
      return createUserProfile({
        id: chatProfile.partnerId,
        nickname: chatProfile.partnerNickname,
        name: chatProfile.partnerNickname,
      });
    }

    return createUserProfile({ id: profileId, nickname: "사용자" });
  };

  const baseProfile = profileModal ? getProfileById(profileModal) : currentUser;
  const profile = profileModal && profileRemote?.id === baseProfile.id ? profileRemote : baseProfile;

  const resetWriteForm = () => {
    setWriteModalOpen(false);
    setPostTitle("");
    setPostContent("");
    setPostCert("");
    setPostCertCategory("");
    setSelectedPlace(null);
    setSearchKeyword("");
    setSearchResults([]);
  };

  const searchPlacesOnKakao = () => {
    if (typeof window === "undefined") return;
    const kakaoMaps = window.kakao?.maps;
    const services = kakaoMaps?.services;

    if (!services) {
      alert("지도 스크립트가 아직 로드되지 않았습니다.");
      return;
    }

    const places = new services.Places();
    places.keywordSearch(searchKeyword, (data, status) => {
      if (status !== services.Status.OK) return;
      setSearchResults(
        data.map(
          (item): SearchPlace => ({
            id: item.id,
            name: item.place_name,
            address: item.road_address_name || item.address_name,
            phone: item.phone,
            category: item.category_group_name || item.category_name?.split(">").pop()?.trim(),
            lat: parseFloat(item.y),
            lng: parseFloat(item.x),
          }),
        ),
      );
    });
  };

  return (
    <div className="flex h-screen bg-hp-50 font-sans text-slate-800">
      <MainSidebar
        pathname={pathname}
        currentUser={currentUser}
        chatRooms={chatRooms}
        onNavigate={(href) => router.push(href)}
        onOpenProfile={() => setProfileModal(currentUser.id)}
        onLogout={logout}
      />

      <main className="app-scroll-container relative flex-1 p-4 md:p-8">{children}</main>

      <ProfileModal
        profile={profile}
        loading={profileRemoteLoading}
        error={profileRemoteError}
        isOpen={!!profileModal}
        isCurrentUser={profile.id === currentUser.id}
        onOpenEdit={() => {
          setProfileModal(null);
          router.push("/mypage");
        }}
        onClose={() => setProfileModal(null)}
        onStartChat={async () => {
          const existing = chatRooms.find((room) => room.partnerId === profile.id);
          if (existing) {
            setActiveChatRoomId(existing.id);
          } else {
            try {
              const response = await fetch(`http://localhost:8080/chat/room?userId=${currentUser.id}&partnerId=${profile.id}`,
            { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }
            }
          );

          if (response.ok) {
            const dbRoom = await response.json();
            
            setChatRooms((prev) => {
              const isIncluded = prev.some(r => r.id === dbRoom.id);
              return isIncluded ? prev : [...prev, dbRoom];
            });
            
            setActiveChatRoomId(dbRoom.id);
            setProfileModal(null);
            router.push("/chat");
          } else {
            const errorMsg = await response.text();
            console.error("서버 응답 에러:", errorMsg);
          }
        } catch (error) {
          console.error("네트워크 에러:", error);
        }

        setProfileModal(null);
        if (window.location.pathname !== "/chat") {
          router.push("/chat");
        }
      }}}
      />

      <WritePostModal
        isOpen={writeModalOpen}
        writeType={writeType}
        setWriteType={setWriteType}
        postTitle={postTitle}
        setPostTitle={setPostTitle}
        postContent={postContent}
        setPostContent={setPostContent}
        postCert={postCert}
        setPostCert={setPostCert}
        postCertCategory={postCertCategory}
        setPostCertCategory={setPostCertCategory}
        selectedPlace={selectedPlace}
        setSelectedPlace={setSelectedPlace}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        searchResults={searchResults}
        searchPlacesOnKakao={searchPlacesOnKakao}
        loadingKakao={loadingKakao}
        errorKakao={errorKakao}
        onClose={resetWriteForm}
      />
    </div>
  );
}
