import React from 'react';

export function Skeleton({ className = '', variant = 'rectangular' }) {
  const variantStyles = {
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    text: 'rounded h-4',
  };

  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800 ${variantStyles[variant]} ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 py-3.5 px-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton
              key={cIdx}
              className={`h-4 ${cIdx === 0 ? 'w-1/4' : 'flex-1'}`}
              variant="text"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="w-24 h-4" variant="text" />
        <Skeleton className="w-8 h-8" variant="circular" />
      </div>
      <Skeleton className="w-32 h-8" variant="rectangular" />
      <Skeleton className="w-48 h-3" variant="text" />
    </div>
  );
}
