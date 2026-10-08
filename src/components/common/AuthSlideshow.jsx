import React, { useCallback, useEffect, useState } from 'react';
import {
  Clock,
  Building2,
  Droplets,
  Ambulance,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/**
 * AuthSlideshow
 * ---------------------------------------------------------------------------
 * A self-contained, Instagram "story" style carousel for the login page.
 *
 * Safety notes (this project must not crash):
 *  - Fully self-contained: owns its own interval, no shared/global state.
 *  - The interval is cleared on unmount, on manual navigation, and whenever
 *    the tab is hidden, so it can never keep firing after the user navigates
 *    away or causes a "setState on unmounted component" warning.
 *  - `isActive` is tracked with a ref so the timer callback never reads a
 *    stale closure over the current index.
 *  - Every icon used here was verified to exist in the installed lucide-react.
 *  - Respects prefers-reduced-motion (handled globally in index.css).
 */

const SLIDES = [
  {
    id: 'opd',
    icon: Clock,
    accent: 'from-amber-400 to-orange-500',
    ring: 'shadow-amber-500/25',
    eyebrow: 'Outpatient Flow',
    title: 'Smart OPD Queue',
    body: 'Automated token generation with transparent waiting timestamps, so every patient knows exactly how long is left.',
    metric: '8m',
    metricLabel: 'average wait',
  },
  {
    id: 'beds',
    icon: Building2,
    accent: 'from-sky-400 to-blue-600',
    ring: 'shadow-blue-500/25',
    eyebrow: 'Inpatient Capacity',
    title: 'Bed Matrix & Matching',
    body: 'Recommendations are matched against real-time ICU and ward availability and patient acuity, not first-come-first-served.',
    metric: '340+',
    metricLabel: 'live beds tracked',
  },
  {
    id: 'blood',
    icon: Droplets,
    accent: 'from-rose-400 to-red-600',
    ring: 'shadow-rose-500/25',
    eyebrow: 'Transfusion Network',
    title: 'Citywide Blood Bank',
    body: 'Inventory, donor registry and emergency SOS matching across every partner hospital in the regional grid.',
    metric: '8',
    metricLabel: 'blood groups',
  },
  {
    id: 'ambulance',
    icon: Ambulance,
    accent: 'from-teal-400 to-emerald-600',
    ring: 'shadow-teal-500/25',
    eyebrow: 'Emergency Response',
    title: 'Ambulance Fleet Tracking',
    body: 'Dispatch, live vehicle position and crew dispatch readiness coordinated with the same hospital grid.',
    metric: '24/7',
    metricLabel: 'fleet coverage',
  },
  {
    id: 'grid',
    icon: MapPin,
    accent: 'from-violet-400 to-indigo-600',
    ring: 'shadow-violet-500/25',
    eyebrow: 'Regional Scale',
    title: 'City Health Care Grid',
    body: 'One operating layer synchronising triage, pharmacy supply, bed capacity and emergency fleets in real time.',
    metric: '5',
    metricLabel: 'city hospitals',
  },
];

const DURATION = 6500;

export function AuthSlideshow({ className = '' }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  // Bumping `tick` restarts the dwell timer after a manual navigation so the
  // newly selected slide is actually given its full reading time.
  const [tick, setTick] = useState(0);

  const advance = useCallback((step) => {
    setIndex((prev) => (prev + step + SLIDES.length) % SLIDES.length);
  }, []);

  const goTo = useCallback((next) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  // Track whether the tab is backgrounded, so we never burn a slide unseen.
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Auto-advance. React guarantees the previous interval is cleared whenever
  // these dependencies change and again on unmount, so it can never leak or
  // fire against an unmounted component.
  useEffect(() => {
    if (paused || hidden) return undefined;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, DURATION);
    return () => clearInterval(id);
  }, [paused, hidden, tick]);

  // Manual navigation restarts the dwell timer so the slide is actually read.
  const handleManual = useCallback((fn) => {
    fn();
    setTick((t) => t + 1);
  }, []);

  const slide = SLIDES[index];
  const Icon = slide.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/60 dark:border-white/10 glass-card ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Decorative wash behind the active slide */}
      <div
        key={`${slide.id}-wash`}
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-br ${slide.accent} opacity-[0.07] transition-opacity duration-700 aq-slide-fade`}
      />
      <div aria-hidden="true" className="absolute inset-0 aq-doodle opacity-60" />

      <div className="relative p-5 sm:p-6">
        {/* Story-style progress bars */}
        <div className="flex items-center gap-1.5 mb-5" role="presentation">
          {SLIDES.map((s, i) => (
            <span key={s.id} className="flex-1 h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <span
                className={`block h-full rounded-full aq-jade-surface ${
                  i < index ? 'w-full' : i === index ? 'aq-progress-live' : 'w-0'
                }`}
              />
            </span>
          ))}
        </div>

        {/* Slide body - key remount drives the fade+rise animation */}
        <div
          key={slide.id}
          className="aq-slide-in"
          aria-live="polite"
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${slide.accent} text-white flex items-center justify-center shadow-lg ${slide.ring}`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 mb-1">
                {slide.eyebrow}
              </p>
              <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                {slide.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {slide.body}
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-white/10">
            <div>
              <div className="text-2xl font-extrabold font-mono text-teal-600 dark:text-teal-400">
                {slide.metric}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                {slide.metricLabel}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleManual(() => advance(-1))}
                aria-label="Previous slide"
                className="aq-press w-8 h-8 rounded-full grid place-items-center bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleManual(() => advance(1))}
                aria-label="Next slide"
                className="aq-press w-8 h-8 rounded-full grid place-items-center bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="relative flex items-center justify-center gap-1.5 pb-4">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleManual(() => goTo(i))}
            aria-label={`Go to slide ${i + 1}: ${s.title}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === index ? 'w-6 bg-teal-500' : 'w-1.5 bg-slate-300 dark:bg-white/20 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default AuthSlideshow;
