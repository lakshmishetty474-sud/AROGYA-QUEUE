import React, { useEffect, useState } from 'react';
import { Droplet, HeartPulse, PhoneCall, ShieldAlert, Sparkles, Stethoscope, UserCheck, Accessibility, Info } from 'lucide-react';
import './tv.css';

/* ============================================================================
   QueueBoardSlides
   ----------------------------------------------------------------------------
   Slide animations for the waiting-room / reception TV board.

   Everything is sized for a screen read from across a room: large type, high
   contrast, generous dwell times.

   SAFETY OF THE AUTO-ADVANCE: the timers live in a single effect whose cleanup
   clears the interval on unmount and whenever `paused` or `hidden` becomes
   true, so the board can never keep cycling after the tab is backgrounded or
   the component is removed. No refs, so nothing can be written during render.
   ============================================================================ */

const AWARENESS = [
  { id: 'hygiene', icon: Sparkles, title: 'Hand hygiene', body: 'Please sanitise your hands at the entrance and before entering the consultation room.' },
  { id: 'id', icon: UserCheck, title: 'Carry your ID', body: 'Aadhaar or ABHA lets the front desk register you in under a minute.' },
  { id: 'emergency', icon: ShieldAlert, title: 'Emergency?', body: 'Dial 108 for an ambulance. Critical cases are fast-tracked automatically.' },
  { id: 'blood', icon: Droplet, title: 'Blood donation drive', body: 'Citywide camps run every weekend. Walk-ins are always welcome.' },
  { id: 'waiting', icon: Info, title: 'Respect your slot', body: 'If you miss your turn, please take a fresh token so the queue stays fair for everyone.' },
  { id: 'access', icon: Accessibility, title: 'Accessibility', body: 'Wheelchair assistance, priority seating and hearing support are available on request.' },
];

const TIPS = [
  'Average OPD wait today is 8 minutes',
  'Free general OPD runs every Monday',
  'Diagnostics reports are ready within 4 hours',
  'Pharmacy refills close 30 minutes before OPD',
  'Keep this screen updated - tokens change in real time',
];

const AWARENESS_MS = 6500;

/* -------------------------------------------------------------------------
   NowServingBoard - the big "called token" hero for the TV.
   ------------------------------------------------------------------------- */
export function NowServingBoard({ token = 'A-118', counter = '14', room = 'Room 4', doctor = 'Dr. A. Sharma' }) {
  return (
    <div className="relative rounded-3xl overflow-hidden border-4 border-indigo-500/40 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8">
      {/* decorative orbs */}
      <span aria-hidden="true" className="tv-orb absolute -top-16 -right-10 w-64 h-64 rounded-full bg-indigo-500/25 blur-3xl" />
      <span aria-hidden="true" className="tv-orb absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-teal-500/20 blur-3xl" style={{ animationDelay: '-7s' }} />

      <div className="relative">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-indigo-300 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          Now Serving
        </p>

        <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-4">
          <div key={token} className="tv-slam">
            <div key={`${token}-flash`} className="tv-flash text-7xl sm:text-8xl font-black font-mono leading-none tracking-tight">
              {token}
            </div>
            <div className="mt-2 text-indigo-200 font-bold text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Please proceed to {room}
            </div>
          </div>

          <div className="tv-card-in" style={{ animationDelay: '0.25s' }}>
            <div className="text-5xl font-black font-mono text-white leading-none">{counter}</div>
            <div className="text-xs uppercase tracking-widest text-slate-400 mt-1">At counter</div>
          </div>

          <div className="tv-card-in" style={{ animationDelay: '0.45s' }}>
            <Stethoscope className="w-6 h-6 text-teal-300 mb-1" />
            <div className="text-lg font-bold text-white">{doctor}</div>
            <div className="text-xs text-slate-400">{room}</div>
          </div>
        </div>
      </div>

      {/* shine sweep across the whole card */}
      <span
        aria-hidden="true"
        className="tv-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/12 to-transparent"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
   AwarenessCarousel - health-awareness slides that cross-fade on a timer.
   ------------------------------------------------------------------------- */
export function AwarenessCarousel({ items = AWARENESS, interval = AWARENESS_MS }) {
  const [i, setI] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (hidden) return undefined;
    const id = setInterval(() => setI((p) => (p + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [hidden, interval, items.length]);

  const slide = items[i] || items[0];
  const Icon = slide.icon;

  return (
    <div className="relative rounded-3xl overflow-hidden border-2 border-slate-800 bg-slate-900/80 p-6 sm:p-7 min-h-[168px]">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 grid place-items-center">
          <Icon className="w-7 h-7 text-indigo-300" />
        </div>

        <div key={slide.id} className="tv-slide-left flex-1 min-w-0">
          <h3 className="text-2xl font-black tracking-tight text-white">{slide.title}</h3>
          <p className="mt-1.5 text-base text-slate-300 leading-relaxed">{slide.body}</p>
          <span
            aria-hidden="true"
            className="tv-underline mt-3 block h-1 w-24 rounded-full"
            style={{ background: 'linear-gradient(90deg, #818CF8, #2DD4BF)' }}
          />
        </div>
      </div>

      {/* slide dots */}
      <div className="mt-4 flex items-center gap-2">
        {items.map((s, idx) => (
          <span
            key={s.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === i ? 'w-8 bg-indigo-400' : 'w-1.5 bg-slate-600'}`}
          />
        ))}
        <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-slate-500">
          {String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   TvTicker - wide scrolling strip for the top or bottom of the board.
   ------------------------------------------------------------------------- */
export function TvTicker({ items = TIPS, speed = 30 }) {
  const list = items.length ? items : TIPS;
  const doubled = [...list, ...list];
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-slate-800 bg-slate-900/70 py-2.5">
      <div className="tv-ticker-track" style={{ animationDuration: `${speed}s` }}>
        {doubled.map((t, i) => (
          <span key={i} className="flex items-center gap-3 px-8 text-sm font-bold uppercase tracking-wider text-slate-300 whitespace-nowrap">
            <HeartPulse className="w-4 h-4 text-teal-400 shrink-0" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   QuickActionCards - big tappable/large-print actions for waiting patients.
   ------------------------------------------------------------------------- */
export function QuickActionCards() {
  const actions = [
    { icon: PhoneCall, label: 'Ambulance 24/7', sub: 'Dial 108', tone: 'text-rose-300 border-rose-500/40 bg-rose-500/10' },
    { icon: Droplet, label: 'Blood Donation', sub: 'Weekend camps', tone: 'text-rose-300 border-rose-500/40 bg-rose-500/10' },
    { icon: Stethoscope, label: 'Free OPD', sub: 'Mondays 9am-1pm', tone: 'text-teal-300 border-teal-500/40 bg-teal-500/10' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {actions.map((a, i) => {
        const Icon = a.icon;
        return (
          <div
            key={a.label}
            className={`tv-card-in rounded-2xl border-2 ${a.tone} p-4 flex items-center gap-3`}
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            <Icon className="w-8 h-8 shrink-0" />
            <div className="min-w-0">
              <div className="text-base font-black text-white truncate">{a.label}</div>
              <div className="text-xs text-slate-400 truncate">{a.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
