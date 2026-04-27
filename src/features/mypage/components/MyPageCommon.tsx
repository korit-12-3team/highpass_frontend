import React from "react";

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="mb-6">
        <h3 className="text-xl font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-hp-600 shadow-sm">
        {icon}
      </div>
      <p className="mt-4 text-base font-bold text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function InfoField({
  label,
  value,
  icon,
  children,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-3 flex items-center gap-2">
        {icon ? <span className="text-hp-600">{icon}</span> : null}
        {children ?? <p className="text-base font-bold text-slate-900">{value}</p>}
      </div>
    </div>
  );
}
