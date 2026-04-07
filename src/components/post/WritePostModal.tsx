"use client";

import React from "react";
import { Loader2, X } from "lucide-react";
import { SearchPlace } from "@/lib/AppContext";
import KakaoMap from "@/components/KakaoMap";
import { CERT_DATA } from "@/lib/constants";

interface WritePostModalProps {
  isOpen: boolean;
  writeType: "study" | "free";
  setWriteType: (value: "study" | "free") => void;
  postTitle: string;
  setPostTitle: (value: string) => void;
  postContent: string;
  setPostContent: (value: string) => void;
  postCert: string;
  setPostCert: (value: string) => void;
  postCertCategory: string;
  setPostCertCategory: (value: string) => void;
  selectedPlace: SearchPlace | null;
  setSelectedPlace: (value: SearchPlace | null) => void;
  searchKeyword: string;
  setSearchKeyword: (value: string) => void;
  searchResults: SearchPlace[];
  searchPlacesOnKakao: () => void;
  loadingKakao: boolean;
  errorKakao: unknown;
  onClose: () => void;
}

export default function WritePostModal(props: WritePostModalProps) {
  const {
    isOpen,
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
    searchPlacesOnKakao,
    loadingKakao,
    errorKakao,
    onClose,
  } = props;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="font-bold text-xl">HighPass 글쓰기</h3>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
            게시글 저장은 백엔드 API 연결 후 활성화됩니다. 현재는 화면 구조만 정리된 상태입니다.
          </div>
          <label className="block text-sm font-bold mb-1">게시판 선택</label>
          <select
            value={writeType}
            onChange={(e) => setWriteType(e.target.value as "study" | "free")}
            className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-hp-500 font-medium"
          >
            <option value="study">스터디 모집</option>
            <option value="free">자유 게시판</option>
          </select>
          {writeType === "study" && (
            <>
              <label className="block text-sm font-bold mb-1">자격증 선택</label>
              <div className={`grid ${postCertCategory === "기타" ? "grid-cols-1" : "grid-cols-2"} gap-2 mb-4`}>
                <select
                  value={postCertCategory}
                  onChange={(e) => {
                    setPostCertCategory(e.target.value);
                    setPostCert("");
                  }}
                  className="border p-3 rounded-lg outline-none focus:border-hp-500 font-medium appearance-none"
                >
                  <option value="">카테고리 선택</option>
                  {Object.keys(CERT_DATA).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value="기타">기타</option>
                </select>
                {postCertCategory !== "기타" && (
                  <select
                    value={postCert}
                    onChange={(e) => setPostCert(e.target.value)}
                    disabled={!postCertCategory}
                    className="border p-3 rounded-lg outline-none focus:border-hp-500 font-medium appearance-none disabled:opacity-40"
                  >
                    <option value="">자격증 선택</option>
                    {(CERT_DATA[postCertCategory] || []).map((certificate) => (
                      <option key={certificate} value={certificate}>
                        {certificate}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}
          <label className="block text-sm font-bold mb-1">제목</label>
          <input
            type="text"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-hp-500 font-medium"
            placeholder="제목을 입력하세요"
          />
          <label className="block text-sm font-bold mb-1">내용</label>
          <textarea
            rows={5}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-hp-500 font-medium resize-none"
            placeholder="내용을 작성하세요"
          ></textarea>
          {writeType === "study" && (
            <div className="bg-hp-900 border border-hp-700 p-4 rounded-xl text-white mt-4 shadow-xl">
              <label className="block text-sm font-bold mb-3 text-slate-300">장소 검색 (카카오맵 API)</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchPlacesOnKakao();
                  }}
                  className="border border-hp-600 bg-hp-800 p-2.5 rounded-lg flex-1 outline-none text-sm placeholder:text-hp-400 text-white"
                  placeholder="키워드 입력 (예: 강남역 카페)"
                />
                <button
                  type="button"
                  onClick={searchPlacesOnKakao}
                  className="bg-hp-600 hover:bg-hp-500 transition-colors text-white px-5 rounded-lg font-bold text-sm"
                >
                  검색
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4 h-72">
                  <div className="w-full md:w-1/2 overflow-y-auto space-y-2 pr-2">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => setSelectedPlace(result)}
                        className={`p-4 rounded-xl text-sm cursor-pointer border transition-all ${
                          selectedPlace?.id === result.id
                            ? "bg-slate-800 border-hp-500 ring-1 ring-hp-500"
                            : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-base truncate">{result.name}</h4>
                        </div>
                        <p className="text-slate-400 text-xs mb-1 truncate">{result.address}</p>
                        {result.phone && <p className="text-slate-500 text-xs font-mono">{result.phone}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="w-full md:w-1/2 h-full rounded-xl overflow-hidden shadow-inner border border-slate-700 bg-slate-800 flex items-center justify-center">
                    {loadingKakao ? (
                      <div className="text-slate-500 flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin" /> 지도 로딩 중...
                      </div>
                    ) : errorKakao ? (
                      <div className="text-red-400 text-xs p-4 text-center">지도 로드 실패</div>
                    ) : (
                      <KakaoMap
                        apiKey="894423a9ffcffb29a1e5d50427ded82e"
                        markers={searchResults.map((result) => ({
                          lat: result.lat,
                          lng: result.lng,
                          locationName: result.name,
                        }))}
                        center={
                          selectedPlace
                            ? { lat: selectedPlace.lat, lng: selectedPlace.lng }
                            : { lat: searchResults[0].lat, lng: searchResults[0].lng }
                        }
                        level={4}
                      />
                    )}
                  </div>
                </div>
              )}
              {selectedPlace && (
                <div className="mt-4 p-3 bg-hp-900/30 border border-hp-800/50 rounded-lg">
                  <p className="text-sm text-hp-300 font-bold">선택한 장소: {selectedPlace.name}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="p-5 border-t flex justify-end gap-3 bg-hp-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-hp-50 text-hp-700 border border-hp-200 font-bold"
          >
            닫기
          </button>
          <button
            type="button"
            disabled
            className="px-5 py-2.5 rounded-lg bg-slate-300 text-white font-bold cursor-not-allowed"
          >
            백엔드 연동 후 저장 가능
          </button>
        </div>
      </div>
    </div>
  );
}
