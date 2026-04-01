"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface UserProfileProps {
  nickname: string;
  age: string;
  gender: string;
  region: string;
  createdAt: string;
}

export default function UserProfileCard({ profile }: { profile: UserProfileProps }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // 테스트용: 무조건 채팅방 1번으로 라우팅 (실제로는 API 연동 필요)
  const handleChatStart = () => {
    setIsModalOpen(false);
    router.push("/chat/1");
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="bg-white rounded-3xl p-5 border border-orange-100 shadow-sm flex items-center justify-between mb-8 cursor-pointer hover:bg-orange-50 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-300 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm">
            {profile.nickname[0]}
          </div>
          <div>
            <p className="font-extrabold text-gray-900 text-base">{profile.nickname}</p>
            <p className="text-xs text-gray-500 font-medium">{profile.age} · {profile.gender} · {profile.createdAt}</p>
          </div>
        </div>
        <div>
          <span className="text-sm font-bold text-orange-500 bg-orange-100 px-4 py-2 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
            프로필 보기
          </span>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-orange-100 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 font-bold text-xl"
            >
              ×
            </button>
            
            <div className="bg-gradient-to-b from-orange-100 to-white pt-10 pb-6 flex flex-col items-center border-b border-orange-50">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-300 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-md border-4 border-white mb-4">
                {profile.nickname[0]}
              </div>
              <h3 className="text-2xl font-black text-gray-900">{profile.nickname}</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">{profile.region}</p>
            </div>
            
            <div className="p-6">
              <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">상세 정보</h4>
              <ul className="space-y-3 mb-8">
                <li className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-sm font-semibold text-gray-500">연령대</span>
                  <span className="text-sm font-bold text-gray-800">{profile.age}</span>
                </li>
                <li className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-sm font-semibold text-gray-500">성별</span>
                  <span className="text-sm font-bold text-gray-800">{profile.gender}</span>
                </li>
                <li className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-sm font-semibold text-gray-500">가입일</span>
                  <span className="text-sm font-bold text-gray-800">{profile.createdAt}</span>
                </li>
              </ul>
              
              <button 
                onClick={handleChatStart}
                className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 text-white text-lg font-bold rounded-2xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
              >
                <span>💬</span> 1:1 채팅하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
