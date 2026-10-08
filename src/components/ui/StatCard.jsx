import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // { value: '+12%', isPositive: true }
  variant = 'teal', // teal, blue, amber, rose, violet, emerald, slate
  onClick,
  className = '',
}) {
  const variantStyles = {
    teal: {
      iconBg: 'bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/80 shadow-xs shadow-teal-500/10',
      accent: 'hover:border-teal-500/50 hover:shadow-teal-500/10',
      glow: 'from-teal-500/10 via-transparent to-transparent',
      topLine: 'bg-teal-500',
    },
    blue: {
      iconBg: 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/80 shadow-xs shadow-blue-500/10',
      accent: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
      glow: 'from-blue-500/10 via-transparent to-transparent',
      topLine: 'bg-blue-500',
    },
    amber: {
      iconBg: 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/80 shadow-xs shadow-amber-500/10',
      accent: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      glow: 'from-amber-500/10 via-transparent to-transparent',
      topLine: 'bg-amber-500',
    },
    rose: {
      iconBg: 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/80 shadow-xs shadow-rose-500/10',
      accent: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
      glow: 'from-rose-500/10 via-transparent to-transparent',
      topLine: 'bg-rose-500',
    },
    violet: {
      iconBg: 'bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/80 shadow-xs shadow-violet-500/10',
      accent: 'hover:border-violet-500/50 hover:shadow-violet-500/10',
      glow: 'from-violet-500/10 via-transparent to-transparent',
      topLine: 'bg-violet-500',
    },
    emerald: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/80 shadow-xs shadow-emerald-500/10',
      accent: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      glow: 'from-emerald-500/10 via-transparent to-transparent',
      topLine: 'bg-emerald-500',
    },
    slate: {
      iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      accent: 'hover:border-slate-400',
      glow: 'from-slate-500/10 via-transparent to-transparent',
      topLine: 'bg-slate-400',
    },
  };

  const style = variantStyles[variant] || variantStyles.teal;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ' + style.accent : ''
      } ${className}`}
    >
      {/* Radiant Glow in Background */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${style.glow} rounded-bl-full pointer-events-none opacity-60 dark:opacity-40 transition-opacity group-hover:opacity-100`} />

      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${style.iconBg} transition-transform group-hover:scale-110 duration-200`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="relative mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
          {value}
        </span>
        {trend && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
              trend.isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="relative mt-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
