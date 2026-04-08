"use client";

import React from "react";
import { MapPin, MessageSquare, Users, X } from "lucide-react";
import { UserProfile } from "@/lib/AppContext";
import { REGION_DATA } from "@/lib/constants";

interface ProfileModalProps {
  currentUser: UserProfile;
  profile: UserProfile;
  loading?: boolean;
  error?: string;
  isOpen: boolean;
  isCurrentUser: boolean;
  editProfileOpen: boolean;
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
  onClose: () => void;
  onSaveProfile: () => void;
  onStartChat: () => void;
}

export default function ProfileModal(props: ProfileModalProps) {
  const {
    currentUser,
    profile,
    loading,
    error,
    isOpen,
    isCurrentUser,
    editProfileOpen,
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
    onClose,
    onSaveProfile,
    onStartChat,
  } = props;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-hp-600 h-24 relative">
          <button onClick={onClose} className="absolute top-3 right-3 rounded-full bg-white/30 p-1">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pb-6 relative text-center">
          <div className="w-20 h-20 bg-white rounded-full border-4 border-hp-100 absolute -top-10 left-1/2 -translate-x-1/2 flex items-center justify-center text-hp-600 font-bold text-2xl shadow-sm">
            {profile.nickname.substring(0, 1)}
          </div>
          {(loading || error) && (
            <div className="pt-14">
              {loading && <p className="text-xs text-slate-400">프로필 불러오는 중...</p>}
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
          )}
          {editProfileOpen ? (
            <div className="pt-14 flex flex-col gap-3 text-left">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">닉네임</label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">연령대</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {["10대", "20대", "30대", "40대", "50대+"].map((ageGroup) => (
                    <button
                      type="button"
                      key={ageGroup}
                      onClick={() => setEditAgeGroup(ageGroup)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        editAgeGroup === ageGroup
                          ? "bg-hp-600 text-white"
                          : "bg-white border border-hp-200 text-slate-500 hover:border-hp-400"
                      }`}
                    >
                      {ageGroup}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">성별</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["남성", "여성", "기타"].map((gender) => (
                    <button
                      type="button"
                      key={gender}
                      onClick={() => setEditGender(gender)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        editGender === gender
                          ? "bg-hp-600 text-white"
                          : "bg-white border border-hp-200 text-slate-500 hover:border-hp-400"
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">지역</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editSido}
                    onChange={(e) => {
                      setEditSido(e.target.value);
                      setEditSigungu("");
                      setEditLocation(e.target.value);
                    }}
                    className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500 appearance-none"
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
                    onChange={(e) => {
                      setEditSigungu(e.target.value);
                      setEditLocation(`${editSido} ${e.target.value}`);
                    }}
                    disabled={!editSido}
                    className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500 appearance-none disabled:opacity-40"
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
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setEditProfileOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-hp-200 text-sm font-bold text-hp-600 hover:bg-hp-50"
                >
                  취소
                </button>
                <button
                  onClick={onSaveProfile}
                  className="flex-1 py-2.5 rounded-xl bg-hp-600 text-white text-sm font-bold hover:bg-hp-700"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-14 flex flex-col items-center">
              <h3 className="text-xl font-bold flex gap-2">
                {profile.nickname}
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-normal">{profile.name}</span>
              </h3>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
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
                  onClick={() => {
                    setEditNickname(currentUser.nickname);
                    setEditAgeGroup(currentUser.ageGroup);
                    setEditGender(currentUser.gender);
                    setEditLocation(currentUser.location);
                    setEditProfileOpen(true);
                  }}
                  className="w-full mt-6 bg-hp-600 text-white py-2.5 rounded-xl font-bold hover:bg-hp-700 transition-colors"
                >
                  프로필 수정하기
                </button>
              ) : (
                <button
                  onClick={onStartChat}
                  className="w-full mt-6 bg-hp-600 text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2"
                >
                  <MessageSquare size={18} /> 1:1 채팅하기
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
