"use client";
import React, { useState } from 'react';
import { Eye, Heart, MessageCircle, Bookmark, ArrowRight, Trash2, MessageSquare } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export default function FreePage() {
  const { boardData, setBoardData, currentUser, setProfileModal, setWriteModalOpen, setWriteType } = useApp();

  const [viewPostModal, setViewPostModal] = useState<any>(null);
  const [commentText, setCommentText] = useState('');

  const addComment = () => {
    if (!commentText.trim()) return;
    const updatedPost = { ...viewPostModal, comments: [...(viewPostModal.comments || []), { id: Date.now(), author: currentUser.nickname, text: commentText, createdAt: '방금 전' }] };
    setViewPostModal(updatedPost);
    setBoardData(boardData.map(b => b.id === updatedPost.id ? updatedPost : b));
    setCommentText('');
  };

  const deleteComment = (commentId: number) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    const updatedPost = { ...viewPostModal, comments: viewPostModal.comments.filter((c: any) => c.id !== commentId) };
    setViewPostModal(updatedPost);
    setBoardData(boardData.map(b => b.id === updatedPost.id ? updatedPost : b));
  };

  if (viewPostModal) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
        <div className="bg-white border-x border-b rounded-b-2xl overflow-hidden">
          <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-4 z-10">
            <button onClick={() => setViewPostModal(null)} className="hover:bg-slate-100 p-2 rounded-full transition-colors"><ArrowRight size={20} className="rotate-180" /></button>
            <span className="font-bold text-lg">게시글</span>
          </div>
          <div className="px-4 pt-4 pb-3 border-b">
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 bg-hp-500 rounded-full flex items-center justify-center font-bold text-white shrink-0 cursor-pointer" onClick={() => setProfileModal(viewPostModal.authorId)}>
                {viewPostModal.author.substring(0, 1)}
              </div>
              <div>
                <p className="font-bold text-sm leading-tight cursor-pointer hover:underline" onClick={() => setProfileModal(viewPostModal.authorId)}>{viewPostModal.author}</p>
                <p className="text-slate-400 text-xs">@{viewPostModal.author.toLowerCase().replace(/\s/g, '_')}</p>
              </div>
            </div>
            {viewPostModal.title && <p className="font-bold text-base mb-1">{viewPostModal.title}</p>}
            <p className="text-slate-900 text-base leading-relaxed whitespace-pre-wrap mb-4">{viewPostModal.content}</p>
            <p className="text-slate-400 text-sm mb-4">{viewPostModal.createdAt || '오늘'} · <span className="font-bold text-slate-700">{viewPostModal.views}</span> 조회</p>
            <div className="border-t border-b py-3 flex gap-6 text-slate-500 text-sm">
              <span><span className="font-bold text-slate-900">{viewPostModal.comments?.length || 0}</span> 답글</span>
              <span><span className="font-bold text-slate-900">{viewPostModal.likes}</span> 좋아요</span>
              <span><span className="font-bold text-slate-900">{viewPostModal.scraps || 0}</span> 북마크</span>
            </div>
            <div className="flex justify-around pt-1 text-slate-400">
              <button className="flex items-center gap-1.5 hover:text-hp-500 p-2 rounded-full hover:bg-hp-50 transition-colors text-sm"><MessageCircle size={20} /></button>
              <button className="flex items-center gap-1.5 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors text-sm"><Heart size={20} /></button>
              <button className="flex items-center gap-1.5 hover:text-hp-500 p-2 rounded-full hover:bg-hp-50 transition-colors text-sm"><Bookmark size={20} /></button>
              <button className="flex items-center gap-1.5 hover:text-green-500 p-2 rounded-full hover:bg-green-50 transition-colors text-sm"><Eye size={20} /></button>
            </div>
          </div>
          <div className="px-4 py-3 border-b flex gap-3 items-start">
            <div className="w-9 h-9 bg-hp-600 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm">{currentUser.nickname.substring(0, 1)}</div>
            <div className="flex-1 flex gap-2">
              <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addComment(); }} className="flex-1 outline-none text-sm py-2 text-slate-800 placeholder:text-slate-400 bg-transparent border-b border-slate-200 focus:border-hp-400 transition-colors" placeholder="답글 남기기..." />
              <button onClick={addComment} className="bg-hp-600 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-hp-700 transition-colors self-end">답글</button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {(viewPostModal.comments?.length === 0 || !viewPostModal.comments) ? (
              <div className="py-12 text-center text-slate-400 text-sm">아직 답글이 없습니다.</div>
            ) : viewPostModal.comments?.map((c: any) => (
              <div key={c.id} className="px-4 py-3 flex gap-3 hover:bg-hp-50 transition-colors group">
                <div className="w-9 h-9 bg-hp-100 rounded-full flex items-center justify-center font-bold text-hp-600 text-xs shrink-0 cursor-pointer" onClick={() => setProfileModal('u' + c.id)}>{c.author.substring(0, 1)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm cursor-pointer hover:underline" onClick={() => setProfileModal('u' + c.id)}>{c.author}</span>
                      <span className="text-slate-400 text-xs">· {c.createdAt || '방금 전'}</span>
                    </div>
                    {c.author === currentUser.nickname && (
                      <button onClick={(e) => { e.stopPropagation(); deleteComment(c.id); }} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed">{c.text}</p>
                  <div className="flex gap-4 mt-2 text-slate-400">
                    <button className="hover:text-red-500 transition-colors flex items-center gap-1 text-xs"><Heart size={14} /></button>
                    <button className="hover:text-hp-500 transition-colors flex items-center gap-1 text-xs"><MessageCircle size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white border-x rounded-2xl overflow-hidden shadow-sm">
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b px-4 py-3 z-10">
          <h2 className="font-bold text-xl">자유게시판</h2>
        </div>
        <div className="border-b px-4 py-3 flex justify-end">
          <button onClick={() => { setWriteType('free'); setWriteModalOpen(true); }} className="bg-hp-600 text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-hp-700 transition-colors">글쓰기</button>
        </div>
        <div className="divide-y divide-slate-100">
          {boardData.filter(d => d.type === 'free').length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">아직 게시글이 없습니다.<br />첫 번째 글을 작성해보세요!</div>
          ) : boardData.filter(d => d.type === 'free').map(post => (
            <div key={post.id} className="px-4 py-3 hover:bg-hp-50 cursor-pointer flex gap-3 transition-colors" onClick={() => setViewPostModal(post)}>
              <div className="w-10 h-10 bg-hp-100 rounded-full flex items-center justify-center font-bold text-hp-600 shrink-0 text-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setProfileModal(post.authorId); }}>
                {post.author.substring(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="font-bold text-sm cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); setProfileModal(post.authorId); }}>{post.author}</span>
                  <span className="text-slate-400 text-sm">@{post.author.toLowerCase().replace(/\s/g, '_')}</span>
                  <span className="text-slate-400 text-sm">· {post.createdAt || '오늘'}</span>
                </div>
                {post.title && <p className="font-bold text-sm text-slate-900 mb-0.5">{post.title}</p>}
                <p className="text-sm text-slate-800 leading-relaxed line-clamp-3 mb-3">{post.content}</p>
                <div className="flex gap-5 text-slate-400 text-sm -ml-1">
                  <button className="flex items-center gap-1.5 hover:text-hp-500 p-1 rounded-full hover:bg-hp-50 transition-colors" onClick={(e) => e.stopPropagation()}><MessageCircle size={16} /><span className="text-xs">{post.comments?.length || 0}</span></button>
                  <button className="flex items-center gap-1.5 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors" onClick={(e) => e.stopPropagation()}><Heart size={16} /><span className="text-xs">{post.likes}</span></button>
                  <button className="flex items-center gap-1.5 hover:text-hp-500 p-1 rounded-full hover:bg-hp-50 transition-colors" onClick={(e) => e.stopPropagation()}><Bookmark size={16} /><span className="text-xs">{post.scraps || 0}</span></button>
                  <span className="flex items-center gap-1.5 p-1"><Eye size={16} /><span className="text-xs">{post.views}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
