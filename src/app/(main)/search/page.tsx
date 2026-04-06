"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { allItems } from '@/lib/data';
import { useApp } from '@/lib/AppContext';
import { CERT_DATA } from '@/lib/constants';

export default function SearchPage() {
  const { setEvents, events } = useApp();
  const router = useRouter();

  const [certModalOpen, setCertModalOpen] = useState<any>(null);
  const [certModalCertCat, setCertModalCertCat] = useState('');
  const [certModalCert, setCertModalCert] = useState('');

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-hp-100 p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">Q-Net 국가기술자격 시험일정</h2>
        <div className="space-y-4">
          {allItems.map(item => (
            <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md">
              <div className="bg-hp-50 border-b border-hp-100 px-5 py-4 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold bg-hp-100 text-hp-700 px-2 py-1 rounded-full">{item.category}</span>
                  <h3 className="font-bold text-lg mt-2">{item.name}</h3>
                </div>
                {item.category === '시험일정' && (
                  <button onClick={() => setCertModalOpen(item)} className="bg-hp-600 text-white hover:bg-hp-700 py-2 px-5 rounded-lg flex items-center gap-2 font-bold">
                    <CalendarIcon size={16} /> 캘린더에 담기
                  </button>
                )}
              </div>
              <div className="p-5 grid grid-cols-2 text-sm gap-4">
                {item.category === '시험일정' && <div><p className="text-xs text-slate-500">일정</p><p className="font-bold">{item.startDate} ~ {item.endDate}</p></div>}
                <div><p className="text-xs text-slate-500">대상</p><p className="font-bold">{item.target}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {certModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col align-middle justify-center">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="font-bold flex flex-col">
                <span className="text-xs text-slate-400 font-normal">[{certModalOpen.name}]</span>
                캘린더에 추가하기
              </h3>
              <button onClick={() => { setCertModalOpen(null); setCertModalCertCat(''); setCertModalCert(''); }}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <label className="font-bold text-sm text-hp-700 block">자격증 선택</label>
              <div className="grid grid-cols-2 gap-2">
                <select value={certModalCertCat} onChange={e => { setCertModalCertCat(e.target.value); setCertModalCert(''); }} className="border rounded-lg p-2 text-sm outline-none focus:border-hp-500 appearance-none">
                  <option value="">카테고리</option>
                  {Object.keys(CERT_DATA).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select value={certModalCert} onChange={e => setCertModalCert(e.target.value)} disabled={!certModalCertCat} className="border rounded-lg p-2 text-sm outline-none focus:border-hp-500 appearance-none disabled:opacity-40">
                  <option value="">자격증 선택</option>
                  {(CERT_DATA[certModalCertCat] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label className="font-bold text-sm text-hp-700 block">시험 일자 선택</label>
              <p className="text-xs text-slate-400">시험 기간: {certModalOpen.startDate} ~ {certModalOpen.endDate}</p>
              <input type="date" id="certDate" min={certModalOpen.startDate} max={certModalOpen.endDate} defaultValue={certModalOpen.startDate} className="border rounded-lg p-2 w-full text-sm outline-none focus:border-hp-500" />
              <button className="w-full mt-4 bg-hp-600 text-white font-bold p-3 rounded-lg" onClick={() => {
                const dateStr = (document.getElementById('certDate') as HTMLInputElement).value;
                if (!dateStr) return;
                const [year, month, day] = dateStr.split('-').map(Number);
                const title = certModalCert || certModalOpen.name;
                setEvents([...events, { id: Date.now(), title, month: month - 1, startDay: day, endDay: day, color: 'bg-emerald-500', isAllDay: true }]);
                setCertModalOpen(null); setCertModalCertCat(''); setCertModalCert('');
                router.push('/calendar');
              }}>일정 확정 및 추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
