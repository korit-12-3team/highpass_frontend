"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  CheckSquare,
  Clock,
  Gift,
  Plus,
  Search,
} from "lucide-react";
import type {
  CreateEventInput,
  CreateTaskInput,
  GetEventInput,
  GetTaskInput,
  KakaoEvent,
  KakaoFriendBirthday,
  KakaoTask,
} from "@/features/calendar/api/kakao-playmcp";

type Tab = "events" | "tasks" | "birthdays" | "time";

type PanelState = {
  currentTime: string | null;
  events: KakaoEvent[];
  tasks: KakaoTask[];
  birthdays: KakaoFriendBirthday[];
  loading: boolean;
};

const initialState: PanelState = {
  currentTime: null,
  events: [],
  tasks: [],
  birthdays: [],
  loading: false,
};

export default function KakaoCalendarPanel() {
  const [tab, setTab] = useState<Tab>("events");
  const [state, setState] = useState<PanelState>(initialState);

  const [eventForm, setEventForm] = useState<CreateEventInput>({
    title: "",
    startAt: "",
    endAt: "",
    description: "",
    allDay: false,
    location: "",
    color: "",
  });

  const [taskForm, setTaskForm] = useState<CreateTaskInput>({
    title: "",
    dueDate: "",
    memo: "",
  });

  const [eventQuery, setEventQuery] = useState<GetEventInput>({ from: "", to: "" });
  const [taskQuery, setTaskQuery] = useState<GetTaskInput>({ from: "", to: "" });

  function setLoading(loading: boolean) {
    setState((s) => ({ ...s, loading }));
  }

  // ── GetCurrentTime ──────────────────────────────────────────────────────────
  async function handleGetCurrentTime() {
    setLoading(true);
    try {
      // PlayMCP KakaotalkCal-GetCurrentTime
      const res = await fetch("/api/kakao-cal/current-time", { method: "GET" });
      const data = await res.json();
      setState((s) => ({ ...s, currentTime: data.currentTime ?? null }));
    } catch {
      toast.error("현재 시간 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // ── GetEvent ────────────────────────────────────────────────────────────────
  async function handleGetEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (eventQuery.from) params.set("from", eventQuery.from);
      if (eventQuery.to) params.set("to", eventQuery.to);
      const res = await fetch(`/api/kakao-cal/events?${params}`);
      const data = await res.json();
      setState((s) => ({ ...s, events: data.events ?? [] }));
    } catch {
      toast.error("이벤트 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // ── CreateEvent ─────────────────────────────────────────────────────────────
  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventForm.title || !eventForm.startAt || !eventForm.endAt) {
      toast.error("제목, 시작일, 종료일을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/kakao-cal/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("카카오 캘린더에 일정이 추가되었습니다.");
        setState((s) => ({ ...s, events: [data.event, ...s.events] }));
        setEventForm({ title: "", startAt: "", endAt: "", description: "", allDay: false, location: "", color: "" });
      } else {
        toast.error(data.message ?? "일정 생성에 실패했습니다.");
      }
    } catch {
      toast.error("일정 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // ── GetTask ─────────────────────────────────────────────────────────────────
  async function handleGetTasks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (taskQuery.from) params.set("from", taskQuery.from);
      if (taskQuery.to) params.set("to", taskQuery.to);
      const res = await fetch(`/api/kakao-cal/tasks?${params}`);
      const data = await res.json();
      setState((s) => ({ ...s, tasks: data.tasks ?? [] }));
    } catch {
      toast.error("할 일 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // ── CreateTask ──────────────────────────────────────────────────────────────
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskForm.title) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/kakao-cal/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("카카오 캘린더에 할 일이 추가되었습니다.");
        setState((s) => ({ ...s, tasks: [data.task, ...s.tasks] }));
        setTaskForm({ title: "", dueDate: "", memo: "" });
      } else {
        toast.error(data.message ?? "할 일 생성에 실패했습니다.");
      }
    } catch {
      toast.error("할 일 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // ── GetFriendsBirthdays ─────────────────────────────────────────────────────
  async function handleGetBirthdays() {
    setLoading(true);
    try {
      const res = await fetch("/api/kakao-cal/birthdays");
      const data = await res.json();
      setState((s) => ({ ...s, birthdays: data.birthdays ?? [] }));
    } catch {
      toast.error("생일 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "events", label: "일정", icon: <Calendar size={16} /> },
    { id: "tasks", label: "할 일", icon: <CheckSquare size={16} /> },
    { id: "birthdays", label: "생일", icon: <Gift size={16} /> },
    { id: "time", label: "현재 시각", icon: <Clock size={16} /> },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-yellow-300 bg-yellow-50 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">💛</span>
        <h2 className="text-base font-semibold text-yellow-800">카카오톡 캘린더 연동</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-yellow-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-yellow-400 text-yellow-900 shadow-sm"
                : "text-yellow-700 hover:bg-yellow-200"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading bar */}
      {state.loading && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-yellow-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-yellow-400" />
        </div>
      )}

      {/* Panel: 일정 */}
      {tab === "events" && (
        <div className="flex flex-col gap-4">
          {/* Create Event */}
          <form onSubmit={handleCreateEvent} className="flex flex-col gap-2 rounded-xl border border-yellow-200 bg-white p-3">
            <p className="text-sm font-medium text-yellow-800">새 일정 추가</p>
            <input
              className="rounded-lg border border-yellow-200 px-3 py-1.5 text-sm outline-none focus:border-yellow-400"
              placeholder="제목"
              value={eventForm.title}
              onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
            />
            <div className="flex gap-2">
              <input
                type="datetime-local"
                className="flex-1 rounded-lg border border-yellow-200 px-2 py-1.5 text-sm outline-none focus:border-yellow-400"
                value={eventForm.startAt}
                onChange={(e) => setEventForm((f) => ({ ...f, startAt: e.target.value }))}
              />
              <input
                type="datetime-local"
                className="flex-1 rounded-lg border border-yellow-200 px-2 py-1.5 text-sm outline-none focus:border-yellow-400"
                value={eventForm.endAt}
                onChange={(e) => setEventForm((f) => ({ ...f, endAt: e.target.value }))}
              />
            </div>
            <input
              className="rounded-lg border border-yellow-200 px-3 py-1.5 text-sm outline-none focus:border-yellow-400"
              placeholder="장소 (선택)"
              value={eventForm.location}
              onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))}
            />
            <textarea
              className="rounded-lg border border-yellow-200 px-3 py-1.5 text-sm outline-none focus:border-yellow-400"
              placeholder="메모 (선택)"
              rows={2}
              value={eventForm.description}
              onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm text-yellow-700">
              <input
                type="checkbox"
                checked={eventForm.allDay}
                onChange={(e) => setEventForm((f) => ({ ...f, allDay: e.target.checked }))}
              />
              하루 종일
            </label>
            <button
              type="submit"
              disabled={state.loading}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-yellow-400 py-2 text-sm font-medium text-yellow-900 hover:bg-yellow-500 disabled:opacity-50"
            >
              <Plus size={14} /> 카카오 캘린더에 추가
            </button>
          </form>

          {/* Get Events */}
          <div className="flex flex-col gap-2 rounded-xl border border-yellow-200 bg-white p-3">
            <p className="text-sm font-medium text-yellow-800">일정 조회</p>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 rounded-lg border border-yellow-200 px-2 py-1.5 text-sm outline-none focus:border-yellow-400"
                value={eventQuery.from}
                onChange={(e) => setEventQuery((q) => ({ ...q, from: e.target.value }))}
                placeholder="시작일"
              />
              <input
                type="date"
                className="flex-1 rounded-lg border border-yellow-200 px-2 py-1.5 text-sm outline-none focus:border-yellow-400"
                value={eventQuery.to}
                onChange={(e) => setEventQuery((q) => ({ ...q, to: e.target.value }))}
                placeholder="종료일"
              />
            </div>
            <button
              onClick={handleGetEvents}
              disabled={state.loading}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-yellow-100 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-200 disabled:opacity-50"
            >
              <Search size={14} /> 일정 불러오기
            </button>
            {state.events.length > 0 && (
              <ul className="mt-1 flex flex-col gap-1">
                {state.events.map((ev, i) => (
                  <li key={ev.eventId ?? i} className="rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2 text-sm">
                    <p className="font-medium text-yellow-900">{ev.title}</p>
                    <p className="text-xs text-yellow-600">{ev.startAt} ~ {ev.endAt}</p>
                    {ev.location && <p className="text-xs text-yellow-500">📍 {ev.location}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Panel: 할 일 */}
      {tab === "tasks" && (
        <div className="flex flex-col gap-4">
          {/* Create Task */}
          <form onSubmit={handleCreateTask} className="flex flex-col gap-2 rounded-xl border border-yellow-200 bg-white p-3">
            <p className="text-sm font-medium text-yellow-800">새 할 일 추가</p>
            <input
              className="rounded-lg border border-yellow-200 px-3 py-1.5 text-sm outline-none focus:border-yellow-400"
              placeholder="제목"
              value={taskForm.title}
              onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              type="date"
              className="rounded-lg border border-yellow-200 px-3 py-1.5 text-sm outline-none focus:border-yellow-400"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
            <textarea
              className="rounded-lg border border-yellow-200 px-3 py-1.5 text-sm outline-none focus:border-yellow-400"
              placeholder="메모 (선택)"
              rows={2}
              value={taskForm.memo}
              onChange={(e) => setTaskForm((f) => ({ ...f, memo: e.target.value }))}
            />
            <button
              type="submit"
              disabled={state.loading}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-yellow-400 py-2 text-sm font-medium text-yellow-900 hover:bg-yellow-500 disabled:opacity-50"
            >
              <Plus size={14} /> 카카오 캘린더에 추가
            </button>
          </form>

          {/* Get Tasks */}
          <div className="flex flex-col gap-2 rounded-xl border border-yellow-200 bg-white p-3">
            <p className="text-sm font-medium text-yellow-800">할 일 조회</p>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 rounded-lg border border-yellow-200 px-2 py-1.5 text-sm outline-none focus:border-yellow-400"
                value={taskQuery.from}
                onChange={(e) => setTaskQuery((q) => ({ ...q, from: e.target.value }))}
              />
              <input
                type="date"
                className="flex-1 rounded-lg border border-yellow-200 px-2 py-1.5 text-sm outline-none focus:border-yellow-400"
                value={taskQuery.to}
                onChange={(e) => setTaskQuery((q) => ({ ...q, to: e.target.value }))}
              />
            </div>
            <button
              onClick={handleGetTasks}
              disabled={state.loading}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-yellow-100 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-200 disabled:opacity-50"
            >
              <Search size={14} /> 할 일 불러오기
            </button>
            {state.tasks.length > 0 && (
              <ul className="mt-1 flex flex-col gap-1">
                {state.tasks.map((task, i) => (
                  <li key={task.taskId ?? i} className="flex items-center gap-2 rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2 text-sm">
                    <span className={task.isDone ? "text-yellow-400 line-through" : "text-yellow-900"}>{task.title}</span>
                    {task.dueDate && <span className="ml-auto text-xs text-yellow-500">{task.dueDate}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Panel: 생일 */}
      {tab === "birthdays" && (
        <div className="flex flex-col gap-3 rounded-xl border border-yellow-200 bg-white p-3">
          <p className="text-sm font-medium text-yellow-800">친구 생일 조회</p>
          <button
            onClick={handleGetBirthdays}
            disabled={state.loading}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-yellow-400 py-2 text-sm font-medium text-yellow-900 hover:bg-yellow-500 disabled:opacity-50"
          >
            <Gift size={14} /> 생일 불러오기
          </button>
          {state.birthdays.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {state.birthdays.map((b) => (
                <li key={b.friendId} className="flex items-center gap-3 rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2 text-sm">
                  <span>🎂</span>
                  <span className="font-medium text-yellow-900">{b.name}</span>
                  <span className="ml-auto text-xs text-yellow-600">{b.birthday}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-xs text-yellow-500">불러오기 버튼을 눌러주세요.</p>
          )}
        </div>
      )}

      {/* Panel: 현재 시각 */}
      {tab === "time" && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-yellow-200 bg-white p-6">
          <p className="text-sm font-medium text-yellow-800">카카오 서버 현재 시각</p>
          {state.currentTime ? (
            <p className="text-2xl font-bold text-yellow-700">
              {new Date(state.currentTime).toLocaleString("ko-KR")}
            </p>
          ) : (
            <p className="text-sm text-yellow-400">조회 버튼을 눌러주세요.</p>
          )}
          <button
            onClick={handleGetCurrentTime}
            disabled={state.loading}
            className="flex items-center gap-1.5 rounded-lg bg-yellow-400 px-5 py-2 text-sm font-medium text-yellow-900 hover:bg-yellow-500 disabled:opacity-50"
          >
            <Clock size={14} /> 현재 시각 조회
          </button>
        </div>
      )}
    </div>
  );
}
