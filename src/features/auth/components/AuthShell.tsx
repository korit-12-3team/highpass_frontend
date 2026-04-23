import React from "react";
import Image from "next/image";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f7fbff_0%,#d8eefb_42%,#7bb8dd_100%)] p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl shadow-[#0d3d62]/20">
        <div className="bg-[linear-gradient(135deg,#ffffff_0%,#eef8ff_58%,#d5ecfa_100%)] px-8 pb-6 pt-8">
          <h1 className="text-center text-3xl font-black text-[#123b5c]">
            <span className="inline-flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#b9dff5]">
                <Image src="/images/Highpass_icon.png" alt="HighPass" width={46} height={46} className="h-[46px] w-[46px] object-contain" priority />
              </span>
              <span>HighPass</span>
            </span>
          </h1>
          <p className="mt-3 text-center text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
        <div className="p-8 pt-6">
        <h2 className="sr-only">{title}</h2>
        {children}
        </div>
      </div>
    </div>
  );
}
