import React from 'react';
import {
  Activity,
  Droplet,
  HeartPulse,
  MapPin,
  Microscope,
  Pill,
  Radio,
  Sparkles,
  Stethoscope,
  Truck,
  Wind,
  Boxes,
  Siren,
} from 'lucide-react';
import './motion.css';

/* ============================================================================
   MotionKit
   ----------------------------------------------------------------------------
   Small, self-contained, theme-aware animation widgets for the Arogya Queue
   dashboards. Everything is CSS/SVG driven: no <video>, no remote images, no
   runtime timers, no refs, no state. That means a widget cannot leak a
   listener, cannot fire against an unmounted tree, and cannot throw at render
   time - which is what keeps this safe to sprinkle across many pages.

   Colour comes from the theme tokens (--primary, --text, --border, ...) so
   every widget renders correctly in light and dark mode.
   ============================================================================ */

/* -------------------------------------------------------------------------
   1. AuroraBackdrop - ambient drifting colour field.
      Use: login, overview / command centre, nurse station.
   ------------------------------------------------------------------------- */
export function AuroraBackdrop({ className = '', variant = 'login' }) {
  const palettes = {
    login: ['bg-teal-500/20', 'bg-sky-500/16', 'bg-violet-500/14'],
    overview: ['bg-teal-500/16', 'bg-sky-500/14', 'bg-violet-500/12'],
    nurse: ['bg-teal-500/14', 'bg-rose-500/12', 'bg-sky-500/14'],
  };
  const [a, b, c] = palettes[variant] || palettes.login;

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className={`absolute -top-24 -left-16 w-[26rem] h-[26rem] rounded-full ${a} blur-3xl mq-drift-a`} />
      <div className={`absolute top-1/3 -right-20 w-[22rem] h-[22rem] rounded-full ${b} blur-3xl mq-drift-b`} />
      <div className={`absolute -bottom-24 left-1/3 w-[24rem] h-[24rem] rounded-full ${c} blur-3xl mq-drift-c`} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   2. Waveform - animated ECG / vitals trace.
      Use: doctor desk, nurse station, patient portal.
   ------------------------------------------------------------------------- */
const WAVE_PATH =
  'M0 34 L26 34 L33 34 L39 8 L46 60 L53 24 L60 34 L84 34 L91 34 L97 16 L104 48 L111 34 L170 34';

export function Waveform({ label = 'ECG', tone = 'text-teal-500', className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] ${className}`}>
      <svg viewBox="0 0 170 68" preserveAspectRatio="none" className="w-full h-16" role="img" aria-label={`${label} trace`}>
        <path
          d={WAVE_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${tone} mq-wave`}
        />
      </svg>
      <span className={`absolute top-2 right-3 text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5`}>
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${tone} mq-blink`} />
        {label}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------
   3. TokenRing - animated queue/token dial.
      Use: patient portal, queue display.
   ------------------------------------------------------------------------- */
export function TokenRing({ value = 42, label = 'Queue', sublabel = 'A-118', className = '' }) {
  return (
    <div className={`relative grid place-items-center ${className}`}>
      <div className="relative w-28 h-28 grid place-items-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full mq-conic"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg 250deg, var(--primary) 300deg, var(--secondary) 340deg, transparent 360deg)',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))',
            opacity: 0.85,
          }}
        />
        <div className="relative text-center">
          <div className="text-2xl font-extrabold font-mono text-[var(--text)]">{value}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
        </div>
      </div>
      <div className="mt-1 text-xs font-bold text-[var(--primary)]">{sublabel}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   4. Marquee - static announcement strip.
      Formerly a continuously scrolling ticker. The scrolling keyframes are
      gone, so this now renders the announcements once, side by side, with no
      motion. `speed` is accepted but ignored, to keep call sites unchanged.
   ------------------------------------------------------------------------- */
export function Marquee({ items = [], speed = 26, className = '' }) {
  const list = Array.isArray(items) && items.length ? items : ['Welcome to Arogya Queue'];
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] py-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2 px-2">
        {list.map((item, i) => (
          <span key={i} className="flex items-center gap-2 px-3 text-xs font-semibold text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />
            {typeof item === 'string' ? item : item?.text}
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   5. ProcessingPipeline - staged progress (lab, pharmacy fulfilment).
   ------------------------------------------------------------------------- */
export function ProcessingPipeline({
  stages = [],
  active = 1,
  title = 'Processing',
  className = '',
}) {
  const list = stages.length ? stages : ['Collected', 'Analysed', 'Verified', 'Reported'];
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-[var(--primary)]" />
        <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
          {title}
        </span>
      </div>
      <ol className="space-y-2.5">
        {list.map((stage, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li key={i} className="flex items-center gap-2.5">
              <span
                className={`relative w-5 h-5 rounded-full grid place-items-center shrink-0 text-[10px] font-bold
                  ${done ? 'bg-[var(--primary)] text-white' : current ? 'bg-[var(--accent)] text-[var(--primary)] border-2 border-[var(--primary)]' : 'bg-[var(--bg)] text-[var(--text-muted)] border border-[var(--border)]'}`}
              >
                {i + 1}
              </span>
              <span
                className={`text-xs font-semibold flex-1
                  ${done ? 'text-[var(--text)]' : current ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
              >
                {typeof stage === 'string' ? stage : stage?.label}
              </span>
              {current && (
                <span className="text-[10px] font-bold text-[var(--primary)]">in progress</span>
              )}
            </li>
          );
        })}
      </ol>
      {/* Static bar - a fixed width, no transition and no animation. */}
      <div className="mt-3 h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, ((active + 1) / list.length) * 100)}%`,
            background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
          }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   6. RadarSweep - dispatch radar for the ambulance fleet.
   ------------------------------------------------------------------------- */
