"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import { Client } from "@stomp/stompjs";
import MainSidebar from "@/shared/components/layout/MainSidebar";
import ProfileModal from "@/shared/components/profile/ProfileModal";
import WritePostModal from "@/features/boards/components/WritePostModal";
import ScheduleNotificationModal from "@/features/calendar/components/ScheduleNotificationModal";
import { useApp } from "@/shared/context/AppContext";
import { createUserProfile, getUserProfile } from "@/features/mypage/api/profile";
import { listCalendarEvents } from "@/features/calendar/api/calendar";
import { listNotifications } from "@/features/notifications/api/notifications";
import { CHAT_API_BASE_URL, KAKAO_MAP_APPKEY } from "@/services/config/config";
import { createChatClient } from "@/services/realtime/stomp";
import { waitForKakaoServices } from "@/shared/utils/kakao";
import type {
  EventType,
  NotificationResponse,
  SearchPlace,
  UserProfile,
} from "@/entities/common/types";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser,
    isAuthenticated,
    authReady,
    logout,
    events,
    setEvents,
    chatRooms,
    setChatRooms,
    activeChatRoomId,
    setActiveChatRoomId,
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
    searchKeyword,
    setSearchKeyword,
    searchResults,
    setSearchResults,
  } = useApp();

  const [loadingKakao, errorKakao] = useKakaoLoader({
    appkey: KAKAO_MAP_APPKEY,
    libraries: ["services", "clusterer"],
  });

  const [profileRemote, setProfileRemote] = useState<UserProfile | null>(null);
  const [profileRemoteLoading, setProfileRemoteLoading] = useState(false);
  const [profileRemoteError, setProfileRemoteError] = useState("");
  const chatClientRef = useRef<Client | null>(null);
  const chatRoomIdsKey = chatRooms.map((room) => room.id).join(",");

  const [showScheduleNotify, setShowScheduleNotify] = useState(false);
  const [startingEvents, setStartingEvents] = useState<EventType[]>([]);
  const [endingEvents, setEndingEvents] = useState<EventType[]>([]);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // 알림 상태 추가
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const ready = authReady && isAuthenticated && !!currentUser;

  // 알림 목록 새로고침 함수
  const refreshNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const data = await listNotifications(String(currentUser.id));
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };


  useEffect(() => {
    if (authReady && !isAuthenticated) router.replace("/login");
  }, [authReady, isAuthenticated, router]);

    // 초기 알림 로드
  useEffect(() => {
    if (ready && currentUser?.id) {
      void refreshNotifications();
    }
  }, [ready, currentUser?.id]);

  useEffect(() => {
    if (!authReady || !currentUser?.id) return;

    const checkSchedules = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStrLocal = `${year}-${month}-${day}`;

        // Only show if not hidden for today
        const hideUntil = localStorage.getItem(`hp_hide_schedule_notify_${currentUser.id}`);
        if (hideUntil === todayStrLocal) return;

        const allEvents = await listCalendarEvents(String(currentUser.id));
        setEvents(allEvents);

        const starting = allEvents.filter(ev => {
          if (!ev.startDate) return false;
          const evStart = ev.startDate.split('T')[0];
          return evStart === todayStrLocal;
        });

        const ending = allEvents.filter(ev => {
          if (!ev.endDate) return false;
          const evEnd = ev.endDate.split('T')[0];
          return evEnd === todayStrLocal;
        });

        if (starting.length > 0 || ending.length > 0) {
          setStartingEvents(starting);
          setEndingEvents(ending);
          setShowScheduleNotify(true);
        }
      } catch (error) {
        console.error("Failed to check schedules:", error);
      }
    };

    void checkSchedules();
  }, [authReady, currentUser?.id, setEvents]);

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
        const response = await fetch(`${CHAT_API_BASE_URL}/chat/rooms?userId=${currentUser.id}`);
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
    if (!currentUser?.id) return;

    // createChatClient를 호출할 때 userId와 알림 콜백을 함께 전달합니다.
    const client = createChatClient(
      currentUser.id, 
      chatRooms.map((room) => Number(room.id)).filter(Number.isFinite), 
      (newMessage) => {
        // 기존 채팅 메시지 처리 로직
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
      },
      (newNoti) => {
        // 실시간 알림 수신 로직
        console.log("실시간 알림 도착 데이터 전체:", newNoti);
        setNotifications((prev) => [newNoti, ...prev]);
      }
    );

    client.activate();
    chatClientRef.current = client;
    setChatClient(client);

    return () => {
      chatClientRef.current = null;
      setChatClient(null);
      void client.deactivate();
    };
  }, [chatRoomIdsKey, currentUser?.id, setChatClient, setChatRooms]);

  if (!ready || !currentUser) return null;
  const isAdminPath = pathname.startsWith("/admin");

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

  const searchPlacesOnKakao = async () => {
    if (typeof window === "undefined") return;
    if (!KAKAO_MAP_APPKEY) {
      alert("카카오 지도 앱키가 설정되지 않았습니다. NEXT_PUBLIC_KAKAO_MAP_APPKEY를 확인해 주세요.");
      return;
    }
    try {
      const services = await waitForKakaoServices();
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
      return;
    } catch (error) {
      alert(error instanceof Error ? error.message : "지도 스크립트를 불러오지 못했습니다.");
      return;
    }
  };

  return (
    <div className="flex h-screen bg-hp-50 font-sans text-slate-800">
      <MainSidebar
        pathname={pathname}
        currentUser={currentUser}
        chatRooms={chatRooms}
        notifications={notifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        onRefreshNotifications={refreshNotifications}
        onNavigate={(href) => router.push(href)}
        onOpenProfile={() => setProfileModal(currentUser.id)}
        onLogout={() => setLogoutConfirmOpen(true)}
      />

      <main className={`app-scroll-container relative flex-1 ${isAdminPath ? "p-0" : "p-4 md:p-8"} transition-opacity ${showNotifications ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        {children}
      </main>

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
            setProfileModal(null);
            if (window.location.pathname !== "/chat") {
              router.push("/chat");
            }
          } else {
            try {
              const response = await fetch(
                `${CHAT_API_BASE_URL}/chat/room?userId=${currentUser.id}&partnerId=${profile.id}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                },
              );

              if (response.ok) {
                const dbRoom = await response.json();

                setChatRooms((prev) => {
                  const isIncluded = prev.some((room) => room.id === dbRoom.id);
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
          }
        }}
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

      <ScheduleNotificationModal
        isOpen={showScheduleNotify}
        startingEvents={startingEvents}
        endingEvents={endingEvents}
        onClose={() => setShowScheduleNotify(false)}
        onDontShowToday={() => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const todayStrLocal = `${year}-${month}-${day}`;
          localStorage.setItem(`hp_hide_schedule_notify_${currentUser.id}`, todayStrLocal);
          setShowScheduleNotify(false);
        }}
      />

      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Logout</p>
            <h3 className="mt-2 text-xl font-black text-slate-950">로그아웃하시겠습니까?</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              확인을 누르면 현재 계정에서 로그아웃됩니다.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  logout();
                }}
                className="rounded-full bg-hp-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-hp-700"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
