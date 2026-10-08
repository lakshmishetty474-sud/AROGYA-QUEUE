import React from 'react';

export function ProgressBar({
  value = 0,
  max = 100,
  label,
  valueLabel,
  color = 'teal', // teal, blue, amber, rose, emerald
  size = 'md', // sm, md, lg
  showPercentage = false,
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorStyles = {
    teal: 'bg-teal-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    emerald: 'bg-emerald-500',
  };

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || valueLabel || showPercentage) && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label && <span>{label}</span>}
          <span>{valueLabel || (showPercentage ? `${percentage}%` : `${value}/${max}`)}</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${heightStyles[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorStyles[color] || colorStyles.teal}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
