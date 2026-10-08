import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, HeartPulse } from 'lucide-react';

export function SplashScreen({ onFinish }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      const closeTimer = setTimeout(() => {
        onFinish();
      }, 500);
      return () => clearTimeout(closeTimer);
    }, 1200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center max-w-sm text-center px-6 fade-in zoom-in-95">
        {/* Animated Healthcare Logo */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-xl shadow-teal-500/10">
            <Activity className="w-10 h-10 text-teal-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
            <HeartPulse className="w-4 h-4" />
          </div>
        </div>

        {/* Brand Titles */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-teal-100 to-teal-400 bg-clip-text text-transparent">
          AROGYA QUEUE
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm font-medium text-teal-300 tracking-wide uppercase">
          Hospital OS + City Health Care
        </p>

        {/* Animated Loading Bar */}
        <div className="w-48 h-1 bg-slate-800 rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-teal-400 rounded-full w-full" />
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>Synchronizing Regional Healthcare Grid...</span>
        </div>
      </div>
    </div>
  );
}
