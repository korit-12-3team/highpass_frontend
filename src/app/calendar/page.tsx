"use client";

import { useState } from "react";
import Link from "next/link";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { allItems } from "@/lib/data";

interface PersonalSchedule {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [personalSchedules, setPersonalSchedules] = useState<PersonalSchedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  // 1. 공공데이터(자격증 일정) 표시 함수
  const getOfficialSchedules = (day: Date) => {
    return allItems.filter(item => {
      if (item.startDate === "-") return false;
      const start = parseISO(item.startDate);
      const end = parseISO(item.endDate);
      return day >= start && day <= end;
    });
  };

  // 2. 개인 일정 표시 함수
  const getPersonalSchedules = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return personalSchedules.filter(s => s.date === dateStr);
  };

  const handleDateClick = (clickedDate: Date) => {
    setSelectedDate(clickedDate);
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setPersonalSchedules([
      ...personalSchedules,
      {
        id: Date.now(),
        date: format(selectedDate, "yyyy-MM-dd"),
        title: newTitle,
        content: newContent
      }
    ]);
    setNewTitle("");
    setNewContent("");
    setIsModalOpen(false);
  };

  const deleteSchedule = (id: number) => {
    setPersonalSchedules(personalSchedules.filter(s => s.id !== id));
  };

  // 달력 그리기
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const officialInfos = getOfficialSchedules(day);
      const personalInfos = getPersonalSchedules(day);

      days.push(
        <div
          key={day.toString()}
          onClick={() => handleDateClick(cloneDay)}
          className={`relative flex flex-col p-2 min-h-[100px] sm:min-h-[120px] border-r border-b border-gray-100 cursor-pointer transition-colors ${
            !isSameMonth(day, monthStart) ? "bg-gray-50 text-gray-300" : "bg-white hover:bg-orange-50"
          } ${isSameDay(day, selectedDate) ? "bg-orange-100/50" : ""}
          ${isSameDay(day, new Date()) ? "font-bold text-orange-600" : "text-gray-700"}
          `}
        >
          <span className="text-sm font-semibold mb-1">
            {isSameDay(day, new Date()) ? <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full">{formattedDate}</span> : formattedDate}
          </span>
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] scrollbar-hide">
            {officialInfos.map((info) => (
              <div key={info.id} className="text-[10px] leading-tight px-1.5 py-1 bg-amber-100 text-amber-800 rounded truncate" title={info.name}>
                📝 {info.name}
              </div>
            ))}
            {personalInfos.map((info) => (
              <div key={info.id} className="text-[10px] leading-tight px-1.5 py-1 bg-sky-100 text-sky-800 rounded truncate" title={info.title}>
                📌 {info.title}
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  // 화면 우측: 선택된 날짜의 일정 목록
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedOfficial = getOfficialSchedules(selectedDate);
  const selectedPersonal = getPersonalSchedules(selectedDate);

  return (
    <div className="min-h-screen bg-orange-50 text-gray-800">
      {/* 헤더 */}
      <header className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>📝</span>
            <Link href="/" className="text-xl sm:text-2xl font-black text-orange-600 tracking-tight leading-none">
              자격증 시험일정
            </Link>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors">홈</Link>
            <Link href="/calendar" className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">캘린더</Link>
            <Link href="/study" className="text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors">스터디</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* 달력 영역 */}
          <div className="w-full lg:w-2/3 bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-orange-400 to-amber-300 flex justify-between items-center text-white">
              <button onClick={prevMonth} className="px-4 py-2 hover:bg-white/20 rounded-xl font-bold transition">◀</button>
              <h2 className="text-2xl font-black">{format(currentDate, "yyyy년 MM월", { locale: ko })}</h2>
              <button onClick={nextMonth} className="px-4 py-2 hover:bg-white/20 rounded-xl font-bold transition">▶</button>
            </div>
            <div className="grid grid-cols-7 border-b border-orange-100 bg-orange-50/50">
              {['일', '월', '화', '수', '목', '금', '토'].map(col => (
                <div key={col} className={`p-3 text-center text-sm font-bold ${col === '일' ? 'text-red-500' : col === '토' ? 'text-blue-500' : 'text-gray-500'}`}>
                  {col}
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              {rows}
            </div>
          </div>

          {/* 일정 목록 / 추가 영역 */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6 sticky top-24">
              <div className="mb-6 flex justify-between items-end border-b pb-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900">{format(selectedDate, "M월 d일 (E)", { locale: ko })}</h3>
                  <p className="text-sm text-gray-500 mt-1">이 날의 일정을 확인하세요!</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition shadow-sm"
                >
                  + 내 일정
                </button>
              </div>

              <div className="space-y-6">
                {selectedOfficial.length === 0 && selectedPersonal.length === 0 && (
                  <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl">
                    <p className="font-medium">등록된 일정이 없습니다</p>
                  </div>
                )}

                {/* 공식 자격증 일정 */}
                {selectedOfficial.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-amber-600 bg-amber-50 inline-block px-3 py-1 rounded-full mb-3">✅ 자격증 공식 일정</h4>
                    <div className="space-y-3">
                      {selectedOfficial.map(info => (
                        <div key={info.id} className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                          <p className="font-bold text-gray-800 text-sm leading-tight group-hover:text-amber-600 transition">{info.name}</p>
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><span>{info.category}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 개인 일정 */}
                {selectedPersonal.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-sky-600 bg-sky-50 inline-block px-3 py-1 rounded-full mb-3">📍 나의 스케줄</h4>
                    <div className="space-y-3">
                      {selectedPersonal.map(info => (
                        <div key={info.id} className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-sky-400" />
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-gray-800 text-sm leading-tight">{info.title}</p>
                            <button onClick={() => deleteSchedule(info.id)} className="text-xs text-gray-400 hover:text-red-500 transition px-2">삭제</button>
                          </div>
                          {info.content && <p className="text-xs text-gray-500 mt-2 leading-relaxed">{info.content}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 일정 추가 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-orange-100">
            <div className="bg-gradient-to-r from-orange-400 to-amber-300 p-5 text-white">
              <h3 className="text-lg font-black">{format(selectedDate, "M월 d일")} 일정 추가</h3>
            </div>
            <form onSubmit={handleAddSchedule} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">일정 제목 <span className="text-orange-500">*</span></label>
                <input 
                  type="text" 
                  autoFocus 
                  required 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="예: 공인중개사 1차 인강 3강 듣기"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">상세 내역 (선택)</label>
                <textarea 
                  rows={3}
                  value={newContent} 
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                  placeholder="어디서 공부할지, 주요 계획이 무엇인지 적어보세요."
                />
              </div>
              <div className="flex justify-end gap-3 font-medium">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition">
                  취소
                </button>
                <button type="submit" className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition shadow-sm">
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
