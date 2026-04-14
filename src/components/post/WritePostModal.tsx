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

  const isCustomCert = postCertCategory === "기타";
  const certOptions = postCertCategory && !isCustomCert ? CERT_DATA[postCertCategory] || [] : [];
  const canSubmit = Boolean(postTitle.trim() || postContent.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="text-xl font-bold">게시물 작성</h3>
          <button
            onClick={() => {
              if (saving) return;
              onClose();
            }}
            className="rounded-lg p-1 hover:bg-slate-100"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error ? <p className="mb-4 text-sm text-red-500">{error}</p> : null}

          <label className="mb-1 block text-sm font-bold">제목</label>
          <input
            type="text"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            className="mb-4 w-full rounded-lg border p-3 font-medium outline-none focus:border-hp-500"
            placeholder="제목을 입력해 주세요"
            disabled={saving}
          />

          {writeType === "study" ? (
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-bold">자격증</label>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">분류</p>
                  <select
                    value={postCertCategory}
                    onChange={(e) => {
                      setPostCertCategory(e.target.value);
                      setPostCert("");
                    }}
                    className={`w-full appearance-none rounded-lg border p-3 outline-none focus:border-hp-500 ${
                      isCustomCert ? "font-bold text-slate-900" : "font-medium"
                    }`}
                    disabled={saving}
                  >
                    <option value="">분류 선택</option>
                    {Object.keys(CERT_DATA).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">
                    {isCustomCert ? "자격증명 직접 입력" : "자격증 종류"}
                  </p>
                  {isCustomCert ? (
                    <input
                      type="text"
                      value={postCert}
                      onChange={(e) => setPostCert(e.target.value)}
                      disabled={saving}
                      placeholder="예: 한국사, 컴퓨터활용능력 1급"
                      className="w-full rounded-lg border p-3 font-medium outline-none focus:border-hp-500"
                    />
                  ) : (
                    <select
                      value={postCert}
                      onChange={(e) => setPostCert(e.target.value)}
                      disabled={saving || !postCertCategory}
                      className="w-full appearance-none rounded-lg border p-3 font-medium outline-none focus:border-hp-500 disabled:opacity-40"
                    >
                      <option value="">{postCertCategory ? "자격증 선택" : "먼저 분류를 선택해 주세요"}</option>
                      {certOptions.map((certificate) => (
                        <option key={certificate} value={certificate}>
                          {certificate}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <label className="mb-1 block text-sm font-bold">내용</label>
          <textarea
            rows={6}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="mb-4 w-full resize-none rounded-lg border p-3 font-medium outline-none focus:border-hp-500"
            placeholder="내용을 작성해 주세요"
            disabled={saving}
          />

          {writeType === "study" ? (
            <div className="mt-4 rounded-xl border border-hp-700 bg-hp-900 p-4 text-white shadow-xl">
              <label className="mb-3 block text-sm font-bold text-slate-300">스터디 장소</label>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchPlacesOnKakao();
                  }}
                  className="flex-1 rounded-lg border border-hp-600 bg-hp-800 p-2.5 text-sm text-white outline-none placeholder:text-hp-400"
                  placeholder="장소 검색 (예시: 강남 카페)"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={searchPlacesOnKakao}
                  className="rounded-lg bg-hp-600 px-5 text-sm font-bold text-white transition-colors hover:bg-hp-500"
                  disabled={saving}
                >
                  검색
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="flex h-72 flex-col gap-4 md:flex-row">
                  <div className="w-full space-y-2 overflow-y-auto pr-2 md:w-1/2">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => setSelectedPlace(result)}
                        className={`cursor-pointer rounded-xl border p-4 text-sm transition-all ${
                          selectedPlace?.id === result.id
                            ? "border-hp-500 bg-slate-800 ring-1 ring-hp-500"
                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800"
                        }`}
                      >
                        <h4 className="truncate text-base font-bold">{result.name}</h4>
                        <p className="mt-1 truncate text-xs text-slate-400">{result.address}</p>
                        {result.phone ? <p className="mt-1 font-mono text-xs text-slate-500">{result.phone}</p> : null}
                      </div>
                    ))}
                  </div>

                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-inner md:w-1/2">
                    {loadingKakao ? (
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Loader2 className="animate-spin" />
                        로딩 중...
                      </div>
                    ) : errorKakao ? (
                      <div className="p-4 text-center text-xs text-red-400">카카오 지도를 불러오지 못했습니다.</div>
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
              ) : null}

              {selectedPlace ? (
                <div className="mt-4 rounded-lg border border-hp-800/50 bg-hp-900/30 p-3">
                  <p className="text-sm font-bold text-hp-300">선택한 장소: {selectedPlace.name}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t bg-hp-50 p-5">
          <button
            onClick={() => {
              if (saving) return;
              onClose();
            }}
            className="rounded-lg border border-hp-200 bg-hp-50 px-5 py-2.5 font-bold text-hp-700"
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
                  setError("제목 또는 내용을 입력해 주세요.");
                  return;
                }
                onClose();
              } catch (e) {
                setError(e instanceof Error ? e.message : "게시글 저장에 실패했습니다.");
              } finally {
                setSaving(false);
              }
            }}
            className="rounded-lg bg-hp-600 px-5 py-2.5 font-bold text-white hover:bg-hp-700 disabled:opacity-60"
          >
            {saving ? "저장 중..." : "작성"}
          </button>
        </div>
      </div>
    </div>
  );
}
