import React from 'react';

export function Card({
  children,
  className = '',
  title,
  subtitle,
  headerAction,
  footer,
  noPadding = false,
  onClick,
  hoverable = false,
  glass = false,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl transition-all duration-200 overflow-hidden ${
        glass
          ? 'glass-card'
          : 'bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
      } ${
        hoverable ? 'hover:shadow-lg hover:-translate-y-0.5 hover:border-teal-500/40 dark:hover:border-teal-500/40 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100/90 dark:border-slate-800/80">
          <div>
            {title && <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
}
