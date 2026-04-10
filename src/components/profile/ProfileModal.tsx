"use client";

import React from "react";
import { MapPin, MessageSquare, User2, Users, X } from "lucide-react";
import { UserProfile } from "@/lib/AppContext";
import { REGION_DATA } from "@/lib/constants";

interface ProfileModalProps {
  currentUser: UserProfile;
  profile: UserProfile;
  loading?: boolean;
  error?: string;
  saveError?: string;
  isOpen: boolean;
  isCurrentUser: boolean;
  editProfileOpen: boolean;
  isSaving?: boolean;
  setEditProfileOpen: (value: boolean) => void;
  editNickname: string;
  setEditNickname: (value: string) => void;
  editAgeGroup: string;
  setEditAgeGroup: (value: string) => void;
  editGender: string;
  setEditGender: (value: string) => void;
  editLocation: string;
  setEditLocation: (value: string) => void;
  editSido: string;
  setEditSido: (value: string) => void;
  editSigungu: string;
  setEditSigungu: (value: string) => void;
  onOpenEdit: () => void;
  onClose: () => void;
  onSaveProfile: () => void | Promise<void>;
  onStartChat: () => void;
}

export default function ProfileModal(props: ProfileModalProps) {
  const {
    profile,
    loading,
    error,
    saveError,
    isOpen,
    isCurrentUser,
    editProfileOpen,
    isSaving,
    setEditProfileOpen,
    editNickname,
    setEditNickname,
    editAgeGroup,
    setEditAgeGroup,
    editGender,
    setEditGender,
    setEditLocation,
    editSido,
    setEditSido,
    editSigungu,
    setEditSigungu,
    onOpenEdit,
    onClose,
    onSaveProfile,
    onStartChat,
  } = props;

  if (!isOpen) return null;

  const ageGroups = ["10대", "20대", "30대", "40대", "50대+"];
  const genders = ["남성", "여성"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="relative h-24 bg-hp-600">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/30 p-1 text-white hover:bg-white/40"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative px-6 pb-6 text-center">
          <div className="absolute left-1/2 top-0 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-hp-100 bg-white text-2xl font-bold text-hp-600 shadow-sm">
            {profile.nickname?.substring(0, 1) || "U"}
          </div>

          {(loading || error) && (
            <div className="pt-14">
              {loading && <p className="text-xs text-slate-400">프로필 정보를 불러오는 중입니다.</p>}
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
          )}

          {editProfileOpen ? (
            <div className="flex flex-col gap-3 pt-14 text-left">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">닉네임</label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(event) => setEditNickname(event.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-hp-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">연령대</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {ageGroups.map((ageGroup) => (
                    <button
                      key={ageGroup}
                      type="button"
                      onClick={() => setEditAgeGroup(ageGroup)}
                      className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                        editAgeGroup === ageGroup
                          ? "bg-hp-600 text-white"
                          : "border border-hp-200 bg-white text-slate-500 hover:border-hp-400"
                      }`}
                    >
                      {ageGroup}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">성별</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {genders.map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setEditGender(gender)}
                      className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                        editGender === gender
                          ? "bg-hp-600 text-white"
                          : "border border-hp-200 bg-white text-slate-500 hover:border-hp-400"
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">지역</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editSido}
                    onChange={(event) => {
                      const nextSido = event.target.value;
                      setEditSido(nextSido);
                      setEditSigungu("");
                      setEditLocation(nextSido);
                    }}
                    className="appearance-none rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-hp-500"
                  >
                    <option value="">시/도 선택</option>
                    {Object.keys(REGION_DATA).map((sido) => (
                      <option key={sido} value={sido}>
                        {sido}
                      </option>
                    ))}
                  </select>

                  <select
                    value={editSigungu}
                    onChange={(event) => {
                      const nextSigungu = event.target.value;
                      setEditSigungu(nextSigungu);
                      setEditLocation(`${editSido} ${nextSigungu}`.trim());
                    }}
                    disabled={!editSido}
                    className="appearance-none rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-hp-500 disabled:opacity-40"
                  >
                    <option value="">시/군/구 선택</option>
                    {(REGION_DATA[editSido] || []).map((sigungu) => (
                      <option key={sigungu} value={sigungu}>
                        {sigungu}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {saveError && <p className="text-xs text-red-500">{saveError}</p>}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  disabled={isSaving}
                  className="flex-1 rounded-xl border border-hp-200 py-2.5 text-sm font-bold text-hp-600 hover:bg-hp-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => void onSaveProfile()}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-hp-600 py-2.5 text-sm font-bold text-white hover:bg-hp-700 disabled:cursor-not-allowed disabled:bg-hp-400"
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center pt-14">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                {profile.nickname}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                  {profile.name}
                </span>
              </h3>

              <div className="mt-4 flex w-full flex-col gap-2 text-sm text-slate-600">
                {profile.email && (
                  <p className="flex items-center gap-2">
                    <User2 size={16} />
                    {profile.email}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Users size={16} />
                  {profile.ageGroup}
                </p>
                <p className="flex items-center gap-2">
                  <Users size={16} />
                  {profile.gender}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={16} />
                  {profile.location}
                </p>
              </div>

              {isCurrentUser ? (
                <button
                  onClick={onOpenEdit}
                  className="mt-6 w-full rounded-xl bg-hp-600 py-2.5 font-bold text-white transition-colors hover:bg-hp-700"
                >
                  프로필 수정하기
                </button>
              ) : (
                <button
                  onClick={onStartChat}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-hp-600 py-2.5 font-bold text-white"
                >
                  <MessageSquare size={18} />
                  1:1 채팅하기
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
