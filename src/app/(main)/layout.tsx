"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Client } from "@stomp/stompjs";
import MainSidebar from "@/shared/components/layout/MainSidebar";
import ProfileModal from "@/shared/components/profile/ProfileModal";
import WritePostModal from "@/features/boards/components/WritePostModal";
import ScheduleNotificationModal from "@/features/calendar/components/ScheduleNotificationModal";
import ConfirmModal from "@/shared/components/common/ConfirmModal";
import { useApp } from "@/shared/context/AppContext";
import { createUserProfile, getUserProfile } from "@/features/mypage/api/profile";
import { listCalendarEvents } from "@/features/calendar/api/calendar";
import { listNotifications } from "@/features/notifications/api/notifications";
import {
  createChatClient,
  enterChatRoom,
  getMyChatRooms,
  markChatRoomAsRead,
} from "@/services/realtime/stomp";
import type {
  EventType,
  NotificationResponse,
  UserProfile,
} from "@/entities/common/types";
import { toast } from "sonner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser,
    isAuthenticated,
    authReady,
    logout,
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
    setSelectedTags, 
    createChatRoom,
    setCreateChatRoom,
    setIsOnlineStudy,
    searchKeyword,  
    setSearchKeyword,   
    searchResults,       
    setSearchResults,
  } = useApp();

  const [profileRemote, setProfileRemote] = useState<UserProfile | null>(null);
  const [profileRemoteLoading, setProfileRemoteLoading] = useState(false);
  const [profileRemoteError, setProfileRemoteError] = useState("");
  const chatClientRef = useRef<Client | null>(null);
  const chatRoomIdsKey = chatRooms.map((room) => room.id).join(",");

  const [showScheduleNotify, setShowScheduleNotify] = useState(false);
  const [startingEvents, setStartingEvents] = useState<EventType[]>([]);
  const [endingEvents, setEndingEvents] = useState<EventType[]>([]);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const activeChatRoomIdRef = useRef(activeChatRoomId);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    activeChatRoomIdRef.current = activeChatRoomId;
  }, [activeChatRoomId]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const ready = authReady && isAuthenticated && !!currentUser;

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
    if (authReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authReady, isAuthenticated, router]);

  useEffect(() => {
    if (ready && currentUser?.id) {
      void refreshNotifications();
    }
  }, [ready, currentUser?.id]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!authReady || !currentUser?.id) return;

    const checkSchedules = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const todayStrLocal = `${year}-${month}-${day}`;

        const hideUntil = localStorage.getItem(`hp_hide_schedule_notify_${currentUser.id}`);
        if (hideUntil === todayStrLocal) return;

        const allEvents = await listCalendarEvents(String(currentUser.id));
        setEvents(allEvents);

        const starting = allEvents.filter((event) => {
          if (!event.startDate) return false;
          return event.startDate.split("T")[0] === todayStrLocal;
        });

        const ending = allEvents.filter((event) => {
          if (!event.endDate) return false;
          return event.endDate.split("T")[0] === todayStrLocal;
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
          setProfileRemoteError(
            error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.",
          );
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
        const rooms = await getMyChatRooms();
        if (cancelled) return;

        setChatRooms(rooms);
        setActiveChatRoomId((prev) => prev ?? (rooms[0]?.id ?? null));
      } catch (error) {
        console.error("Failed to load chat rooms:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, currentUser?.id, setActiveChatRoomId, setChatRooms]);

  useEffect(() => {
    if (!currentUser?.id) return;
    
    const client = createChatClient(
      Number(currentUser.id),
      chatRooms.map((room) => Number(room.id)).filter(Number.isFinite),
      (newMessage) => {
        if (newMessage.type === "READ") {
          setChatRooms((prev) =>
            prev.map((room) => {
              if (Number(room.id) !== Number(newMessage.roomId)) return room;

              const readerIsCurrentUser =
                Number(newMessage.senderId) === Number(currentUser?.id);
              const isPersonalRoom = room.type === "PERSONAL";

              return {
                ...room,
                unreadCount: readerIsCurrentUser ? 0 : room.unreadCount,
                messages: room.messages.map((message) => {
                  if (readerIsCurrentUser) {
                    return message;
                  }

                  return Number(message.senderId) === Number(currentUser?.id)
                    ? {
                        ...message,
                        unreadCount: isPersonalRoom
                          ? 0
                          : Math.max(0, (message.unreadCount ?? 1) - 1),
                      }
                    : message;
                }),
              };
            }),
          );
          return;
        }

        if (newMessage.type === "JOIN_REQUEST") {
          setChatRooms((prev) =>
            prev.map((room) => {
              if (Number(room.id) !== Number(newMessage.roomId)) return room;
              const alreadyExists = room.participants?.some(
                (participant) => participant.userId === newMessage.senderId,
              );
              if (alreadyExists) return room;
              return {
                ...room,
                participants: [
                  ...(room.participants ?? []),
                  {
                    userId: newMessage.senderId,
                    nickname: newMessage.senderName ?? "",
                    status: "PENDING",
                  },
                ],
              };
            }),
          );
          setNotifications((prev) => [
        {
          id: Date.now(),
          type: "CHAT",
          targetType: "CHAT",
          targetId: newMessage.roomId,
          message: `${newMessage.senderName ?? "누군가"}님이 채팅방 참여를 요청했습니다.`,
          isRead: false,
          createdAt: new Date().toISOString(),
          senderNickname: newMessage.senderName ?? "",
          content: "",
        },
        ...prev,
      ]);
          
          
          return;
        }

        if (newMessage.type === "APPROVE") {
          setChatRooms((prev) =>
            prev.map((room) => {
              if (Number(room.id) !== Number(newMessage.roomId)) return room;
              return {
                ...room,
                participants: room.participants?.map((participant) =>
                  participant.userId === newMessage.senderId
                    ? { ...participant, status: "JOINED" }
                    : participant,
                ),
              };
            }),
          );
          return;
        }

        if (
          newMessage.type === "TALK" &&
          pathnameRef.current.startsWith("/chat") &&
          String(activeChatRoomIdRef.current) === String(newMessage.roomId) &&
          Number(newMessage.senderId) !== Number(currentUser?.id)
        ) {
          void markChatRoomAsRead(Number(newMessage.roomId)).catch((error) => {
            console.error("Failed to mark chat room as read:", error);
          });
        }

        if (newMessage.type === "TALK" && Number(newMessage.senderId) !== Number(currentUser?.id)) {
          if (Notification.permission === "granted" && document.hidden) {
            new Notification(newMessage.senderName ?? "새 메시지", {
              body: newMessage.message,
              icon: "/favicon.ico",
            });
            
          }

          if (!document.hidden) {
            toast(newMessage.senderName ?? "새 메시지", {
              description: newMessage.message,
              position: "bottom-right",
              style: {
                background: "#fdfdfd",
                color: "#000000",
                padding: "12px 16px",
                boxShadow: "0 8px 30px rgba(0, 2, 3, 0.15)",
              },
              actionButtonStyle: {
                background: "#fafafa",
                color: "black",
                borderRadius: "8px",
                border: "none",
              },
              action: {
                label: "채팅 보기",
                onClick: () => router.push("/chat"),
              },
            });
          }
        }

        setChatRooms((prev) =>
          prev.map((room) => {
            if (Number(room.id) !== Number(newMessage.roomId)) return room;

            const roomMessages = Array.isArray(room.messages) ? room.messages : [];
            const alreadyExists = roomMessages.some(
              (message) => Number(message.id) === Number(newMessage.id),
            );
            const nextUnread =
              pathnameRef.current.startsWith("/chat") &&
              String(activeChatRoomIdRef.current) === String(room.id)
                ? 0
                : Number(newMessage.senderId) === Number(currentUser?.id)
                  ? (room.unreadCount ?? 0)
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
      (newNotification) => {
        console.log("[noti] received:", newNotification);
        setNotifications((prev) => [newNotification, ...prev]);

        const notiType = String(newNotification.type).toUpperCase();
        console.log("[noti] type:", notiType);
        if (notiType === "COMMENT" || notiType === "LIKE") {
          const targetPath =
            newNotification.targetType === "STUDY"
              ? `/study/${newNotification.targetId}`
              : newNotification.targetType === "FREE"
                ? `/free/${newNotification.targetId}`
                : null;

          console.log("[noti] calling toast, targetPath:", targetPath);
          toast(newNotification.senderNickname, {
            description: newNotification.message,
            ...(targetPath && {
              action: {
                label: "보기",
                onClick: () => router.push(targetPath),
              },
            }),
          });
        }
        if (newNotification.targetType === "CHAT" && newNotification.message?.includes("승인")) {
        setChatRooms((prev) =>
          prev.map((room) =>
            String(room.id) === String(newNotification.targetId)
              ? {
                  ...room,
                  participants: room.participants?.map((p) =>
                    Number(p.userId) === Number(currentUser?.id)
                      ? { ...p, status: "JOINED" }
                      : p,
                  ),
                }
              : room,
          ),
        );
      }

      if (newNotification.targetType === "CHAT" && newNotification.message?.includes("거절")) {
        setChatRooms((prev) =>
          prev.filter((room) => String(room.id) !== String(newNotification.targetId)),
        );
        setActiveChatRoomId((prev) =>
          String(prev) === String(newNotification.targetId) ? null : prev,
        );
      }
    },
  );

    client.activate();
    chatClientRef.current = client;
    setChatClient(client);

    return () => {
      chatClientRef.current = null;
      setChatClient(null);
      void client.deactivate();
    };
  }, [chatRoomIdsKey, currentUser?.id, router, setChatClient, setChatRooms]);

  if (!ready || !currentUser) return null;
  const isAdminPath = pathname.startsWith("/admin");

  const getProfileById = (profileId: string) => {
    if (profileId === currentUser.id) return currentUser;

    const chatProfile = chatRooms.find((room) => room.partnerId === profileId);
    if (chatProfile) {
      return createUserProfile({
        id: chatProfile.partnerId ?? profileId,
        nickname: chatProfile.partnerNickname ?? "사용자",
        name: chatProfile.partnerNickname ?? "사용자",
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
    setSelectedTags([]); 
    setSearchKeyword("");
    setSearchResults([]);
    setIsOnlineStudy(false);
  };

  return (
    <div className="flex h-screen bg-hp-50 font-sans text-slate-800">
      {!isAdminPath && (
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
      )}

      <main
        className={`app-scroll-container relative flex-1 transition-opacity ${isAdminPath ? "p-0" : "p-4 md:p-8"} ${showNotifications ? "opacity-30 pointer-events-none" : "opacity-100"}`}
      >
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
            if (pathname !== "/chat") {
              router.push("/chat");
            }
            return;
          }

          try {
            if (!/^\d+$/.test(String(profile.id).trim())) {
              toast.error("채팅 상대 사용자 정보를 확인할 수 없습니다.");
              return;
            }

            const dbRoom = await enterChatRoom(profile.id);

            setChatRooms((prev) => {
              const isIncluded = prev.some((room) => room.id === dbRoom.id);
              return isIncluded ? prev : [...prev, dbRoom];
            });
            setActiveChatRoomId(dbRoom.id);
            setProfileModal(null);
            if (pathname !== "/chat") {
              router.push("/chat");
            }
          } catch (error) {
            console.error("Failed to start chat:", error);
            toast.error(error instanceof Error ? error.message : "채팅방 생성에 실패했습니다.");
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
        createChatRoom={createChatRoom}
        setCreateChatRoom={setCreateChatRoom}
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
          const month = String(now.getMonth() + 1).padStart(2, "0");
          const day = String(now.getDate()).padStart(2, "0");
          const todayStrLocal = `${year}-${month}-${day}`;
          localStorage.setItem(`hp_hide_schedule_notify_${currentUser.id}`, todayStrLocal);
          setShowScheduleNotify(false);
        }}
      />

      <ConfirmModal
        isOpen={logoutConfirmOpen}
        badge="Logout"
        title="로그아웃하시겠습니까?"
        description="확인을 누르면 현재 계정에서 로그아웃됩니다."
        confirmLabel="로그아웃"
        onConfirm={() => { setLogoutConfirmOpen(false); logout(); }}
        onClose={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
}
