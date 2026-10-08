import React from 'react';
import {
  UserCheck,
  Clock,
  Stethoscope,
  FlaskConical,
  FileSpreadsheet,
  Pill,
  CheckCircle2,
} from 'lucide-react';

const STAGE_CONFIG = [
  { key: 'Registration', label: 'Registration', icon: UserCheck },
  { key: 'Queue', label: 'Queue Triage', icon: Clock },
  { key: 'Doctor Consultation', label: 'Doctor Consultation', icon: Stethoscope },
  { key: 'Lab Investigation', label: 'Lab Investigation', icon: FlaskConical },
  { key: 'Prescription', label: 'Prescription', icon: FileSpreadsheet },
  { key: 'Pharmacy', label: 'Pharmacy', icon: Pill },
  { key: 'Discharge', label: 'Discharge', icon: CheckCircle2 },
];

export function PatientJourneyTimeline({ journey = [], currentStatus = 'Waiting' }) {
  // Map of logged journey stages with times & notes
  const loggedMap = (journey || []).reduce((acc, step) => {
    acc[step.stage] = step;
    return acc;
  }, {});

  return (
    <div className="py-2">
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {STAGE_CONFIG.map((stage, idx) => {
          const logged = loggedMap[stage.key];
          const isCompleted = !!logged;
          const isCurrent =
            currentStatus === stage.key ||
            (currentStatus === 'In Consultation' && stage.key === 'Doctor Consultation') ||
            (currentStatus === 'Lab' && stage.key === 'Lab Investigation');

          const Icon = stage.icon;

          return (
            <div key={stage.key} className="relative flex items-start gap-3.5 group">
              {/* Dot marker */}
              <div
                className={`absolute -left-6 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
                }`}
              >
                <Icon className="w-3 h-3" />
              </div>

              {/* Stage content card */}
              <div
                className={`flex-1 p-3 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                    : isCurrent
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 shadow-2xs'
                    : 'bg-slate-50/50 dark:bg-slate-900/20 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isCompleted
                        ? 'text-slate-900 dark:text-slate-100'
                        : isCurrent
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                  {logged?.time && (
                    <span className="text-[10px] font-mono font-medium text-teal-600 dark:text-teal-400">
                      {logged.time}
                    </span>
                  )}
                </div>

                {logged?.note && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {logged.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
