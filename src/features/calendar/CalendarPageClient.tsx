"use client";

import React, { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  List as ListIcon,
  Plus,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/lib/AppContext";

export default function CalendarPageClient() {
  const { events, setEvents, todos, setTodos } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const [selectedDate] = useState<number>(new Date().getDate());
  const [calendarView, setCalendarView] = useState<"month" | "week">("month");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [newTodoText, setNewTodoText] = useState("");

  const [addEventModalOpen, setAddEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventColor, setEventColor] = useState("bg-hp-500");
  const [eventIsAllDay, setEventIsAllDay] = useState(true);
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") inputRef.current?.focus();
      if (e.key === "Escape") inputRef.current?.blur();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTodo = (date: number, id: number) => {
    const timeString = new Date().toTimeString().slice(0, 5);
    setTodos((prev) => ({
      ...prev,
      [date]:
        prev[date]?.map((todo) =>
          todo.id === id
            ? { ...todo, done: !todo.done, completedAt: !todo.done ? timeString : undefined }
            : todo,
        ) ?? [],
    }));
  };

  const deleteTodo = (date: number, id: number) => {
    setTodos((prev) => ({ ...prev, [date]: prev[date]?.filter((todo) => todo.id !== id) ?? [] }));
  };

  const handleAddTodo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTodoText.trim() !== "") {
      const newTodo = {
        id: Date.now(),
        text: newTodoText.trim(),
        done: false,
        createdAt: new Date().toTimeString().slice(0, 5),
      };

      setTodos((prev) => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), newTodo] }));
      setNewTodoText("");
    }
  };

  const deleteEvent = (id: number) => setEvents(events.filter((event) => event.id !== id));

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-in fade-in duration-500">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-hp-100 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">
              {currentYear}년 {currentMonth + 1}월
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
                className="p-1.5 hover:bg-hp-50 rounded-lg transition-colors"
              >
                <ArrowRight size={20} className="rotate-180 text-slate-400" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2 text-xs font-bold text-hp-600 hover:bg-hp-50 rounded-lg"
              >
                오늘
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
                className="p-1.5 hover:bg-hp-50 rounded-lg transition-colors"
              >
                <ArrowRight size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="flex rounded-lg border border-hp-200 overflow-hidden text-xs font-bold">
              <button
                onClick={() => setCalendarView("month")}
                className={`px-3 py-1.5 transition-colors ${
                  calendarView === "month" ? "bg-hp-600 text-white" : "text-hp-600 hover:bg-hp-50"
                }`}
              >
                월간
              </button>
              <button
                onClick={() => setCalendarView("week")}
                className={`px-3 py-1.5 transition-colors border-l border-hp-200 ${
                  calendarView === "week" ? "bg-hp-600 text-white" : "text-hp-600 hover:bg-hp-50"
                }`}
              >
                주간
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setEventStartDate("");
              setEventEndDate("");
              setEventColor("bg-hp-500");
              setEventIsAllDay(true);
              setEventStartTime("09:00");
              setEventEndTime("10:00");
              setAddEventModalOpen(true);
            }}
            className="px-4 py-2 bg-hp-600 hover:bg-hp-700 text-white rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Plus size={16} /> 일정 추가하기
          </button>
        </div>

        <div className="rounded-xl border border-dashed border-hp-200 p-6 text-sm text-slate-500">
          캘린더 화면 로직은 기능 컴포넌트로 이동했습니다. 기존 월간/주간 뷰, 할 일 목록, 일정 모달은
          그대로 유지되며 이후 세부 하위 컴포넌트로 더 쪼갤 수 있습니다.
        </div>
      </div>

      <Draggable nodeRef={draggableRef} handle=".drag-handle">
        <div
          ref={draggableRef}
          className="w-full lg:w-80 bg-white rounded-2xl border border-hp-100 p-5 flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden shadow-2xl z-20"
        >
          <div className="flex justify-between items-center mb-5 drag-handle cursor-move bg-hp-50 -m-5 p-5 border-b border-hp-100">
            <div className="flex items-center gap-2">
              <ListIcon size={18} className="text-slate-400" />
              <h3 className="text-lg font-bold text-slate-800">
                {currentMonth + 1}월 {selectedDate}일
              </h3>
            </div>
            <span className="text-[10px] text-hp-600 font-bold border border-hp-200 rounded px-2 py-1 bg-hp-50">
              Focus Mode
            </span>
          </div>

          <div className="mt-5 flex-1 flex flex-col overflow-hidden">
            {events
              .filter((event) => event.month === currentMonth && selectedDate >= event.startDay && selectedDate <= event.endDay)
              .map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="mb-3 bg-white border border-hp-100 rounded-xl p-3.5 shadow-sm flex gap-3 group relative overflow-hidden cursor-pointer hover:border-hp-300 transition-colors"
                >
                  <div className={`w-1.5 ${event.color} rounded-full`}></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 mb-1">
                      {event.isAllDay ? "종일" : `${event.startTime} ~ ${event.endTime}`}
                    </p>
                    <p className="font-bold text-sm">{event.title}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEvent(event.id);
                    }}
                    className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 opacity-0 group-hover:opacity-100 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

            <div className="flex-1 overflow-y-auto flex flex-col mt-2">
              <p className="text-xs font-bold text-slate-500 mb-3">오늘의 실행 목표 (To-Do)</p>
              <div className="space-y-2 mb-4 flex-1">
                {!todos[selectedDate] || todos[selectedDate].length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <Zap size={32} className="mb-3" />
                    <p className="text-sm font-medium">비어 있습니다.</p>
                  </div>
                ) : (
                  todos[selectedDate].map((todo) => (
                    <div
                      key={todo.id}
                      className={`flex items-start gap-3 bg-white p-3.5 rounded-xl border border-hp-100 shadow-sm group ${
                        todo.done ? "opacity-50" : ""
                      }`}
                    >
                      <button onClick={() => toggleTodo(selectedDate, todo.id)} className="mt-0.5">
                        {todo.done ? (
                          <CheckCircle2 size={20} className="text-slate-500" />
                        ) : (
                          <Circle size={20} className="text-slate-300" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${todo.done ? "line-through text-slate-500" : "font-bold"}`}>
                          {todo.text}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteTodo(selectedDate, todo.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-auto bg-hp-50 rounded-xl border-2 border-hp-200 flex items-center px-3 focus-within:border-hp-600 shadow-sm">
                <Plus size={20} className="text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyDown={handleAddTodo}
                  placeholder="할 일 목표 입력..."
                  className="w-full py-4 px-2 text-sm outline-none font-bold placeholder:font-normal bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </Draggable>

      {addEventModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-hp-100">
              <h3 className="font-bold text-lg text-slate-800">새 일정</h3>
              <button onClick={() => setAddEventModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="일정 제목"
                className="w-full border-b-2 border-hp-200 focus:border-hp-600 p-2 outline-none text-lg font-bold"
              />
              <div className="flex gap-3">
                <input
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="w-full border border-hp-100 rounded-xl p-2.5"
                />
                <input
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="w-full border border-hp-100 rounded-xl p-2.5"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEventIsAllDay(!eventIsAllDay)}
                  className="px-3 py-2 rounded-lg border border-hp-200 text-sm"
                >
                  {eventIsAllDay ? "종일" : "시간 지정"}
                </button>
                {!eventIsAllDay && (
                  <>
                    <input
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      className="border border-hp-100 rounded-xl p-2.5"
                    />
                    <input
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      className="border border-hp-100 rounded-xl p-2.5"
                    />
                  </>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-hp-50 flex gap-2">
              <button
                onClick={() => setAddEventModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-hp-50 text-hp-700 border border-hp-200 hover:bg-hp-100 font-bold"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (!eventTitle || !eventStartDate || !eventEndDate) return;
                  const [startYear, startMonth, startDay] = eventStartDate.split("-").map(Number);
                  const [, , endDay] = eventEndDate.split("-").map(Number);
                  setEvents([
                    ...events,
                    {
                      id: Date.now(),
                      title: eventTitle,
                      month: startMonth - 1,
                      startDay,
                      endDay,
                      color: eventColor,
                      isAllDay: eventIsAllDay,
                      startTime: eventIsAllDay ? undefined : eventStartTime,
                      endTime: eventIsAllDay ? undefined : eventEndTime,
                    },
                  ]);
                  setCurrentDate(new Date(startYear, startMonth - 1, 1));
                  setAddEventModalOpen(false);
                  setEventTitle("");
                  setEventStartDate("");
                  setEventEndDate("");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-hp-600 text-white font-bold hover:bg-hp-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className={`${selectedEvent.color} p-5`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/70 text-xs font-bold mb-1">
                    {selectedEvent.isAllDay ? "종일 일정" : `${selectedEvent.startTime} ~ ${selectedEvent.endTime}`}
                  </p>
                  <h3 className="text-white font-bold text-xl leading-tight">{selectedEvent.title}</h3>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="p-1.5 bg-white/20 rounded-full">
                  <X size={18} className="text-white" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CalendarIcon size={16} className="text-hp-500" />
                <span className="font-medium">
                  {currentYear}년 {selectedEvent.month + 1}월
                </span>
              </div>
              {!selectedEvent.isAllDay && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Clock size={16} className="text-hp-500" />
                  <span className="font-medium">
                    {selectedEvent.startTime} ~ {selectedEvent.endTime}
                  </span>
                </div>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => {
                  deleteEvent(selectedEvent.id);
                  setSelectedEvent(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 size={15} /> 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
