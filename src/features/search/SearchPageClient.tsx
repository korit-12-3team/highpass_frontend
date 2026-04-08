"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { allItems } from "@/lib/data";
import { useApp } from "@/lib/AppContext";
import { createCalendarEvent } from "@/lib/calendar";
import { CERT_DATA } from "@/lib/constants";

type SearchItem = {
  id: string | number;
  category: string;
  name: string;
  startDate?: string;
  endDate?: string;
  target?: string;
};

export default function SearchPageClient() {
  const { currentUser, setEvents } = useApp();
  const router = useRouter();

  const [certModalOpen, setCertModalOpen] = useState<SearchItem | null>(null);
  const [certModalCertCat, setCertModalCertCat] = useState("");
  const [certModalCert, setCertModalCert] = useState("");
  const [certDate, setCertDate] = useState("");
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarError, setCalendarError] = useState("");

  useEffect(() => {
    if (!certModalOpen?.startDate) return;
    setCertDate(certModalOpen.startDate);
  }, [certModalOpen]);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-hp-100 p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">Q-Net Exam Schedule</h2>
        <div className="space-y-4">
          {allItems.length === 0 && (
            <div className="border border-dashed border-hp-200 rounded-xl p-8 text-center text-slate-500">
              No schedule data is available yet.
            </div>
          )}
          {allItems.map((rawItem) => {
            const item = rawItem as SearchItem;
            return (
              <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md">
                <div className="bg-hp-50 border-b border-hp-100 px-5 py-4 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold bg-hp-100 text-hp-700 px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-lg mt-2">{item.name}</h3>
                  </div>
                  {item.category === "시험일정" && (
                    <button
                      onClick={() => {
                        setCalendarError("");
                        setCertModalOpen(item);
                      }}
                      className="bg-hp-600 text-white hover:bg-hp-700 py-2 px-5 rounded-lg flex items-center gap-2 font-bold"
                    >
                      <CalendarIcon size={16} /> Add To Calendar
                    </button>
                  )}
                </div>
                <div className="p-5 grid grid-cols-2 text-sm gap-4">
                  {item.category === "시험일정" && (
                    <div>
                      <p className="text-xs text-slate-500">Schedule</p>
                      <p className="font-bold">
                        {item.startDate} ~ {item.endDate}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500">Target</p>
                    <p className="font-bold">{item.target}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {certModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col justify-center">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="font-bold flex flex-col">
                <span className="text-xs text-slate-400 font-normal">[{certModalOpen.name}]</span>
                Add To Calendar
              </h3>
              <button
                onClick={() => {
                  setCertModalOpen(null);
                  setCertModalCertCat("");
                  setCertModalCert("");
                  setCalendarError("");
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {calendarError && <p className="text-sm text-red-500">{calendarError}</p>}

              <label className="font-bold text-sm text-hp-700 block">Certificate</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={certModalCertCat}
                  onChange={(e) => {
                    setCertModalCertCat(e.target.value);
                    setCertModalCert("");
                  }}
                  className="border rounded-lg p-2 text-sm outline-none focus:border-hp-500 appearance-none"
                >
                  <option value="">Category</option>
                  {Object.keys(CERT_DATA).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select
                  value={certModalCert}
                  onChange={(e) => setCertModalCert(e.target.value)}
                  disabled={!certModalCertCat}
                  className="border rounded-lg p-2 text-sm outline-none focus:border-hp-500 appearance-none disabled:opacity-40"
                >
                  <option value="">Certificate</option>
                  {(CERT_DATA[certModalCertCat] || []).map((certificate) => (
                    <option key={certificate} value={certificate}>
                      {certificate}
                    </option>
                  ))}
                </select>
              </div>

              <label className="font-bold text-sm text-hp-700 block">Exam Date</label>
              <p className="text-xs text-slate-400">
                Schedule Range: {certModalOpen.startDate} ~ {certModalOpen.endDate}
              </p>
              <input
                type="date"
                value={certDate}
                min={certModalOpen.startDate}
                max={certModalOpen.endDate}
                onChange={(e) => setCertDate(e.target.value)}
                className="border rounded-lg p-2 w-full text-sm outline-none focus:border-hp-500"
              />

              <button
                disabled={calendarSaving}
                className="w-full mt-4 bg-hp-600 text-white font-bold p-3 rounded-lg disabled:opacity-60"
                onClick={async () => {
                  if (!currentUser || !certDate || calendarSaving) return;

                  const title = certModalCert || certModalOpen.name;

                  try {
                    setCalendarSaving(true);
                    setCalendarError("");
                    const createdEvent = await createCalendarEvent({
                      userId: currentUser.id,
                      title,
                      startDate: certDate,
                      endDate: certDate,
                      color: "bg-emerald-500",
                      isAllDay: true,
                    });
                    setEvents((prev) => [...prev, createdEvent]);
                    setCertModalOpen(null);
                    setCertModalCertCat("");
                    setCertModalCert("");
                    router.push("/calendar");
                  } catch (error) {
                    setCalendarError(error instanceof Error ? error.message : "일정을 저장하지 못했습니다.");
                  } finally {
                    setCalendarSaving(false);
                  }
                }}
              >
                {calendarSaving ? "Saving..." : "Confirm And Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
