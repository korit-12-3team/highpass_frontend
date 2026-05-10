"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Circle, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { EventType, TodoItem } from "@/shared/context/AppContext";
import { getDisplayEventColor } from "@/features/calendar/utils/eventForm";

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

type CalendarDaySidebarProps = {
  currentYear: number;
  currentMonth: number;
  selectedDate: number;
  selectedEvents: EventType[];
  selectedTodos: TodoItem[];
  calendarLoading: boolean;
  isSidebarOpen: boolean;
  isOverlay: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  editingTodoId: number | null;
  editingTodoText: string;
  draggedTodoId: number | null;
  dropTargetTodoId: number | null;
  newTodoText: string;
  onCloseSidebar: () => void;
  onChangeNewTodo: (text: string) => void;
  onAddTodo: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onToggleTodo: (todoId: number) => void;
  onStartTodoEdit: (todo: TodoItem) => void;
  onCancelTodoEdit: () => void;
  onSubmitTodoEdit: () => void;
  onChangeTodoEditText: (text: string) => void;
  onRequestDeleteTodo: (todo: TodoItem) => void;
  onTodoDragStart: (e: React.DragEvent<HTMLDivElement>, todoId: number) => void;
  onTodoDragOver: (e: React.DragEvent<HTMLDivElement>, todoId: number) => void;
  onTodoDrop: (e: React.DragEvent<HTMLDivElement>, todoId: number) => void;
  onTodoDragEnd: () => void;
  onEditEvent: (event: EventType) => void;
  onRequestDeleteEvent: (event: EventType) => void;
  onSelectEvent: (event: EventType) => void;
};

