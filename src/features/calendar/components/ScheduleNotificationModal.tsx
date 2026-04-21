"use client";

import React from "react";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";
import { EventType } from "@/entities/common/types";

interface ScheduleNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowToday: () => void;
  startingEvents: EventType[];
  endingEvents: EventType[];
}

export default function ScheduleNotificationModal({
  isOpen,
  onClose,
  onDontShowToday,
  startingEvents,
  endingEvents,
}: ScheduleNotificationModalProps) {
  if (!isOpen) return null;

  const hasEvents = startingEvents.length > 0 || endingEvents.length > 0;

  if (!hasEvents) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="relative bg-hp-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-2">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">오늘의 일정 알림</h2>
              <p className="text-sm text-hp-100">오늘 시작되거나 종료되는 일정이 있습니다.</p>
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {startingEvents.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                오늘 시작되는 일정
              </h3>
              <div className="space-y-3">
                {startingEvents.map((event) => (
                  <div key={`start-${event.id}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="font-semibold text-slate-800">{event.title}</div>
                    {event.content && <div className="mt-1 text-sm text-slate-500 line-clamp-2">{event.content}</div>}
                    <div className="mt-2 flex items-center gap-1 text-xs text-hp-600">
                      <Clock className="h-3 w-3" />
                      {event.isAllDay ? "하루 종일" : `${event.startTime || "00:00"} 부터`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endingEvents.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                오늘 종료되는 일정
              </h3>
              <div className="space-y-3">
                {endingEvents.map((event) => (
                  <div key={`end-${event.id}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="font-semibold text-slate-800">{event.title}</div>
                    {event.content && <div className="mt-1 text-sm text-slate-500 line-clamp-2">{event.content}</div>}
                    <div className="mt-2 flex items-center gap-1 text-xs text-hp-600">
                      <Clock className="h-3 w-3" />
                      {event.isAllDay ? "하루 종일" : `${event.endTime || "23:59"} 까지`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex border-t border-slate-100 p-4 gap-3">
          <button
            onClick={onDontShowToday}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
          >
            오늘 다시 보지 않음
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-hp-500 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-lg shadow-hp-500/30"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
