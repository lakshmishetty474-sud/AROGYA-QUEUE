import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useHealthcare } from '../../context/AppContext';

export function ToastContainer() {
  const { toasts, removeToast } = useHealthcare();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';
        const isEmergency = toast.type === 'emergency';

        const Icon = isSuccess
          ? CheckCircle2
          : isWarning
          ? AlertTriangle
          : isError || isEmergency
          ? AlertCircle
          : Info;

        const borderClass = isSuccess
          ? 'border-emerald-500/30 bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100'
          : isWarning
          ? 'border-amber-500/30 bg-amber-50/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100'
          : isError || isEmergency
          ? 'border-rose-500/30 bg-rose-50/95 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100'
          : 'border-sky-500/30 bg-sky-50/95 dark:bg-sky-950/90 text-sky-900 dark:text-sky-100';

        const iconColor = isSuccess
          ? 'text-emerald-600 dark:text-emerald-400'
          : isWarning
          ? 'text-amber-600 dark:text-amber-400'
          : isError || isEmergency
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-sky-600 dark:text-sky-400';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-xs transition-all animate-in slide-in-from-bottom-3 duration-200 ${borderClass}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-xs font-medium leading-relaxed">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
