"use client";

import React from "react";
import { Zap } from "lucide-react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-hp-900 via-hp-800 to-hp-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8">
        <h1 className="text-3xl font-black text-hp-900 text-center mb-2">
          <Zap size={32} className="inline text-hp-600 fill-hp-600 mb-1" /> HighPass
        </h1>
        <p className="text-center text-slate-500 text-sm mb-6">{subtitle}</p>
        <h2 className="sr-only">{title}</h2>
        {children}
      </div>
    </div>
  );
}
