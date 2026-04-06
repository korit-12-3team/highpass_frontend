"use client";
import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Calendar as CalendarIcon, Plus, ArrowRight, Trash2, CheckCircle2, Circle, Zap, Clock, List as ListIcon, X } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export default function CalendarPage() {
  const { currentUser, events, setEvents, todos, setTodos } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [isDraggingEvent, setIsDraggingEvent] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');

  // Add Event modal
  const [addEventModalOpen, setAddEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventColor, setEventColor] = useState('bg-hp-500');
  const [eventIsAllDay, setEventIsAllDay] = useState(true);
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') inputRef.current?.focus();
      if (e.key === 'Escape') inputRef.current?.blur();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTodo = (date: number, id: number) => {
    const timeString = new Date().toTimeString().slice(0, 5);
    setTodos(prev => ({ ...prev, [date]: prev[date]?.map(t => t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? timeString : undefined } : t) ?? [] }));
  };

  const deleteTodo = (date: number, id: number) => {
    setTodos(prev => ({ ...prev, [date]: prev[date]?.filter(t => t.id !== id) ?? [] }));
  };

  const handleAddTodo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTodoText.trim() !== '') {
      const newTodo = { id: Date.now(), text: newTodoText.trim(), done: false, createdAt: new Date().toTimeString().slice(0, 5) };
      setTodos(prev => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), newTodo] }));
      setNewTodoText('');
    }
  };

  const deleteEvent = (id: number) => setEvents(events.filter(e => e.id !== id));

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-in fade-in duration-500">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-hp-100 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">{currentYear}년 {currentMonth + 1}월</h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1.5 hover:bg-hp-50 rounded-lg transition-colors"><ArrowRight size={20} className="rotate-180 text-slate-400" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-2 text-xs font-bold text-hp-600 hover:bg-hp-50 rounded-lg">오늘</button>
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1.5 hover:bg-hp-50 rounded-lg transition-colors"><ArrowRight size={20} className="text-slate-400" /></button>
            </div>
            <div className="flex rounded-lg border border-hp-200 overflow-hidden text-xs font-bold">
              <button onClick={() => setCalendarView('month')} className={`px-3 py-1.5 transition-colors ${calendarView === 'month' ? 'bg-hp-600 text-white' : 'text-hp-600 hover:bg-hp-50'}`}>월간</button>
              <button onClick={() => setCalendarView('week')} className={`px-3 py-1.5 transition-colors border-l border-hp-200 ${calendarView === 'week' ? 'bg-hp-600 text-white' : 'text-hp-600 hover:bg-hp-50'}`}>주간</button>
            </div>
          </div>
          <button onClick={() => { setEventStartDate(''); setEventEndDate(''); setEventColor('bg-hp-500'); setEventIsAllDay(true); setEventStartTime('09:00'); setEventEndTime('10:00'); setAddEventModalOpen(true); }} className="px-4 py-2 bg-hp-600 hover:bg-hp-700 text-white rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> 일정 추가하기</button>
        </div>

        {calendarView === 'month' && (<>
          <div className="grid grid-cols-7 border border-hp-500 rounded-t-xl overflow-hidden bg-hp-600 text-center text-sm font-bold text-white border-b-0">
            {['일','월','화','수','목','금','토'].map((d, i) => (
              <div key={d} className={`p-2 ${i < 6 ? 'border-r border-hp-500' : ''} ${i === 0 ? 'text-red-300' : i === 6 ? 'text-hp-200' : ''}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 border border-hp-100 rounded-b-xl overflow-hidden flex-1 bg-white">
            {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-hp-50 bg-hp-50/30"></div>
            ))}
            {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
              const crossingEvents = events.filter(e => e.month === currentMonth && day >= e.startDay && day <= e.endDay).sort((a, b) => a.startDay - b.startDay);
              const colIndex = (new Date(currentYear, currentMonth, 1).getDay() + day - 1) % 7;
              const isToday = new Date().getFullYear() === currentYear && new Date().getMonth() === currentMonth && new Date().getDate() === day;
              return (
                <div key={day} onClick={() => setSelectedDate(day)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverDay(day); }}
                  onDragLeave={() => setDragOverDay(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOverDay(null); setIsDraggingEvent(false); const eventId = e.dataTransfer.getData('eventId'); const sourceDay = parseInt(e.dataTransfer.getData('sourceDay'), 10); if (eventId && !isNaN(sourceDay)) { const diff = day - sourceDay; const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); setEvents(prev => prev.map(ev => { if (ev.id.toString() !== eventId) return ev; const newStart = ev.startDay + diff; const newEnd = ev.endDay + diff; if (newStart < 1 || newEnd > daysInMonth || newStart > newEnd) return ev; return { ...ev, startDay: newStart, endDay: newEnd }; })); } }}
                  className={`min-h-[100px] border-b border-r border-slate-100 cursor-pointer p-0 flex flex-col transition-colors duration-150 ${dragOverDay === day && isDraggingEvent ? 'bg-hp-100 ring-2 ring-inset ring-hp-400' : selectedDate === day ? 'bg-hp-50 relative' : 'hover:bg-hp-50'}`}>
                  {selectedDate === day && <div className="absolute inset-0 border-2 border-hp-500 pointer-events-none"></div>}
                  <div className="p-1.5 flex justify-between items-start z-10">
                    <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-red-500 text-white' : selectedDate === day ? 'bg-hp-600 text-white' : 'text-slate-700'}`}>{day}</span>
                    {todos[day] && todos[day].length > 0 && <div className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-1 ${todos[day].every(t => t.done) ? 'bg-hp-600' : 'bg-slate-300'}`}></div>}
                  </div>
                  <div className="flex-1 flex flex-col gap-[1px] mt-0.5">
                    {crossingEvents.slice(0, 3).map(evt => {
                      const isStart = day === evt.startDay;
                      const isEnd = day === evt.endDay;
                      const isSingleDay = evt.startDay === evt.endDay;
                      return (
                        <div key={evt.id} draggable={true}
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}
                          onDragStart={(e) => { e.stopPropagation(); setIsDraggingEvent(true); e.dataTransfer.setData('eventId', evt.id.toString()); e.dataTransfer.setData('sourceDay', day.toString()); e.dataTransfer.effectAllowed = 'move'; }}
                          onDragEnd={() => { setIsDraggingEvent(false); setDragOverDay(null); }}
                          onDragOver={(e) => { e.stopPropagation(); e.preventDefault(); }}
                          className={`${isSingleDay ? 'min-h-[26px] py-0.5 items-start' : 'h-[26px] items-center'} ${evt.color} ${!isStart && colIndex !== 0 && '-ml-[1px]'} ${!isEnd && colIndex !== 6 && 'w-[calc(100%+1px)]'} ${isStart || colIndex === 0 ? 'rounded-l-full ml-1' : ''} ${isEnd || colIndex === 6 ? 'rounded-r-full mr-1' : ''} flex relative z-20 cursor-pointer hover:brightness-110 hover:shadow-md active:opacity-70 transition-all select-none`}>
                          {(isStart || colIndex === 0) && (
                            <span className={`text-[11px] text-white font-bold ml-2 z-10 pointer-events-none drop-shadow-sm ${isSingleDay ? 'whitespace-normal break-words leading-tight mr-2' : 'whitespace-nowrap overflow-visible'}`}>{evt.title}</span>
                          )}
                        </div>
                      );
                    })}
                    {crossingEvents.length > 3 && <div className="text-[10px] text-slate-500 font-bold px-1.5 leading-[18px]">+{crossingEvents.length - 3}개</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </>)}

        {calendarView === 'week' && (() => {
          const weekDayLabels = ['일', '월', '화', '수', '목', '금', '토'];
          const startOfWeek = new Date(currentYear, currentMonth, selectedDate - new Date(currentYear, currentMonth, selectedDate).getDay());
          const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d; });
          const hours = Array.from({ length: 24 }, (_, i) => i);
          const todayNow = new Date();
          return (
            <div className="flex-1 flex flex-col overflow-hidden border border-hp-100 rounded-xl">
              <div className="grid grid-cols-8 bg-hp-600 text-white text-xs font-bold">
                <div className="p-2 border-r border-hp-500 text-center text-hp-200">시간</div>
                {weekDays.map((d, i) => {
                  const isToday = d.toDateString() === todayNow.toDateString();
                  return (
                    <div key={i} onClick={() => { setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1)); setSelectedDate(d.getDate()); }} className={`p-2 text-center border-r border-hp-500 cursor-pointer hover:bg-hp-700 transition-colors ${i === 0 ? 'text-red-300' : i === 6 ? 'text-hp-200' : ''}`}>
                      <div className={`text-[10px] ${isToday ? 'text-yellow-300' : 'opacity-70'}`}>{weekDayLabels[i]}</div>
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full mx-auto mt-0.5 ${isToday ? 'bg-red-500 text-white' : ''}`}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex-1 overflow-y-auto">
                {hours.map(h => (
                  <div key={h} className="grid grid-cols-8 border-b border-hp-50 min-h-[48px]">
                    <div className="text-[10px] text-slate-400 font-medium p-1 text-right pr-2 border-r border-hp-100 leading-none pt-1 sticky left-0 bg-white">{h}:00</div>
                    {weekDays.map((d, di) => {
                      const dayEvents = events.filter(e => e.month === d.getMonth() && d.getDate() >= e.startDay && d.getDate() <= e.endDay && !e.isAllDay && e.startTime && parseInt(e.startTime.split(':')[0]) === h);
                      return (
                        <div key={di} onClick={() => { setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1)); setSelectedDate(d.getDate()); }} className={`border-r border-hp-50 p-0.5 cursor-pointer hover:bg-hp-50 transition-colors relative ${di === 0 ? 'bg-red-50/20' : ''}`}>
                          {dayEvents.map(evt => (
                            <div key={evt.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }} className={`${evt.color} text-white text-[10px] font-bold rounded px-1 py-0.5 truncate cursor-pointer hover:brightness-110`}>{evt.startTime} {evt.title}</div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Todo / Event sidebar */}
      <Draggable nodeRef={draggableRef} handle=".drag-handle">
        <div ref={draggableRef} className="w-full lg:w-80 bg-white rounded-2xl border border-hp-100 p-5 flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden shadow-2xl z-20">
          <div className="flex justify-between items-center mb-5 drag-handle cursor-move bg-hp-50 -m-5 p-5 border-b border-hp-100">
            <div className="flex items-center gap-2">
              <ListIcon size={18} className="text-slate-400" />
              <h3 className="text-lg font-bold text-slate-800">{currentMonth + 1}월 {selectedDate}일</h3>
            </div>
            <span className="text-[10px] text-hp-600 font-bold border border-hp-200 rounded px-2 py-1 bg-hp-50">Focus Mode</span>
          </div>
          <div className="mt-5 flex-1 flex flex-col overflow-hidden">
            {events.filter(e => e.month === currentMonth && selectedDate >= e.startDay && selectedDate <= e.endDay).map(evt => (
              <div key={evt.id} onClick={() => setSelectedEvent(evt)} className="mb-3 bg-white border border-hp-100 rounded-xl p-3.5 shadow-sm flex gap-3 group relative overflow-hidden cursor-pointer hover:border-hp-300 transition-colors">
                <div className={`w-1.5 ${evt.color} rounded-full`}></div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">{evt.isAllDay ? '종일' : `${evt.startTime} ~ ${evt.endTime}`}</p>
                  <p className="font-bold text-sm">{evt.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{evt.startDay === evt.endDay ? `${evt.startDay}일` : `${evt.startDay}일 ~ ${evt.endDay}일`}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteEvent(evt.id); }} className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 opacity-0 group-hover:opacity-100 rounded-lg transition-all"><Trash2 size={16} /></button>
              </div>
            ))}
            <div className="flex-1 overflow-y-auto flex flex-col mt-2">
              <p className="text-xs font-bold text-slate-500 mb-3">나의 실행 목표 (To-Do)</p>
              <div className="space-y-2 mb-4 flex-1">
                {(!todos[selectedDate] || todos[selectedDate].length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <Zap size={32} className="mb-3" /><p className="text-sm font-medium">비어있습니다.</p>
                  </div>
                ) : todos[selectedDate].map(todo => (
                  <div key={todo.id} className={`flex items-start gap-3 bg-white p-3.5 rounded-xl border border-hp-100 shadow-sm group ${todo.done ? 'opacity-50' : ''}`}>
                    <button onClick={() => toggleTodo(selectedDate, todo.id)} className="mt-0.5">{todo.done ? <CheckCircle2 size={20} className="text-slate-500" /> : <Circle size={20} className="text-slate-300" />}</button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${todo.done ? 'line-through text-slate-500' : 'font-bold'}`}>{todo.text}</p>
                    </div>
                    <button onClick={() => deleteTodo(selectedDate, todo.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <div className="mt-auto bg-hp-50 rounded-xl border-2 border-hp-200 flex items-center px-3 focus-within:border-hp-600 shadow-sm">
                <Plus size={20} className="text-slate-400" />
                <input ref={inputRef} type="text" value={newTodoText} onChange={e => setNewTodoText(e.target.value)} onKeyDown={handleAddTodo} placeholder="새 목표 입력..." className="w-full py-4 px-2 text-sm outline-none font-bold placeholder:font-normal bg-transparent" />
              </div>
            </div>
          </div>
        </div>
      </Draggable>

      {/* Add Event Modal */}
      {addEventModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center p-5 border-b border-hp-100">
              <h3 className="font-bold text-lg text-slate-800">새 일정</h3>
              <button onClick={() => setAddEventModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <input type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="일정 제목" className="w-full border-b-2 border-hp-200 focus:border-hp-600 p-2 outline-none text-lg font-bold placeholder:font-normal placeholder:text-slate-300 transition-colors" />
              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-bold text-slate-600">종일</span>
                <button onClick={() => setEventIsAllDay(!eventIsAllDay)} className={`w-12 h-6 rounded-full transition-colors relative ${eventIsAllDay ? 'bg-hp-600' : 'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${eventIsAllDay ? 'translate-x-6' : 'translate-x-0.5'}`}></span>
                </button>
              </div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="block text-xs font-bold text-slate-400 mb-1">시작일</label><input type="date" value={eventStartDate} onChange={e => { setEventStartDate(e.target.value); if (!eventEndDate) setEventEndDate(e.target.value); }} className="w-full border border-hp-100 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-hp-500 text-sm" /></div>
                <div className="flex-1"><label className="block text-xs font-bold text-slate-400 mb-1">종료일</label><input type="date" value={eventEndDate} min={eventStartDate} onChange={e => setEventEndDate(e.target.value)} className="w-full border border-hp-100 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-hp-500 text-sm" /></div>
              </div>
              {!eventIsAllDay && (
                <div className="flex gap-3">
                  <div className="flex-1"><label className="block text-xs font-bold text-slate-400 mb-1">시작 시간</label><input type="time" value={eventStartTime} onChange={e => setEventStartTime(e.target.value)} className="w-full border border-hp-100 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-hp-500 text-sm" /></div>
                  <div className="flex-1"><label className="block text-xs font-bold text-slate-400 mb-1">종료 시간</label><input type="time" value={eventEndTime} onChange={e => setEventEndTime(e.target.value)} className="w-full border border-hp-100 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-hp-500 text-sm" /></div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">색상</label>
                <div className="flex gap-2">
                  {[['bg-hp-500', '#6ab8f5'], ['bg-blue-600', '#2563eb'], ['bg-emerald-500', '#10b981'], ['bg-violet-500', '#8b5cf6'], ['bg-orange-500', '#f97316'], ['bg-red-500', '#ef4444'], ['bg-pink-500', '#ec4899'], ['bg-slate-500', '#64748b']].map(([cls, hex]) => (
                    <button key={cls} onClick={() => setEventColor(cls)} style={{ backgroundColor: hex }} className={`w-7 h-7 rounded-full transition-all ${eventColor === cls ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}></button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-hp-50 flex gap-2">
              <button onClick={() => setAddEventModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-hp-50 text-hp-700 border border-hp-200 hover:bg-hp-100 font-bold">취소</button>
              <button onClick={() => {
                if (!eventTitle || !eventStartDate || !eventEndDate) return;
                const [sy, sm, sd] = eventStartDate.split('-').map(Number);
                const [, , ed] = eventEndDate.split('-').map(Number);
                setEvents([...events, { id: Date.now(), title: eventTitle, month: sm - 1, startDay: sd, endDay: ed, color: eventColor, isAllDay: eventIsAllDay, startTime: eventIsAllDay ? undefined : eventStartTime, endTime: eventIsAllDay ? undefined : eventEndTime }]);
                setCurrentDate(new Date(sy, sm - 1, 1));
                setAddEventModalOpen(false); setEventTitle(''); setEventStartDate(''); setEventEndDate('');
              }} className="flex-1 px-4 py-2.5 rounded-xl bg-hp-600 text-white font-bold hover:bg-hp-700">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className={`${selectedEvent.color} p-5`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/70 text-xs font-bold mb-1">{selectedEvent.isAllDay ? '종일 일정' : `${selectedEvent.startTime} ~ ${selectedEvent.endTime}`}</p>
                  <h3 className="text-white font-bold text-xl leading-tight">{selectedEvent.title}</h3>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"><X size={18} className="text-white" /></button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CalendarIcon size={16} className="text-hp-500" />
                <span className="font-medium">{currentYear}년 {selectedEvent.month + 1}월 {selectedEvent.startDay === selectedEvent.endDay ? `${selectedEvent.startDay}일` : `${selectedEvent.startDay}일 ~ ${selectedEvent.endDay}일`}</span>
              </div>
              {!selectedEvent.isAllDay && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Clock size={16} className="text-hp-500" />
                  <span className="font-medium">{selectedEvent.startTime} ~ {selectedEvent.endTime}</span>
                </div>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => { deleteEvent(selectedEvent.id); setSelectedEvent(null); }} className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-1"><Trash2 size={15} /> 삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
