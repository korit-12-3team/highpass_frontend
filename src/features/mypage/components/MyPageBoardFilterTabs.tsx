import React from "react";

type MyPageBoardFilter = "all" | "study" | "free";

const FILTER_ITEMS: { id: MyPageBoardFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "study", label: "스터디" },
  { id: "free", label: "자유게시판" },
];

export function MyPageBoardFilterTabs({
  value,
  counts,
  onChange,
}: {
  value: MyPageBoardFilter;
  counts: Record<MyPageBoardFilter, number>;
  onChange: (next: MyPageBoardFilter) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {FILTER_ITEMS.map((item) => {
        const active = item.id === value;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              active ? "bg-slate-900 text-white" : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {item.label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15 text-white" : "bg-white text-slate-500"}`}>
              {counts[item.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
