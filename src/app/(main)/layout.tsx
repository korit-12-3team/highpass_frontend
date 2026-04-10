"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import MainSidebar from "@/components/layout/MainSidebar";
import ProfileModal from "@/components/profile/ProfileModal";
import WritePostModal from "@/components/post/WritePostModal";
import { SearchPlace, UserProfile, useApp } from "@/lib/AppContext";
import { REGION_DATA } from "@/lib/constants";
import { updateUserProfile } from "@/lib/profile";
import { getUserProfile } from "@/lib/users";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser,
    isAuthenticated,
    authReady,
    logout,
    setCurrentUser,
    boardData,
    chatRooms,
    setChatRooms,
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
  } = useApp();

  const [loadingKakao, errorKakao] = useKakaoLoader({
    appkey: "894423a9ffcffb29a1e5d50427ded82e",
    libraries: ["services", "clusterer"],
  });

  const [profileRemote, setProfileRemote] = useState<UserProfile | null>(null);
  const [profileRemoteLoading, setProfileRemoteLoading] = useState(false);
  const [profileRemoteError, setProfileRemoteError] = useState("");
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");

  useEffect(() => {
    if (authReady && !isAuthenticated) router.replace("/login");
  }, [authReady, isAuthenticated, router]);

  const ready = authReady && isAuthenticated && !!currentUser;

  const getProfileById = (profileId: string): UserProfile => {
    if (!currentUser) {
      return {
        id: profileId,
        nickname: "사용자",
        name: "사용자",
        ageGroup: "미등록",
        gender: "미등록",
        location: "미등록",
      };
    }

    if (profileId === currentUser.id) return currentUser;

    const boardProfile = boardData.find((post) => post.authorId === profileId);
    if (boardProfile) {
      return {
        id: boardProfile.authorId,
        nickname: boardProfile.author,
        name: boardProfile.author,
        ageGroup: "미등록",
        gender: "미등록",
        location: boardProfile.location || "미등록",
      };
    }

    const chatProfile = chatRooms.find((room) => room.partnerId === profileId);
    if (chatProfile) {
      return {
        id: chatProfile.partnerId,
        nickname: chatProfile.partnerNickname,
        name: chatProfile.partnerNickname,
        ageGroup: "미등록",
        gender: "미등록",
        location: "미등록",
      };
    }

    return {
      id: profileId,
      nickname: "알 수 없음",
      name: "알 수 없음",
      ageGroup: "미등록",
      gender: "미등록",
      location: "미등록",
    };
  };

  useEffect(() => {
    if (!currentUser) return;
    if (!profileModal) {
      setProfileRemote(null);
      setProfileRemoteError("");
      setProfileRemoteLoading(false);
      setProfileSaveError("");
      return;
    }

    let cancelled = false;
    setProfileRemoteLoading(true);
    setProfileRemoteError("");

    (async () => {
      try {
        const fetched = await getUserProfile(profileModal);
        if (cancelled) return;
        setProfileRemote(fetched);
      } catch (e) {
        if (cancelled) return;
        setProfileRemote(null);
        setProfileRemoteError(e instanceof Error ? e.message : "프로필을 불러오지 못했습니다.");
      } finally {
        if (cancelled) return;
        setProfileRemoteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileModal, currentUser]);

  if (!ready || !currentUser) return null;

  const baseProfile = profileModal ? getProfileById(profileModal) : currentUser;
  const profile =
    profileModal && profileRemote && profileRemote.id === baseProfile.id ? profileRemote : baseProfile;

  const openEditProfile = () => {
    const [initialSido = "", initialSigungu = ""] = (currentUser.location || "").split(" ").filter(Boolean);
    const normalizedSigungu =
      initialSido && (REGION_DATA[initialSido] || []).includes(initialSigungu) ? initialSigungu : "";

    setEditNickname(currentUser.nickname);
    setEditAgeGroup(currentUser.ageGroup);
    setEditGender(currentUser.gender);
    setEditSido(initialSido);
    setEditSigungu(normalizedSigungu);
    setEditLocation([initialSido, normalizedSigungu].filter(Boolean).join(" ").trim() || currentUser.location);
    setProfileSaveError("");
    setEditProfileOpen(true);
  };

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
        currentUser={currentUser}
        profile={profile}
        loading={profileRemoteLoading}
        error={profileRemoteError}
        saveError={profileSaveError}
        isOpen={!!profileModal}
        isCurrentUser={profile.id === currentUser.id}
        editProfileOpen={editProfileOpen}
        isSaving={profileSaveLoading}
        setEditProfileOpen={setEditProfileOpen}
        editNickname={editNickname}
        setEditNickname={setEditNickname}
        editAgeGroup={editAgeGroup}
        setEditAgeGroup={setEditAgeGroup}
        editGender={editGender}
        setEditGender={setEditGender}
        editLocation={editLocation}
        setEditLocation={setEditLocation}
        editSido={editSido}
        setEditSido={setEditSido}
        editSigungu={editSigungu}
        setEditSigungu={setEditSigungu}
        onOpenEdit={openEditProfile}
        onClose={() => {
          setProfileModal(null);
          setEditProfileOpen(false);
          setProfileSaveError("");
        }}
        onSaveProfile={async () => {
          if (!currentUser) return;

          const nickname = editNickname.trim();
          const ageRange = editAgeGroup.trim();
          const gender = editGender.trim();
          const siDo = editSido.trim();
          const gunGu = editSigungu.trim();

          if (!nickname || !ageRange || !gender || !siDo || !gunGu) {
            setProfileSaveError("닉네임, 연령대, 성별, 지역을 모두 입력해 주세요.");
            return;
          }

          setProfileSaveLoading(true);
          setProfileSaveError("");

          try {
            const updated = await updateUserProfile(currentUser.id, {
              nickname,
              ageRange,
              gender,
              siDo,
              gunGu,
            });

            setCurrentUser((prev) =>
              prev
                ? {
                    ...prev,
                    ...updated,
                    name: prev.name,
                  }
                : prev,
            );
            setProfileRemote(updated);
            setEditLocation(updated.location);
            setEditProfileOpen(false);
            setProfileModal(null);
          } catch (e) {
            setProfileSaveError(e instanceof Error ? e.message : "프로필 수정에 실패했습니다.");
          } finally {
            setProfileSaveLoading(false);
          }
        }}
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
          setEditProfileOpen(false);
          setProfileSaveError("");
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
