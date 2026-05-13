"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Client } from "@stomp/stompjs";
import MainSidebar from "@/shared/components/layout/MainSidebar";
import ProfileModal from "@/shared/components/profile/ProfileModal";
import WritePostModal from "@/shared/boards/components/WritePostModal";
import ScheduleNotificationModal from "@/features/calendar/components/ScheduleNotificationModal";
import ConfirmModal from "@/shared/components/common/ConfirmModal";
import { useApp } from "@/shared/context/AppContext";
import { createUserProfile, getUserProfile, updateUserAvatarVisual } from "@/features/mypage/api/profile";
import { listCalendarAlarms, markCalendarAlarmChecked } from "@/features/calendar/api/calendar";
import Avatar from "@/shared/components/common/Avatar";
import { listNotifications } from "@/features/notifications/api/notifications";
import {
  createChatClient,
  enterChatRoom,
  getChatRoomReadState,
  getMyChatRooms,
  markChatRoomAsRead,
} from "@/services/realtime/stomp";
import type {
  EventType,
  NotificationResponse,
  UserProfile,
} from "@/entities/common/types";
import { toast } from "sonner";
import { toUserMessage } from "@/shared/errors";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    authReady,
    logout,
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
    selectedTags,
    setSelectedTags,
    createChatRoom,
    setCreateChatRoom,
    setIsOnlineStudy,
    searchKeyword,
    setSearchKeyword,
    searchResults,
    setSearchResults,
    chatRoomsRefreshKey,
    isEditing, 
    setIsEditing 
  } = useApp();

  const [profileRemote, setProfileRemote] = useState<UserProfile | null>(null);
  const [profileRemoteLoading, setProfileRemoteLoading] = useState(false);
  const chatClientRef = useRef<Client | null>(null);
  const chatRoomIdsKey = chatRooms.map((room) => room.id).join(",");

  const [showScheduleNotify, setShowScheduleNotify] = useState(false);
  const [startingEvents, setStartingEvents] = useState<EventType[]>([]);
  const [endingEvents, setEndingEvents] = useState<EventType[]>([]);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [navConfirmOpen, setNavConfirmOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  
  const activeChatRoomIdRef = useRef(activeChatRoomId);
  const pathnameRef = useRef(pathname);
  const chatRoomsRef = useRef(chatRooms);
  const readStateTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    activeChatRoomIdRef.current = activeChatRoomId;
  }, [activeChatRoomId]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    chatRoomsRef.current = chatRooms;
  }, [chatRooms]);

  const refreshChatReadState = (roomId: number) => {
    const existingTimer = readStateTimersRef.current.get(roomId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      readStateTimersRef.current.delete(roomId);

      const targetRoom = chatRoomsRef.current.find((room) => Number(room.id) === roomId);
      const messageIds = (targetRoom?.messages ?? [])
        .map((message) => Number(message.id))
        .filter(Number.isFinite);

      if (messageIds.length === 0) return;

      void getChatRoomReadState(roomId, messageIds)
        .then((readState) => {
          const stateByMessageId = new Map(
            readState.messages.map((state) => [Number(state.messageId), state]),
          );

          setChatRooms((prevRooms) =>
            prevRooms.map((room) =>
              Number(room.id) !== roomId
                ? room
                : {
                    ...room,
                    messages: room.messages.map((message) => {
                      const state = stateByMessageId.get(Number(message.id));
                      return state
                        ? {
                            ...message,
                            unreadCount: state.unreadCount,
                            readBy: state.readers,
                          }
                        : message;
                    }),
                  },
            ),
          );
        })
        .catch((error) => {
          console.error("Failed to refresh chat read state:", error);
        });
    }, 350);

    readStateTimersRef.current.set(roomId, timer);
  };

  useEffect(() => {
    return () => {
      readStateTimersRef.current.forEach((timer) => clearTimeout(timer));
      readStateTimersRef.current.clear();
    };
  }, []);

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

        const alarmEvents = await listCalendarAlarms();
        if (alarmEvents.length === 0) return;

        const starting = alarmEvents.filter((event) => event.startDate?.split("T")[0] === todayStrLocal);
        const ending = alarmEvents.filter((event) => event.endDate?.split("T")[0] === todayStrLocal);

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
  }, [authReady, currentUser?.id]);

  useEffect(() => {
    if (!profileModal) {
      setProfileRemote(null);
      setProfileRemoteLoading(false);
      return;
    }

    let cancelled = false;
    setProfileRemoteLoading(true);

    void (async () => {
      try {
        const fetched = await getUserProfile(profileModal);
        if (!cancelled) {
          setProfileRemote(fetched);
        }
      } catch (error) {
        if (!cancelled) {
          setProfileRemote(null);
          toast.error(toUserMessage(error, "프로필을 불러오지 못했습니다."));
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

        const pinnedRoomId =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem("highpass-pinned-chat-room-id")
            : null;
        const nextRooms = pinnedRoomId
          ? rooms.map((room: any) =>
              String(room.id) === pinnedRoomId
                ? { ...room, sortPinnedAt: new Date().toISOString() }
                : room,
            )
          : rooms;

        if (pinnedRoomId && typeof window !== "undefined") {
          window.sessionStorage.removeItem("highpass-pinned-chat-room-id");
        }

        setChatRooms(nextRooms);
        setActiveChatRoomId((prev) => {
          const exists = prev != null && nextRooms.some((r: any) => String(r.id) === String(prev));
          return exists ? prev : (nextRooms[0]?.id ?? null);
        });
      } catch (error) {
        console.error("Failed to load chat rooms:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, currentUser?.id, chatRoomsRefreshKey, setActiveChatRoomId, setChatRooms]);

  useEffect(() => {
    if (!currentUser?.id) return;
    
    const client = createChatClient(
      Number(currentUser.id),
      chatRooms.map((room) => Number(room.id)).filter(Number.isFinite),
      (newMessage) => {
        if (newMessage.type === "READ") {
          const roomId = Number(newMessage.roomId);
          if (Number.isFinite(roomId)) {
            const readerIsCurrentUser = Number(newMessage.senderId) === Number(currentUser?.id);
            if (readerIsCurrentUser) {
              setChatRooms((prev) =>
                prev.map((room) =>
                  Number(room.id) === roomId ? { ...room, unreadCount: 0 } : room,
                ),
              );
            }

            refreshChatReadState(roomId);
          }
          return;
        }
        if (newMessage.type === "DELETE") {
        setChatRooms((prev) =>
          prev.map((room) =>
            Number(room.id) !== Number(newMessage.roomId) ? room : {
              ...room,
              messages: room.messages.map((m) =>
                Number(m.id) === Number(newMessage.id) ? { ...m, deleted: true } : m
              ),
              lastMessage: room.messages.at(-1)?.id === newMessage.id
                ? "메시지가 삭제되었습니다."
                : room.lastMessage,
            }
          )
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

        const isViewingIncomingChatRoom =
          pathnameRef.current.startsWith("/chat") &&
          String(activeChatRoomIdRef.current) === String(newMessage.roomId);

        if (
          newMessage.type === "TALK" &&
          isViewingIncomingChatRoom &&
          Number(newMessage.senderId) !== Number(currentUser?.id)
        ) {
          void markChatRoomAsRead(Number(newMessage.roomId)).catch((error) => {
            console.error("Failed to mark chat room as read:", error);
          });
        }

        if (newMessage.type === "TALK" && Number(newMessage.senderId) !== Number(currentUser?.id)) {
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted" &&
            document.hidden
          ) {
            new Notification(newMessage.senderName ?? "새 메시지", {
              body: newMessage.message,
              icon: "/favicon.ico",
            });
            
          }

          if (!isViewingIncomingChatRoom) {
            toast.custom((t) => (
            <div className="flex items-center gap-3 rounded-2xl border border-hp-100 bg-white px-4 py-3 shadow-lg">
              <Avatar
                name={newMessage.senderName}
                customVisualClassName={newMessage.senderAvatarVisualClassName ?? undefined}
                className="h-9 w-9 shrink-0 rounded-full text-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">{newMessage.senderName ?? "새 메시지"}</p>
                <p className="truncate text-xs text-slate-400">{newMessage.message}</p>
              </div>
              <button
                onClick={() => {
                  setActiveChatRoomId(String(newMessage.roomId));
                  toast.dismiss(t);
                  router.push("/chat");
                }}
                className="shrink-0 rounded-full bg-hp-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-hp-700"
              >
                보기
              </button>
            </div>
          ), { duration: 4000 });
          }
        }

        setChatRooms((prev) =>
          prev.map((room) => {
            if (Number(room.id) !== Number(newMessage.roomId)) return room;

            const roomMessages = Array.isArray(room.messages) ? room.messages : [];
            const alreadyExists =
              newMessage.id != null &&
              roomMessages.some(
                (message) => message.id != null && Number(message.id) === Number(newMessage.id),
              );
            const nextUnread =
              pathnameRef.current.startsWith("/chat") &&
              String(activeChatRoomIdRef.current) === String(room.id)
                ? 0
                : Number(newMessage.senderId) === Number(currentUser?.id)
                  ? (room.unreadCount ?? 0)
                  : (room.unreadCount ?? 0) + (alreadyExists ? 0 : 1);

            // STOMP TALK 메시지의 unreadCount는 발신자를 제외한 전체 참여자 수 기준이므로
            // currentUser 본인은 자신의 뷰에서 제외돼야 함 (API 로드값과 일치시키기 위해 -1)
            const incomingMessage =
              !alreadyExists &&
              newMessage.type === "TALK" &&
              Number(newMessage.senderId) !== Number(currentUser?.id)
                ? { ...newMessage, unreadCount: Math.max(0, (newMessage.unreadCount ?? 0) - 1) }
                : newMessage;

            return {
              ...room,
              ...(newMessage.type === "NOTICE" && newMessage.roomName ? { name: newMessage.roomName } : {}),
              ...(newMessage.type === "NOTICE" && newMessage.newOwnerId ? { ownerId: newMessage.newOwnerId } : {}),
              messages: alreadyExists ? roomMessages : [...roomMessages, incomingMessage],
              lastMessage: newMessage.message,
              lastMessageAt: newMessage.createdAt ?? room.lastMessageAt,
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
  const profileIsDeleted =
    profile.status?.toLowerCase() === "deleted" || profile.nickname === "탈퇴한 계정";

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
    <div className="flex h-screen overflow-hidden bg-hp-50 font-sans text-slate-800">
      {!isAdminPath && (
        <MainSidebar
          pathname={pathname}
          currentUser={currentUser}
          chatRooms={chatRooms}
          notifications={notifications}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          onRefreshNotifications={refreshNotifications}
          onNavigate={(href) => {
            if (isEditing) {
                setPendingHref(href);
                setNavConfirmOpen(true);
                return;
              }
            router.push(href)}}
          onOpenProfile={() => setProfileModal(currentUser.id)}
          onLogout={() => setLogoutConfirmOpen(true)}
        />
      )}

      <main
        className={`app-scroll-container relative flex-1 ${isAdminPath ? "p-0" : "p-4 md:p-8"}`}
      >
        {children}
      </main>

      <ProfileModal
        profile={profile}
        loading={profileRemoteLoading}
        isOpen={!!profileModal}
        isCurrentUser={profile.id === currentUser.id}
        onOpenEdit={() => {
          setProfileModal(null);
          router.push("/mypage");
        }}
        onClose={() => setProfileModal(null)}
        onStartChat={async () => {
          if (profileIsDeleted) {
            toast.error("탈퇴한 계정과는 채팅할 수 없습니다.");
            return;
          }

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

            const dbRoom = {
              ...(await enterChatRoom(profile.id)),
              sortPinnedAt: new Date().toISOString(),
            };

            setChatRooms((prev) => {
              const isIncluded = prev.some((room) => room.id === dbRoom.id);
              return isIncluded ? prev : [dbRoom, ...prev];
            });
            setActiveChatRoomId(dbRoom.id);
            setProfileModal(null);
            if (pathname !== "/chat") {
              router.push("/chat");
            }
          } catch (error) {
            console.error("Failed to start chat:", error);
            toast.error(toUserMessage(error, "채팅방 생성에 실패했습니다."));
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
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
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
          markCalendarAlarmChecked().catch(() => {});
          setShowScheduleNotify(false);
        }}
      />

      <ConfirmModal
        isOpen={logoutConfirmOpen}
        title="로그아웃하시겠습니까?"
        description="확인을 누르면 현재 계정에서 로그아웃됩니다."
        confirmLabel="로그아웃"
        onConfirm={() => { setLogoutConfirmOpen(false); logout(); }}
        onClose={() => setLogoutConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={navConfirmOpen}
        title="페이지를 이동하시겠습니까?"
        description="변경사항이 저장되지 않습니다."
        confirmLabel="이동"
        variant="danger"
        onConfirm={() => {
          setNavConfirmOpen(false);
          setIsEditing(false);
          if (pendingHref) router.push(pendingHref);
          setPendingHref(null);
        }}
        onClose={() => {
          setNavConfirmOpen(false);
          setPendingHref(null);
        }}
      />
    </div>
  );
}
