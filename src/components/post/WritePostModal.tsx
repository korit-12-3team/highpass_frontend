"use client";

import React from "react";
import { Loader2, X } from "lucide-react";
import KakaoMap from "@/components/KakaoMap";
import { CERT_DATA } from "@/lib/constants";
import { SearchPlace, useApp } from "@/lib/AppContext";

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
  const { submitPost } = useApp();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

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

  React.useEffect(() => {
    if (!isOpen) return;
    setSaving(false);
    setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  const canSubmit = Boolean(postTitle.trim() || postContent.trim());

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="font-bold text-xl">게시물 작성</h3>
          <button
            onClick={() => {
              if (saving) return;
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

          <div className="mb-4 p-3 rounded-xl bg-hp-50 border border-hp-200 text-sm text-hp-800">
            게시글은 서버에 저장됩니다.
          </div>

          <label className="block text-sm font-bold mb-1">게시판</label>
          <select
            value={writeType}
            onChange={(e) => setWriteType(e.target.value as "study" | "free")}
            className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-hp-500 font-medium"
            disabled={saving}
          >
            <option value="study">스터디 모집</option>
            <option value="free">자유게시판</option>
          </select>

          {writeType === "study" && (
            <>
              <label className="block text-sm font-bold mb-1">자격증</label>
              <div
                className={`grid ${postCertCategory === "Other" ? "grid-cols-1" : "grid-cols-2"} gap-2 mb-4`}
              >
                <select
                  value={postCertCategory}
                  onChange={(e) => {
                    setPostCertCategory(e.target.value);
                    setPostCert("");
                  }}
                  className="border p-3 rounded-lg outline-none focus:border-hp-500 font-medium appearance-none"
                  disabled={saving}
                >
                  <option value="">--- 선택 ---</option>
                  {Object.keys(CERT_DATA).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value="Other">기타</option>
                </select>
                {postCertCategory !== "Other" && (
                  <select
                    value={postCert}
                    onChange={(e) => setPostCert(e.target.value)}
                    disabled={saving || !postCertCategory}
                    className="border p-3 rounded-lg outline-none focus:border-hp-500 font-medium appearance-none disabled:opacity-40"
                  >
                    <option value=""></option>
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
            disabled={saving}
          />

          <label className="block text-sm font-bold mb-1">내용</label>
          <textarea
            rows={6}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="w-full border p-3 rounded-lg mb-4 outline-none focus:border-hp-500 font-medium resize-none"
            placeholder="내용을 작성하세요"
            disabled={saving}
          />

          {writeType === "study" && (
            <div className="bg-hp-900 border border-hp-700 p-4 rounded-xl text-white mt-4 shadow-xl">
              <label className="block text-sm font-bold mb-3 text-slate-300">스터디 장소</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchPlacesOnKakao();
                  }}
                  className="border border-hp-600 bg-hp-800 p-2.5 rounded-lg flex-1 outline-none text-sm placeholder:text-hp-400 text-white"
                  placeholder="장소 검색 (예시: 서면 카페)"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={searchPlacesOnKakao}
                  className="bg-hp-600 hover:bg-hp-500 transition-colors text-white px-5 rounded-lg font-bold text-sm"
                  disabled={saving}
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
                        <h4 className="font-bold text-base truncate">{result.name}</h4>
                        <p className="text-slate-400 text-xs mt-1 truncate">{result.address}</p>
                        {result.phone && <p className="text-slate-500 text-xs font-mono mt-1">{result.phone}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="w-full md:w-1/2 h-full rounded-xl overflow-hidden shadow-inner border border-slate-700 bg-slate-800 flex items-center justify-center">
                    {loadingKakao ? (
                      <div className="text-slate-500 flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin" /> 로딩중...
                      </div>
                    ) : errorKakao ? (
                      <div className="text-red-400 text-xs p-4 text-center">카카오맵 불러오기 실패</div>
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
                  <p className="text-sm text-hp-300 font-bold">Selected: {selectedPlace.name}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t flex justify-end gap-3 bg-hp-50">
          <button
            onClick={() => {
              if (saving) return;
              onClose();
            }}
            className="px-5 py-2.5 rounded-lg bg-hp-50 text-hp-700 border border-hp-200 font-bold"
          >
            취소
          </button>
          <button
            type="button"
            disabled={saving || !canSubmit}
            onClick={async () => {
              if (saving) return;
              setError("");
              setSaving(true);
              try {
                const ok = await submitPost();
                if (!ok) {
                  setError("제목 또는 내용을 입력해주세요.");
                  return;
                }
                onClose();
              } catch (e) {
                setError(e instanceof Error ? e.message : "게시글 저장에 실패했습니다.");
              } finally {
                setSaving(false);
              }
            }}
            className="px-5 py-2.5 rounded-lg bg-hp-600 hover:bg-hp-700 text-white font-bold disabled:opacity-60"
          >
            {saving ? "저장중..." : "작성"}
          </button>
        </div>
      </div>
    </div>
  );
}
