"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import KakaoMap from "@/shared/components/map/KakaoMap";
import { CERT_DATA } from "@/shared/constants";
import { SearchPlace, useApp } from "@/shared/context/AppContext";
import { KAKAO_MAP_APPKEY } from "@/services/config/config";

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
  createChatRoom: boolean;
  setCreateChatRoom: (value: boolean) => void;
  onClose: () => void;
}

export default function WritePostModal(props: WritePostModalProps) {
  const router = useRouter();
  const { submitPost, isOnlineStudy, setIsOnlineStudy } = useApp();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchPlace[]>([]);

  const [loadingKakao, errorKakao] = useKakaoLoader({
    appkey: KAKAO_MAP_APPKEY,
    libraries: ["services", "clusterer"],
  });

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
    createChatRoom,
    setCreateChatRoom,
    onClose,
  } = props;

  React.useEffect(() => {
    if (!isOpen) {
      setSearchKeyword("");
      setSearchResults([]);
      return;
    }
    setSaving(false);
    setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  const isCustomCert = postCertCategory === "기타";
  const certOptions = postCertCategory && !isCustomCert ? CERT_DATA[postCertCategory] || [] : [];
  const canSubmit = Boolean(postTitle.trim() || postContent.trim());
  const certFilled = postCertCategory === "기타" ? postCert.trim() : postCert.trim();

  const searchPlacesOnKakao = () => {
    if (typeof window === "undefined") return;
    const kakaoMaps = window.kakao?.maps;
    const services = kakaoMaps?.services;

    if (!services) {
      alert("지도 스크립트가 아직 로드되지 않았습니다.");
      return;
    }

    const places = new services.Places();
    places.keywordSearch(searchKeyword, (data: kakao.maps.services.PlacesSearchResult, status: kakao.maps.services.Status) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
 
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-xl font-bold">게시물 작성</h3>
          <button
            onClick={() => { if (saving) return; onClose(); }}
            className="rounded-lg p-1 hover:bg-slate-100"
          >
            <X size={24} />
          </button>
        </div>
 
        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 ">
          {error ? <p className="mb-4 text-sm text-red-500">{error}</p> : null}
 
          {/* 제목 */}
          <div className="mb-4 ">
            <label className="mb-1.5 block text-sm font-bold text-slate-700 ">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium outline-none placeholder:text-slate-500 focus:bg-slate-100 border-2 border-slate-300"
              placeholder="제목을 입력해 주세요" 
              disabled={saving}
            />
          </div>
 
          {/* 자격증 - 스터디 필수 */}
          {writeType === "study" ? (
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                자격증 <span className="text-red-500">*</span>
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <select
                    value={postCertCategory}
                    onChange={(e) => { setPostCertCategory(e.target.value); setPostCert(""); }}
                    className="w-full appearance-none rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:bg-slate-100 border-2 border-slate-300"
                    disabled={saving}
                  >
                    <option value="">분류 선택</option>
                    {Object.keys(CERT_DATA).map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  {isCustomCert ? (
                    <input
                      type="text"
                      value={postCert}
                      onChange={(e) => setPostCert(e.target.value)}
                      disabled={saving}
                      placeholder="예: 한국사, 컴퓨터활용능력 1급"
                      className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:bg-slate-100 border-2 border-slate-300"
                    />
                  ) : (
                    <select
                      value={postCert}
                      onChange={(e) => setPostCert(e.target.value)}
                      disabled={saving || !postCertCategory}
                      className="w-full appearance-none rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:bg-slate-100 disabled:opacity-40 border-2 border-slate-300 "
                    >
                      <option value="">{postCertCategory ? "자격증 선택" : "먼저 분류를 선택해 주세요"}</option>
                      {certOptions.map((certificate) => (
                        <option key={certificate} value={certificate}>{certificate}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ) : null}
 
          {/* 내용 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-bold text-slate-700 ">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={writeType === "study" ? 6 : 15}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="w-full resize-none rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium outline-none placeholder:text-slate-500 focus:bg-slate-100 border-2 border-slate-300"
              placeholder="내용을 작성해 주세요"
              disabled={saving}
            />
          </div>
 
          {writeType === "study" ? (
            <>
              {/* 채팅방 생성 토글 */}
              <div className="mb-4 flex items-center justify-between rounded-xl bg-hp-50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">스터디 채팅방 생성</p>
                  <p className="text-xs text-slate-400">게시글과 함께 그룹 채팅방이 만들어집니다</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={createChatRoom}
                    onChange={() => setCreateChatRoom(!createChatRoom)}
                  />
                  <div className={`h-6 w-11 rounded-full transition-colors duration-200 ${createChatRoom ? "bg-hp-600" : "bg-slate-200"}`}>
                    <div className={`mt-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${createChatRoom ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                  </div>
                </label>
              </div>
 
              {/* 온라인/오프라인 선택 */}
              <div className="mb-4 flex items-center gap-3">
                <span className="text-sm font-bold text-slate-700">스터디 방식</span>
                <div className="flex overflow-hidden rounded-lg bg-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsOnlineStudy(false)}
                    className={`px-4 py-2 text-sm font-bold transition-colors ${
                      !isOnlineStudy ? "bg-hp-600 text-white" : "text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    오프라인
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsOnlineStudy(true); setSelectedPlace(null); }}
                    className={`px-4 py-2 text-sm font-bold transition-colors ${
                      isOnlineStudy ? "bg-hp-600 text-white" : "text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    온라인
                  </button>
                </div>
                {isOnlineStudy && (
                  <span className="text-xs text-slate-400">장소는 미정으로 등록됩니다.</span>
                )}
              </div>
 
              {/* 장소 검색 */}
              <div className={`rounded-xl bg-hp-900 p-4 text-white shadow-lg transition-opacity duration-200 ${isOnlineStudy ? "pointer-events-none opacity-30" : "opacity-100"}`}>
                <label className="mb-3 block text-sm font-bold text-slate-300">스터디 장소</label>
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") searchPlacesOnKakao(); }}
                    className="flex-1 rounded-lg bg-hp-800 p-2.5 text-sm text-white outline-none placeholder:text-hp-400"
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
                          className={`cursor-pointer rounded-xl p-4 text-sm transition-all ${
                            selectedPlace?.id === result.id
                              ? "bg-slate-700 ring-1 ring-hp-500"
                              : "bg-slate-800/50 hover:bg-slate-800"
                          }`}
                        >
                          <h4 className="truncate text-base font-bold">{result.name}</h4>
                          <p className="mt-1 truncate text-xs text-slate-400">{result.address}</p>
                          {result.phone ? <p className="mt-1 font-mono text-xs text-slate-500">{result.phone}</p> : null}
                        </div>
                      ))}
                    </div>
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-slate-800 shadow-inner md:w-1/2">
                      {loadingKakao ? (
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                          <Loader2 className="animate-spin" />
                          로딩 중...
                        </div>
                      ) : errorKakao ? (
                        <div className="p-4 text-center text-xs text-red-400">카카오 지도를 불러오지 못했습니다.</div>
                      ) : (
                        <KakaoMap
                          markers={searchResults.map((result) => ({ lat: result.lat, lng: result.lng, locationName: result.name }))}
                          center={selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lng } : { lat: searchResults[0].lat, lng: searchResults[0].lng }}
                          level={4}
                        />
                      )}
                    </div>
                  </div>
                ) : null}
 
                {selectedPlace ? (
                  <div className="mt-4 rounded-lg bg-hp-900/30 p-3">
                    <p className="text-sm font-bold text-hp-300">선택한 장소: {selectedPlace.name}</p>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
 
        {/* 푸터 */}
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-3">
          <button
            onClick={() => { if (saving) return; onClose(); }}
            className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200"
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
                  const msg =
                    !postTitle.trim() ? "제목을 입력해 주세요." :
                    !postContent.trim() ? "내용을 입력해 주세요." :
                    writeType === "study" && !certFilled ? "자격증을 선택해 주세요." :
                    "필수 항목을 입력해 주세요.";
                  setError(msg);
                  toast.warning(msg);
                  return;
                }
                toast.success("게시물이 작성되었습니다.");
                onClose();
                router.refresh();
              } catch (e) {
                const message = e instanceof Error ? e.message : "게시글 저장에 실패했습니다.";
                setError(message);
                toast.error(message);
              } finally {
                setSaving(false);
              }
            }}
            className="rounded-lg bg-hp-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-hp-700 disabled:opacity-60"
          >
            {saving ? "저장 중..." : "작성"}
          </button>
        </div>
      </div>
    </div>
  );
}