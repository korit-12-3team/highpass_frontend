"use client";

import React, { useState } from "react";
import { ArrowRight, Eye, Heart, MapPin, MessageCircle, Trash2, X, Zap } from "lucide-react";
import KakaoMap from "@/components/KakaoMap";
import { useApp } from "@/lib/AppContext";
import { CERT_DATA, REGION_DATA } from "@/lib/constants";

export default function StudyPageClient() {
  const { boardData, setBoardData, currentUser, setProfileModal, setWriteModalOpen, setWriteType } =
    useApp();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewPostModal, setViewPostModal] = useState<any>(null);
  const [commentText, setCommentText] = useState("");
  const [certFilter, setCertFilter] = useState("");
  const [locationFilterSido, setLocationFilterSido] = useState("");
  const [locationFilterSigungu, setLocationFilterSigungu] = useState("");

  const addComment = () => {
    if (!commentText.trim()) return;
    const updatedPost = {
      ...viewPostModal,
      comments: [
        ...(viewPostModal.comments || []),
        { id: Date.now(), author: currentUser.nickname, text: commentText, createdAt: "방금 전" },
      ],
    };
    setViewPostModal(updatedPost);
    setBoardData(boardData.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
    setCommentText("");
  };

  const deleteComment = (commentId: number) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    const updatedPost = {
      ...viewPostModal,
      comments: viewPostModal.comments.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (comment: any) => comment.id !== commentId,
      ),
    };
    setViewPostModal(updatedPost);
    setBoardData(boardData.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
  };

  if (viewPostModal) {
    return (
      <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10">
          <button
            onClick={() => setViewPostModal(null)}
            className="mb-6 text-sm font-bold text-hp-600 hover:text-hp-800 flex items-center gap-1 transition-colors"
          >
            <ArrowRight size={16} className="rotate-180" /> 목록으로
          </button>
          <div className="border-b pb-5 mb-5">
            <div>
              <span className="text-xs font-bold bg-hp-100 text-hp-700 px-2 py-1 rounded-full mr-2">
                스터디 모집
              </span>
              <h3 className="font-bold text-2xl md:text-3xl mt-4 leading-tight">{viewPostModal.title}</h3>
            </div>
            <div className="flex justify-between items-center mt-5 text-sm font-medium text-slate-500">
              <div
                className="flex items-center gap-2 cursor-pointer hover:text-slate-800 transition-colors"
                onClick={() => setProfileModal(viewPostModal.authorId)}
              >
                <div className="w-8 h-8 bg-hp-100 rounded-full flex items-center justify-center text-hp-600 font-bold">
                  {viewPostModal.author.substring(0, 1)}
                </div>
                <span className="font-bold text-slate-800">{viewPostModal.author}</span>
                <span>· {viewPostModal.createdAt || "오늘"}</span>
              </div>
              <div className="flex gap-4">
                <span className="flex gap-1 items-center">
                  <Eye size={16} />
                  {viewPostModal.views}
                </span>
                <span className="flex gap-1 items-center">
                  <Heart size={16} />
                  {viewPostModal.likes}
                </span>
              </div>
            </div>
          </div>
          <div className="font-mono text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[150px] text-base">
            {viewPostModal.content || "내용이 없습니다."}
          </div>
          {viewPostModal.lat && (
            <div className="mt-8 border rounded-xl overflow-hidden h-72 relative bg-slate-100 shadow-inner">
              <KakaoMap
                apiKey="894423a9ffcffb29a1e5d50427ded82e"
                markers={[
                  {
                    lat: viewPostModal.lat,
                    lng: viewPostModal.lng,
                    locationName: viewPostModal.location,
                  },
                ]}
                center={{ lat: viewPostModal.lat, lng: viewPostModal.lng }}
                level={3}
              />
              <div className="absolute top-4 left-4 z-10 bg-white px-3 py-2 rounded-lg shadow-md font-bold text-sm border flex items-center gap-1">
                <MapPin size={16} className="text-hp-600" />
                {viewPostModal.location}
              </div>
            </div>
          )}
          <div className="border-t border-slate-100 mt-10 pt-8">
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
              <MessageCircle size={20} /> 댓글 <span className="text-hp-600">{viewPostModal.comments?.length || 0}</span>
            </h4>
            <div className="flex gap-2 mb-8">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addComment();
                }}
                className="flex-1 border rounded-xl p-3 outline-none font-medium text-sm bg-hp-50 focus:bg-white focus:ring-2 ring-hp-500 transition-all shadow-inner"
                placeholder="댓글을 남겨주세요"
              />
              <button
                onClick={addComment}
                className="bg-hp-600 text-white rounded-xl px-6 font-bold hover:bg-hp-700 transition-colors shadow-sm"
              >
                작성
              </button>
            </div>
            <div className="space-y-4">
              {viewPostModal.comments?.map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (comment: any) => (
                <div key={comment.id} className="p-4 rounded-xl bg-hp-50 border border-hp-100 flex gap-3 group">
                  <div
                    className="w-9 h-9 bg-hp-100 rounded-full flex items-center justify-center font-bold text-hp-600 text-xs shrink-0 cursor-pointer"
                    onClick={() => setProfileModal(`u${comment.id}`)}
                  >
                    {comment.author.substring(0, 1)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex gap-2 items-center">
                        <span
                          className="font-bold text-sm cursor-pointer hover:underline text-slate-800"
                          onClick={() => setProfileModal(`u${comment.id}`)}
                        >
                          {comment.author}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{comment.createdAt || "방금 전"}</span>
                      </div>
                      {comment.author === currentUser.nickname && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteComment(comment.id);
                          }}
                          className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 text-xs flex items-center gap-1 transition-all"
                        >
                          <Trash2 size={12} /> 삭제
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold">스터디 모집</h2>
          <p className="text-slate-500 mt-1">합격을 위해 함께할 동료를 찾아보세요</p>
        </div>
        <button
          onClick={() => {
            setWriteType("study");
            setWriteModalOpen(true);
          }}
          className="bg-hp-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <Zap size={16} /> 새 글 쓰기
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={certFilter}
          onChange={(e) => setCertFilter(e.target.value)}
          className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500 appearance-none bg-white"
        >
          <option value="">전체 자격증</option>
          {Object.entries(CERT_DATA).map(([category, certificates]) => (
            <optgroup key={category} label={category}>
              {certificates.map((certificate) => (
                <option key={certificate} value={certificate}>
                  {certificate}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          value={locationFilterSido}
          onChange={(e) => {
            setLocationFilterSido(e.target.value);
            setLocationFilterSigungu("");
          }}
          className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500 appearance-none bg-white"
        >
          <option value="">전체 지역</option>
          {Object.keys(REGION_DATA).map((sido) => (
            <option key={sido} value={sido}>
              {sido}
            </option>
          ))}
        </select>
        <select
          value={locationFilterSigungu}
          onChange={(e) => setLocationFilterSigungu(e.target.value)}
          disabled={!locationFilterSido}
          className="border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hp-500 appearance-none bg-white disabled:opacity-40"
        >
          <option value="">전체 구/군</option>
          {(REGION_DATA[locationFilterSido] || []).map((sigungu) => (
            <option key={sigungu} value={sigungu}>
              {sigungu}
            </option>
          ))}
        </select>
        {(certFilter || locationFilterSido) && (
          <button
            onClick={() => {
              setCertFilter("");
              setLocationFilterSido("");
              setLocationFilterSigungu("");
            }}
            className="flex items-center gap-1 text-xs text-slate-500 border rounded-xl px-3 py-2 hover:bg-slate-50"
          >
            <X size={12} /> 필터 초기화
          </button>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-hp-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {boardData
            .filter((post) => {
              if (post.type !== "study") return false;
              if (certFilter && post.cert !== certFilter) return false;
              if (locationFilterSigungu && !post.location?.includes(locationFilterSigungu)) return false;
              if (locationFilterSido && !locationFilterSigungu && !post.location?.includes(locationFilterSido)) {
                return false;
              }
              return true;
            })
            .map((post) => (
              <div
                key={post.id}
                className="p-5 hover:bg-hp-50 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                onClick={() => setViewPostModal(post)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold bg-hp-100 text-hp-700 px-2 py-0.5 rounded flex items-center gap-1">
                      <MapPin size={12} />
                      {post.location}
                    </span>
                    {post.cert && (
                      <span className="text-xs font-bold bg-hp-100 text-hp-700 px-2 py-0.5 rounded">
                        {post.cert}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{post.title}</h3>
                  <div
                    className="text-xs text-slate-500 font-medium cursor-pointer hover:text-slate-800 inline-block"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileModal(post.authorId);
                    }}
                  >
                    {post.author} · {post.createdAt || "오늘"}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex gap-1">
                    <Eye size={16} />
                    {post.views}
                  </div>
                  <div className="flex gap-1">
                    <Heart size={16} />
                    {post.likes}
                  </div>
                  <div className="flex gap-1">
                    <MessageCircle size={16} />
                    {post.comments?.length || 0}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