export function RadarSweep({ contacts = 3, label = 'Dispatch Radar', className = '' }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-4 h-4 text-[var(--primary)]" />
        <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </span>
        <span className="ml-auto text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mq-blink" />
          live
        </span>
      </div>
      <div className="relative mx-auto w-40 h-40 rounded-full border border-[var(--border)] bg-[var(--bg)] grid place-items-center overflow-hidden">
        {/* concentric rings */}
        {[0.34, 0.67, 1].map((f) => (
          <span
            key={f}
            aria-hidden="true"
            className="absolute rounded-full border border-[var(--border)]"
            style={{ width: `${f * 100}%`, height: `${f * 100}%` }}
          />
        ))}
        {/* crosshair */}
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-[var(--border)]" />
        <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-[var(--border)]" />
        {/* sweep */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full mq-radar-sweep"
          style={{ background: 'conic-gradient(from 0deg, rgba(79,70,229,0.35) 0deg, transparent 70deg)' }}
        />
        {/* contacts */}
        {Array.from({ length: contacts }).map((_, i) => {
          const angle = (i / Math.max(1, contacts)) * 360;
          return (
            <span
              key={i}
              aria-hidden="true"
              className="absolute w-2 h-2 rounded-full bg-rose-500"
              style={{
                transform: `rotate(${angle}deg) translateY(-${i === 0 ? 34 : 56}px) rotate(-${angle}deg)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   7. BarMeter - static occupancy / stock bars.
   ------------------------------------------------------------------------- */
export function BarMeter({ label, value = 0, max = 100, unit = '', tone = 'var(--primary)', className = '' }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] truncate">{label}</span>
        <span className="text-[11px] font-extrabold font-mono text-[var(--text)]">
          {value}
          {unit}
        </span>
      </div>
      {/* Static fill: fixed width, no transition, no keyframes. */}
      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-800 border border-[var(--border)] overflow-hidden">
        <div
          className="h-2 rounded-full"
          style={{ width: `${pct}%`, background: tone }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   8. ThinkDots - "AI reasoning" indicator.
   ------------------------------------------------------------------------- */
export function ThinkDots({ label = 'Analysing', className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mq-bounce-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mq-bounce-dot-2" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mq-bounce-dot-3" />
      </span>
      <span className="text-[11px] font-semibold text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------
   9. FloatingIcons - drifting decorative clinical glyphs.
   ------------------------------------------------------------------------- */
export function FloatingIcons({ className = '' }) {
  const glyphs = [
    { Icon: Stethoscope, pos: 'left-[8%] top-[22%]', size: 'w-7 h-7', tone: 'text-teal-500/35' },
    { Icon: HeartPulse, pos: 'right-[12%] top-[16%]', pos2: 'mq-float-2', size: 'w-6 h-6', tone: 'text-rose-500/35' },
    { Icon: Pill, pos: 'left-[16%] bottom-[18%]', pos2: 'mq-float-3', size: 'w-6 h-6', tone: 'text-violet-500/35' },
    { Icon: Droplet, pos: 'right-[8%] bottom-[24%]', size: 'w-7 h-7', tone: 'text-sky-500/35' },
  ];
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 hidden md:block ${className}`}>
      {glyphs.map(({ Icon, pos, pos2, size, tone }, i) => (
        <span key={i} className={`absolute ${pos} ${pos2 || 'mq-float'}`}>
          <Icon className={`${size} ${tone}`} />
        </span>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   10. ShimmerSkeleton - loading placeholder.
   ------------------------------------------------------------------------- */
export function ShimmerSkeleton({ className = 'h-3 w-full' }) {
  return <div className={`rounded-lg mq-shimmer ${className}`} aria-hidden="true" />;
}

/* -------------------------------------------------------------------------
   11. ModuleBadgeStrip - a themed icon strip for a module header.
   ------------------------------------------------------------------------- */
export function ModuleBadgeStrip({ items = [], className = '' }) {
  const glyphs = { queue: Activity, blood: Droplet, lab: Microscope, pharmacy: Pill, ambulance: Truck, bed: Boxes, sos: Siren, air: Wind, pin: MapPin };
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {items.map((it, i) => {
        const Icon = glyphs[it?.icon] || Sparkles;
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border
              border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] mq-lift ${i % 3 === 1 ? 'mq-lift-2' : i % 3 === 2 ? 'mq-lift-3' : ''}`}
          >
            <Icon className="w-3.5 h-3.5 text-[var(--primary)]" />
            {it?.label ?? it}
          </span>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------
   12. Empty sweep surface - shimmer card used between data loads.
   ------------------------------------------------------------------------- */
export function SweepSurface({ className = 'h-2 w-full' }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-[var(--bg)] border border-[var(--border)] ${className}`}>
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1/3 mq-sweep-x"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.35), transparent)' }} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   13. MotionStrip - a composite, variant-driven motion band.

   Each dashboard gets 3-4 domain-relevant animations through a single
   insertion, which keeps the edit to one JSX line per page instead of
   scattering a dozen components across eight files.

   NOTE ON DATA: any figure shown here is illustrative sample data and is
   labelled as such. A clinical UI must not present invented numbers as a
   patient's real readings.
   ------------------------------------------------------------------------- */

const STRIP_DATA = {
  login: {
    items: [
      { icon: 'queue', label: 'Zero-wait tokens' },
      { icon: 'bed', label: 'Live bed matrix' },
      { icon: 'blood', label: 'City blood bank' },
      { icon: 'ambulance', label: 'Fleet dispatch' },
    ],
    tips: ['Face-ID staff sign-in', 'OTP patient access', 'ISO-15189 certified blood bank'],
  },
  doctor: {
    bars: [
      { label: 'Bed occupancy', value: 78, max: 100, unit: '%' },
      { label: 'OPD queue', value: 14, max: 40, unit: '' },
      { label: 'ICU free', value: 6, max: 20, unit: '' },
    ],
    items: [
      { icon: 'lab', label: 'Lab orders' },
      { icon: 'pharmacy', label: 'Rx queue' },
      { icon: 'air', label: 'Vitals' },
    ],
    tips: ['Demo vitals', 'AI triage assist', 'Sample collection queued'],
  },
  patient: {
    bars: [
      { label: 'Queue position', value: 4, max: 20, unit: '' },
      { label: 'Estimated wait', value: 18, max: 60, unit: 'm' },
      { label: 'Reports ready', value: 2, max: 5, unit: '' },
    ],
    items: [
      { icon: 'queue', label: 'Live token' },
      { icon: 'lab', label: 'Reports' },
      { icon: 'pharmacy', label: 'Medicines' },
    ],
    tips: ['Keep your token SMS handy', 'Carry your Aadhaar/ABHA for faster check-in'],
  },
  pharmacy: {
    bars: [
      { label: 'Stock coverage', value: 86, max: 100, unit: '%' },
      { label: 'Pending dispense', value: 7, max: 20, unit: '' },
      { label: 'Expiring soon', value: 3, max: 10, unit: '' },
    ],
    stages: ['Prescription received', 'Stock verified', 'Dispensing', 'Handed over'],
    items: [
      { icon: 'pharmacy', label: 'Dispense' },
      { icon: 'blood', label: 'Cold chain' },
      { icon: 'queue', label: 'Reorder alerts' },
    ],
    tips: ['Demo stock figures'],
  },
  lab: {
    stages: ['Collected', 'Centrifuged', 'Analysed', 'Reported'],
    items: [
      { icon: 'lab', label: 'Sample in transit' },
      { icon: 'air', label: 'Analyser status' },
      { icon: 'queue', label: 'Report queue' },
    ],
    tips: ['Processed sample-to-result', 'Critical values flagged immediately'],
  },
  ambulance: {
    items: [
      { icon: 'ambulance', label: 'Fleet live' },
      { icon: 'sos', label: 'SOS matcher' },
      { icon: 'pin', label: 'Nearest unit' },
    ],
    tips: ['Dispatch radar is a demo visualisation'],
  },
  nurse: {
    bars: [
      { label: 'Ward A', value: 88, max: 100, unit: '%' },
      { label: 'Ward B', value: 64, max: 100, unit: '%' },
      { label: 'ICU', value: 92, max: 100, unit: '%' },
    ],
    items: [
      { icon: 'bed', label: 'Bed turnover' },
      { icon: 'lab', label: 'Collections due' },
      { icon: 'queue', label: 'Rounds' },
    ],
    tips: ['Demo occupancy figures'],
  },
  queue: {
    items: [
      { icon: 'queue', label: 'Now serving' },
      { icon: 'bed', label: 'Bed board' },
      { icon: 'air', label: 'Average wait 8m' },
    ],
    tips: ['Please keep your token number ready', 'Consultation rooms are on the first floor'],
  },
};

/* ---------------------------------------------------------------------------
   Per-dashboard composition.

   Each dashboard gets a DIFFERENT widget mix, a different grid shape and a
   different accent pair, so moving between modules feels like moving between
   distinct rooms rather than seeing the same band repeated.

   NOTE ON DATA: every figure rendered here is illustrative sample data and is
   labelled as such. A clinical UI must never present invented numbers as a
   patient's real readings.
   --------------------------------------------------------------------------- */
const STRIP_LAYOUT = {
  doctor:    { accent: ['#4F46E5', '#0D9488'], widgets: ['wave', 'bars', 'ai'],       grid: 'grid-cols-1 lg:grid-cols-3' },
  patient:   { accent: ['#0D9488', '#4F46E5'], widgets: ['ring', 'tips', 'bars'],     grid: 'grid-cols-1 lg:grid-cols-3' },
  pharmacy:  { accent: ['#0D9488', '#F59E0B'], widgets: ['pipeline', 'bars'],        grid: 'grid-cols-1 lg:grid-cols-2' },
  lab:       { accent: ['#8B5CF6', '#4F46E5'], widgets: ['pipeline', 'wave'],        grid: 'grid-cols-1 lg:grid-cols-2' },
  ambulance: { accent: ['#EF4444', '#4F46E5'], widgets: ['radar', 'ring', 'badges'],  grid: 'grid-cols-1 lg:grid-cols-3' },
  nurse:     { accent: ['#10B981', '#0D9488'], widgets: ['bars', 'wave', 'badges'],  grid: 'grid-cols-1 lg:grid-cols-3' },
  queue:     { accent: ['#4F46E5', '#0D9488'], widgets: ['ring', 'badges'],          grid: 'grid-cols-1 lg:grid-cols-2' },
  login:     { accent: ['#4F46E5', '#0D9488'], widgets: ['badges'],                  grid: 'grid-cols-1' },
};

const CARD = 'rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4';

function StripBars({ bars = [], accent }) {
  return (
    <div className="space-y-2.5">
      {bars.map((b, i) => (
        <BarMeter
          key={b.label}
          {...b}
          tone={i === 1 ? accent : `linear-gradient(90deg, ${accent}, var(--secondary))`}
        />
      ))}
      <p className="text-[10px] text-[var(--text-muted)] pt-0.5">Demo data</p>
    </div>
  );
}

function StripTips({ tips = [], accent }) {
  return (
    <div className={`${CARD} space-y-2`}>
      {tips.map((t, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
          <span
            className="mt-1 w-1.5 h-1.5 rounded-full shrink-0 mq-blink"
            style={{ background: accent, animationDelay: `${i * 0.25}s` }}
          />
          <span className="leading-relaxed">{t}</span>
        </div>
      ))}
    </div>
  );
}

function StripWidget({ kind, variant, accent, index }) {
  const cfg = STRIP_DATA[variant] || STRIP_DATA.login;

  switch (kind) {
    case 'wave':
      return (
        <Waveform
          label={variant === 'lab' ? 'Analyser' : variant === 'nurse' ? 'Ward Monitor' : 'Monitor'}
          tone={index % 2 === 0 ? 'text-teal-500' : 'text-rose-500'}
        />
      );

    case 'bars':
      return (
        <div className={CARD}>
          <StripBars bars={cfg.bars} accent={accent} />
        </div>
      );

    case 'ring':
      return (
        <div className={`${CARD} flex flex-col items-center justify-center gap-2`}>
          <TokenRing
            value={variant === 'patient' ? 4 : 12}
            label={variant === 'patient' ? 'Position' : 'Now serving'}
          />
          <ModuleBadgeStrip items={cfg.items} />
        </div>
      );

    case 'pipeline':
      return (
        <ProcessingPipeline
          stages={cfg.stages || []}
          active={1}
          title={variant === 'pharmacy' ? 'Dispensing' : 'Sample Progress'}
        />
      );

    case 'radar':
      return <RadarSweep contacts={3} />;

    case 'ai':
      return (
        <div className={`${CARD} space-y-2.5`}>
          <ThinkDots label={variant === 'doctor' ? 'Triage assistant is reasoning' : 'Syncing live data'} />
          <SweepSurface className="h-2 w-full" />
          <SweepSurface className="h-2 w-4/5" />
          <SweepSurface className="h-2 w-2/3" />
          <p className="text-[10px] text-[var(--text-muted)] pt-1">Demo data</p>
        </div>
      );

    case 'tips':
      return <StripTips tips={cfg.tips} accent={accent} />;

    case 'badges':
    default:
      return (
        <div className={`${CARD} space-y-2.5`}>
          <ModuleBadgeStrip items={cfg.items} />
          <SweepSurface className="h-2 w-full" />
        </div>
      );
  }
}

export function MotionStrip({ variant = 'login', className = '' }) {
  const layout = STRIP_LAYOUT[variant] || STRIP_LAYOUT.login;
  const cfg = STRIP_DATA[variant] || STRIP_DATA.login;

  return (
    <div className={`space-y-3 ${className}`} aria-label="Dashboard highlights">
      {variant === 'login' && (
        <div className="relative">
          <AuroraBackdrop variant="login" />
          <FloatingIcons />
        </div>
      )}

      {variant !== 'login' && <Marquee items={cfg.tips} speed={30} />}

      <div className={`grid ${layout.grid} gap-3`}>
        {layout.widgets.map((kind, i) => (
          <StripWidget
            key={kind}
            kind={kind}
            variant={variant}
            accent={layout.accent[i % layout.accent.length]}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
