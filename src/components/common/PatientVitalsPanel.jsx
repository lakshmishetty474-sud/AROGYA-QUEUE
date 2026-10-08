import React from 'react';
import { HeartPulse, Activity, Droplet, Wind, Sparkles } from 'lucide-react';

/**
 * PatientVitalsPanel
 * ---------------------------------------------------------------------------
 * Animated vitals illustration for the patient dashboard.
 *
 * IMPORTANT - HONESTY NOTE: this renders ILLUSTRATIVE sample readings, not the
 * patient's real vitals. A hospital UI that shows invented numbers beside a
 * patient's name is dangerous, so the panel is explicitly badged "Demo data"
 * and no value is presented as a clinical measurement. Wire this to a real
 * vitals feed before using it for anything clinical.
 *
 * Everything animates with CSS/SVG only. There are no <video> elements, no
 * external image hosts and no network requests, so it cannot fail offline and
 * cannot leave a broken media placeholder in the layout.
 */

/* The EKG trace. `aq-ecg-draw` animates stroke-dashoffset over this path so the
   line appears to sweep left-to-right, repeating on a loop. */
const ECG_PATH =
  'M0 40 L30 40 L38 40 L44 12 L52 68 L60 30 L68 40 L96 40 L104 40 L110 20 L118 56 L126 40 L200 40';

const READINGS = [
  { id: 'hr', icon: HeartPulse, label: 'Heart Rate', value: '72', unit: 'bpm', tone: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500/20' },
  { id: 'spo2', icon: Wind, label: 'Oxygen Sat.', value: '98', unit: '%', tone: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500/20' },
  { id: 'bp', icon: Activity, label: 'Blood Pressure', value: '120/80', unit: 'mmHg', tone: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-500/20' },
  { id: 'temp', icon: Droplet, label: 'Temperature', value: '98.4', unit: '°F', tone: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
];

export function PatientVitalsPanel({ className = '' }) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl card p-5 sm:p-6 ${className}`}
      aria-label="Illustrative vitals monitor"
    >
      {/* Ambient animated orbs */}
      <div aria-hidden="true" className="absolute -top-16 -right-10 w-52 h-52 rounded-full bg-teal-500/15 blur-3xl aq-orb-a" />
      <div aria-hidden="true" className="absolute -bottom-20 -left-12 w-48 h-48 rounded-full bg-sky-500/12 blur-3xl aq-orb-b" />

      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-teal-500" />
            Vitals Monitor
          </p>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Live Physiological Overview
          </h3>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Demo data
        </span>
      </div>

      {/* Animated EKG trace */}
      <div className="relative rounded-2xl bg-slate-50 dark:bg-[#0a0f1c] border border-slate-200 dark:border-white/10 overflow-hidden mb-4">
        <svg
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
          className="w-full h-24"
          role="img"
          aria-label="Stylised animated electrocardiogram trace"
        >
          {/* grid */}
          <defs>
            <pattern id="aq-ecg-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M10 0 L0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-slate-300 dark:text-white/10" />
            </pattern>
            <linearGradient id="aq-ecg-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
          </defs>
          <rect width="200" height="80" fill="url(#aq-ecg-grid)" />
          <path
            d={ECG_PATH}
            fill="none"
            stroke="url(#aq-ecg-stroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="aq-ecg-draw"
          />
        </svg>
        <span className="absolute top-2 right-3 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 aq-blink" />
          streaming
        </span>
      </div>

      {/* Reading tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {READINGS.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.id}
              className={`rounded-2xl p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 ring-1 ${r.ring} aq-breathe`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className={`w-3.5 h-3.5 ${r.tone}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {r.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-extrabold font-mono ${r.tone}`}>{r.value}</span>
                <span className="text-[10px] font-semibold text-slate-400">{r.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="relative mt-3 text-[10px] text-slate-400 flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" />
        Sample readings for demonstration only. Real vitals are recorded by your care team.
      </p>
    </section>
  );
}

export default PatientVitalsPanel;
