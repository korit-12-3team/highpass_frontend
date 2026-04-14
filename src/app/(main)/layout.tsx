"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import MainSidebar from "@/components/layout/MainSidebar";
import ProfileModal from "@/components/profile/ProfileModal";
import WritePostModal from "@/components/post/WritePostModal";
import { useApp } from "@/lib/AppContext";
import { createUserProfile, getUserProfile } from "@/lib/profile";
import type { SearchPlace, UserProfile } from "@/lib/types";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser,
    isAuthenticated,
    authReady,
    logout,
    boardData,
    chatRooms,
    setChatRooms,
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

  const ready = authReady && isAuthenticated && !!currentUser;
  if (!ready || !currentUser) return null;

  const getProfileById = (profileId: string) => {
    if (profileId === currentUser.id) return currentUser;

    const boardProfile = boardData.find((post) => post.authorId === profileId);
    if (boardProfile) {
      return createUserProfile({
        id: boardProfile.authorId,
        nickname: boardProfile.author,
        name: boardProfile.author,
        location: boardProfile.location ?? "",
      });
    }

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

      <main className="relative flex-1 overflow-y-auto p-4 md:p-8">{children}</main>

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
        onStartChat={() => {
          const existing = chatRooms.find((room) => room.partnerId === profile.id);
          if (existing) {
            setActiveChatRoomId(existing.id);
          } else {
            const newRoom = {
              id: `chat_${Date.now()}`,
              partnerId: profile.id,
              partnerNickname: profile.nickname,
              messages: [],
            };
            setChatRooms((prev) => [...prev, newRoom]);
            setActiveChatRoomId(newRoom.id);
          }
          setProfileModal(null);
          router.push("/chat");
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
    </div>
  );
}
