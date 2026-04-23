import { ArrowLeft, FileText } from "lucide-react";
import type { AdminPost, AdminUser, UserStatus } from "@/features/admin/types";
import {
  formatDateOnly,
  getLastSeenLabel,
  getLoginTypeLabel,
  InfoTile,
  postStatusLabel,
  statusClass,
  userStatusLabel,
} from "@/features/admin/components/AdminCommon";

export function AdminUsersSection({
  users,
  selectedUser,
  userPosts,
  onOpenUser,
  onBack,
  onOpenPost,
  onUpdateUserStatus,
}: {
  users: AdminUser[];
  selectedUser: AdminUser | null;
  userPosts: AdminPost[];
  onOpenUser: (userId: string) => void;
  onBack: () => void;
  onOpenPost: (post: AdminPost) => void;
  onUpdateUserStatus: (userId: string, status: UserStatus) => void;
}) {
  if (selectedUser) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50">
          <ArrowLeft size={16} />
          회원 목록
        </button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-slate-400">Member Detail</p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">{selectedUser.nickname}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{selectedUser.email}</p>
          </div>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(selectedUser.status)}`}>
            {userStatusLabel[selectedUser.status]}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
          <InfoTile label="이름" value={selectedUser.name} />
          <InfoTile label="지역" value={selectedUser.region} />
          <InfoTile label="신고" value={`${selectedUser.reports}건`} />
          <InfoTile label="권한" value={selectedUser.role} />
          <InfoTile label="가입 유형" value={getLoginTypeLabel(selectedUser)} />
          <InfoTile label="가입일" value={formatDateOnly(selectedUser.joinedAt)} />
          <InfoTile label="접속 상태" value={getLastSeenLabel(selectedUser)} />
          {selectedUser.status === "deleted" ? <InfoTile label="탈퇴일" value={selectedUser.deletedAt ? formatDateOnly(selectedUser.deletedAt) : "-"} /> : null}
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-base font-black text-slate-950">작성 게시글</h3>
            <span className="text-xs font-black text-slate-400">{userPosts.length}개</span>
          </div>

          {userPosts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3">게시글</th>
                    <th className="px-4 py-3">종류</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">작성일</th>
                    <th className="px-4 py-3 text-right">지표</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userPosts.map((post) => (
                    <tr key={post.id} onClick={() => onOpenPost(post)} className="cursor-pointer bg-white transition hover:bg-hp-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-hp-100 text-hp-700">
                            <FileText size={18} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-950">{post.title}</p>
                            <p className="mt-1 truncate text-xs font-semibold text-slate-500">{post.content || "내용 없음"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">
                        {post.type === "study" ? "스터디 모집" : "자유 게시글"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(post.status)}`}>
                          {postStatusLabel[post.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{formatDateOnly(post.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-600">
                        조회 {post.views} · 댓글 {post.comments} · 신고 {post.reports}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-sm font-semibold text-slate-400">
              작성 게시글이 없습니다.
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-black text-slate-950">회원 목록</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">회원</th>
              <th className="px-4 py-3">가입 유형</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">가입일</th>
              <th className="px-4 py-3">탈퇴일</th>
              <th className="px-4 py-3">최근 접속</th>
              <th className="px-4 py-3 text-right">활동</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} onClick={() => onOpenUser(user.id)} className="cursor-pointer bg-white transition hover:bg-hp-50/80">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-left">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white">
                      {user.nickname.slice(0, 1)}
                    </span>
                    <span>
                      <span className="block font-black text-slate-950">{user.nickname}</span>
                      <span className="block text-xs font-semibold text-slate-500">{user.email}</span>
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                    {getLoginTypeLabel(user)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(user.status)}`}>
                    {userStatusLabel[user.status]}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-600">{formatDateOnly(user.joinedAt)}</td>
                <td className="px-4 py-3 font-semibold text-slate-600">
                  {user.status === "deleted" && user.deletedAt ? formatDateOnly(user.deletedAt) : "-"}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${user.online ? "bg-emerald-500" : "bg-slate-300"}`} />
                    {getLastSeenLabel(user)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-600">
                  게시글 {user.posts} · 댓글 {user.comments}
                </td>
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <UserActionButtons user={user} onUpdateUserStatus={onUpdateUserStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UserActionButtons({
  user,
  onUpdateUserStatus,
}: {
  user: AdminUser;
  onUpdateUserStatus: (userId: string, status: UserStatus) => void;
}) {
  if (user.status === "deleted") {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("탈퇴 회원을 복구하시겠습니까?")) onUpdateUserStatus(user.id, "active");
          }}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
        >
          복구
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => onUpdateUserStatus(user.id, user.status === "suspended" ? "active" : "suspended")}
        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
      >
        {user.status === "suspended" ? "해제" : "정지"}
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm("회원을 탈퇴 처리하시겠습니까?")) onUpdateUserStatus(user.id, "deleted");
        }}
        className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100"
      >
        탈퇴
      </button>
    </div>
  );
}