export function CalendarDaySidebar({
  currentYear,
  currentMonth,
  selectedDate,
  selectedEvents,
  selectedTodos,
  calendarLoading,
  isSidebarOpen,
  isOverlay,
  inputRef,
  editingTodoId,
  editingTodoText,
  draggedTodoId,
  dropTargetTodoId,
  newTodoText,
  onCloseSidebar,
  onChangeNewTodo,
  onAddTodo,
  onToggleTodo,
  onStartTodoEdit,
  onCancelTodoEdit,
  onSubmitTodoEdit,
  onChangeTodoEditText,
  onRequestDeleteTodo,
  onTodoDragStart,
  onTodoDragOver,
  onTodoDrop,
  onTodoDragEnd,
  onEditEvent,
  onRequestDeleteEvent,
  onSelectEvent,
}: CalendarDaySidebarProps) {
  const lunarDate = new Intl.DateTimeFormat("ko-KR-u-ca-chinese", { month: "numeric", day: "numeric" })
    .format(new Date(currentYear, currentMonth, selectedDate))
    .split(".")
    .filter(Boolean)
    .map((s) => s.trim())
    .join(".");

  return (
    <div className={isOverlay ? "contents" : `relative flex transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-80" : "w-0 overflow-visible"}`}>
      {isOverlay && isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[2px]" onClick={onCloseSidebar} />
      )}
      <aside
        className={
          isOverlay
            ? `fixed inset-y-0 right-0 z-50 flex w-80 flex-col bg-white p-5 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`
            : `relative z-20 flex h-full flex-col overflow-hidden rounded-2xl border border-hp-100 bg-white shadow-lg transition-all duration-300 ${isSidebarOpen ? "w-80 p-5 opacity-100" : "w-0 p-0 opacity-0 border-0"}`
        }
      >
        {isOverlay && (
          <button
            onClick={onCloseSidebar}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex h-full flex-col">
          {/* Date header */}
          <div className="-m-5 mb-3 border-b border-hp-100 bg-gradient-to-r from-hp-50 via-white to-white px-5 py-4">
            <div className="flex flex-col gap-0.5">
              <h3 className="mt-1 text-lg font-black text-slate-900">
                {currentMonth + 1}월 {selectedDate}일 {WEEK_DAYS[new Date(currentYear, currentMonth, selectedDate).getDay()]}요일
              </h3>
              <span className="text-sm font-medium text-slate-400">음 {lunarDate}</span>
            </div>
          </div>

          <div className="mt-2 flex flex-1 flex-col overflow-hidden">
            {/* Events section */}
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[13px] font-black uppercase tracking-[0.18em] text-slate-500">- 일정 -</p>
              <span className="rounded-full bg-hp-100 px-2.5 py-1 text-[11px] font-bold text-hp-700">{selectedEvents.length}</span>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-2xl bg-slate-50/80 p-2 pr-1">
              {calendarLoading ? (
                <div className="mb-4 rounded-xl border border-dashed border-hp-200 p-4 text-sm text-slate-500">
                  일정을 불러오는 중입니다...
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="mb-4 rounded-xl border border-dashed border-hp-200 p-4 text-sm text-slate-500">
                  선택한 날짜에 등록된 일정이 없습니다.
                </div>
              ) : (
                selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="group relative mb-3 flex cursor-pointer gap-3 overflow-hidden rounded-xl border border-hp-100 bg-white p-3.5 shadow-sm transition-colors hover:border-hp-300"
                  >
                    <div className={`w-1.5 rounded-full ${getDisplayEventColor(event)}`} />
                    <div className="flex-1">
                      <p className="mb-1 text-[10px] font-bold text-slate-400">
                        {event.isAllDay ? "종일" : `${event.startTime} ~ ${event.endTime}`}
                      </p>
                      <p className="text-sm font-bold">{event.title}</p>
                    </div>
                    <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditEvent(event); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-hp-600"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRequestDeleteEvent(event); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Todos section */}
            <div className="mt-3 flex flex-1 flex-col overflow-hidden">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-slate-500">- 오늘 할 일 -</p>
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700">{selectedTodos.length}</span>
              </div>
              <div className="mb-4 flex-1 overflow-y-auto rounded-2xl bg-slate-50/80 p-2 pr-1">
                <div className="h-full space-y-2">
                  {selectedTodos.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-slate-400 opacity-60">
                      <AlertCircle size={32} className="mb-3" />
                      <p className="text-sm font-medium">이 날짜에 등록된 할 일이 없습니다.</p>
                    </div>
                  ) : (
                    selectedTodos.map((todo) => (
                      <div
                        key={todo.id}
                        draggable={editingTodoId !== todo.id}
                        onDragStart={(e) => onTodoDragStart(e, todo.id)}
                        onDragOver={(e) => onTodoDragOver(e, todo.id)}
                        onDrop={(e) => onTodoDrop(e, todo.id)}
                        onDragEnd={onTodoDragEnd}
                        className={`group flex items-start gap-3 rounded-xl border border-hp-100 bg-white p-3.5 shadow-sm transition ${todo.done ? "opacity-50" : ""} ${
                          draggedTodoId === todo.id ? "scale-[0.98] border-hp-300 opacity-70" : ""
                        } ${dropTargetTodoId === todo.id && draggedTodoId !== todo.id ? "border-hp-500 ring-2 ring-hp-100" : ""}`}
                      >
                        <div
                          className={`mt-0.5 cursor-grab text-slate-300 active:cursor-grabbing ${editingTodoId === todo.id ? "pointer-events-none opacity-30" : "hover:text-hp-500"}`}
                          aria-hidden="true"
                        >
                          <GripVertical size={18} />
                        </div>
                        <button onClick={() => onToggleTodo(todo.id)} className="mt-0.5">
                          {todo.done ? (
                            <CheckCircle2 size={20} className="text-slate-500" />
                          ) : (
                            <Circle size={20} className="text-slate-300" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          {editingTodoId === todo.id ? (
                            <input
                              type="text"
                              value={editingTodoText}
                              onChange={(e) => onChangeTodoEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); onSubmitTodoEdit(); }
                                if (e.key === "Escape") onCancelTodoEdit();
                              }}
                              className="w-full rounded-lg border border-hp-200 px-2.5 py-1.5 text-sm font-medium outline-none focus:border-hp-500"
                              autoFocus
                            />
                          ) : (
                            <p className={`text-sm ${todo.done ? "line-through text-slate-500" : "font-bold"}`}>
                              {todo.text}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {editingTodoId === todo.id ? (
                            <>
                              <button
                                onClick={onSubmitTodoEdit}
                                className="rounded-md px-2 py-1 text-[11px] font-bold text-hp-600 hover:bg-hp-50"
                              >
                                저장
                              </button>
                              <button
                                onClick={onCancelTodoEdit}
                                className="rounded-md px-2 py-1 text-[11px] font-bold text-slate-400 hover:bg-slate-100"
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onStartTodoEdit(todo)}
                                className="text-slate-300 opacity-0 hover:text-hp-600 group-hover:opacity-100"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => onRequestDeleteTodo(todo)}
                                className="text-slate-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Add todo input */}
          <div className="mt-auto pt-4">
            <div className="flex items-center rounded-xl border-2 border-hp-200 bg-hp-50 px-3 shadow-sm focus-within:border-hp-600">
              <Plus size={20} className="text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={newTodoText}
                onChange={(e) => onChangeNewTodo(e.target.value)}
                onKeyDown={onAddTodo}
                placeholder="할 일을 입력하고 Enter를 누르세요"
                className="w-full bg-transparent px-2 py-4 text-sm font-bold outline-none placeholder:font-normal"
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
