import React from "react";
import Image from "next/image";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[linear-gradient(135deg,#f7fbff_0%,#d8eefb_42%,#7bb8dd_100%)] bg-fixed px-3 py-8 sm:p-6">
      <div className="my-auto w-full max-w-md shrink-0 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl shadow-[#0d3d62]/20">
        <div className="bg-[linear-gradient(135deg,#ffffff_0%,#eef8ff_58%,#d5ecfa_100%)] px-5 pb-2 pt-5 sm:px-8 sm:pt-6">
          <h1 className="text-center text-2xl font-black text-[#123b5c] sm:text-4xl">
            <span className="inline-flex items-center gap-2 sm:gap-3">
              <span className="flex h-9 w-9 items-center justify-center sm:h-12 sm:w-12">
                <Image
                  src="/images/Highpass_icon.png"
                  alt="HighPass"
                  width={55}
                  height={55}
                  className="h-[38px] w-[38px] object-contain sm:h-[55px] sm:w-[55px]"
                  priority
                />
              </span>
              <span>HIGHPASS</span>
            </span>
          </h1>
          {subtitle ? (
            <p className="mt-2 text-center text-xs font-semibold text-slate-500 sm:text-sm">{subtitle}</p>
          ) : null}
        </div>
        <div className="px-5 py-5 sm:p-8 sm:pt-5">
          <h2 className="sr-only">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
