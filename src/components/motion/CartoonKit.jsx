import React from 'react';
import { Sparkles, Heart, Pill, HeartPulse } from 'lucide-react';
import './cartoon.css';

/* ============================================================================
   CartoonKit - playful illustrated mascots for the patient dashboard.
   ----------------------------------------------------------------------------
   Every character is hand-built from vector shapes (paths + circles) and
   animated with CSS only. There is no <img>, no sprite sheet and no external
   host, so these can never 404, never show a broken-image placeholder, and
   scale cleanly from a phone to a wall-mounted TV.

   Tone note: these are intentionally friendly and non-clinical. They decorate
   a patient-facing surface only - they are NOT used anywhere a number could be
   mistaken for a real reading.
   ============================================================================ */

/* Shared face: two eyes that blink out of phase, plus a smile. */
function Face({ cx = 50, cy = 54, spread = 13, r = 3.4, smile = 8, mouthY = 8 }) {
  return (
    <g>
      <circle className="cq-eye" cx={cx - spread} cy={cy} r={r} fill="#0F172A" />
      <circle className="cq-eye-2" cx={cx + spread} cy={cy} r={r} fill="#0F172A" />
      <circle cx={cx - spread - 1} cy={cy - 1.2} r={1.1} fill="#fff" />
      <circle cx={cx + spread - 1} cy={cy - 1.2} r={1.1} fill="#fff" />
      <path
        d={`M ${cx - smile / 2} ${cy + mouthY} Q ${cx} ${cy + mouthY + smile} ${cx + smile / 2} ${cy + mouthY}`}
        fill="none"
        stroke="#0F172A"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </g>
  );
}

/* -------------------------------------------------------------------------
   CartoonHeart - the friendly mascot. Beats with a lub-dub rhythm.
   ------------------------------------------------------------------------- */
export function CartoonHeart({ size = 96, className = '', tone = '#4F46E5' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label="Cartoon heart mascot">
      <g className="cq-heartbeat">
        <path
          d="M50 84S12 60 12 38C12 25 21 16 32 16c6 0 12 3 15 8 3-5 9-8 15-8 11 0 20 9 20 22 0 22-32 46-32 46z"
          fill={tone}
        />
        <path d="M32 22c-7 2-11 8-11 16 0 6 2 11 5 15" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
        <Face cx={50} cy={48} spread={12} r={3.2} smile={11} mouthY={7} />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------
   CartoonPill - capsule mascot, winks and rocks.
   ------------------------------------------------------------------------- */
export function CartoonPill({ size = 88, className = '' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label="Cartoon pill mascot">
      <g className="cq-bounce-slow">
        <g transform="rotate(-28 50 52)">
          <rect x="12" y="38" width="76" height="28" rx="14" fill="#0D9488" />
          <path d="M50 38h24a14 14 0 0 1 14 14 14 14 0 0 1-14 14H50z" fill="#2DD4BF" />
          <rect x="12" y="38" width="76" height="28" rx="14" fill="none" stroke="#0F766A" strokeWidth="2" />
          <circle cx="34" cy="49" r="2.6" fill="#0F172A" />
          <circle cx="47" cy="49" r="2.6" fill="#0F172A" />
          <path d="M34 57q6 5 12 0" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------
   CartoonAmbulance - little rescue van with eyes on the windscreen.
   ------------------------------------------------------------------------- */
export function CartoonAmbulance({ size = 104, className = '' }) {
  return (
    <svg viewBox="0 0 120 80" width={size} height={size * (80 / 120)} className={className} role="img" aria-label="Cartoon ambulance">
      <g className="cq-bounce">
        <rect x="8" y="26" width="58" height="34" rx="7" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
        <path d="M66 34h20l16 14v12H66z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" strokeLinejoin="round" />
        <rect x="70" y="37" width="15" height="12" rx="3" fill="#7DD3FC" />
        {/* medical cross */}
        <rect x="26" y="36" width="18" height="6" rx="2" fill="#EF4444" />
        <rect x="32" y="30" width="6" height="18" rx="2" fill="#EF4444" />
        {/* eyes on the body */}
        <circle className="cq-eye" cx="27" cy="54" r="2.6" fill="#0F172A" />
        <circle className="cq-eye-2" cx="43" cy="54" r="2.6" fill="#0F172A" />
        <path d="M29 58q6 4 12 0" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
        <circle cx="94" cy="40" r="3" fill="#FBBF24" className="cq-blink" />
        <circle cx="30" cy="62" r="7" fill="#334155" />
        <circle cx="30" cy="62" r="3" fill="#94A3B8" />
        <circle cx="90" cy="62" r="7" fill="#334155" />
        <circle cx="90" cy="62" r="3" fill="#94A3B8" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------
   CartoonStethoscope - curious, tilts its head.
   ------------------------------------------------------------------------- */
export function CartoonStethoscope({ size = 92, className = '' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label="Cartoon stethoscope mascot">
      <g className="cq-tilt">
        <path d="M32 18v22a18 18 0 0 0 36 0V18" fill="none" stroke="#6366F1" strokeWidth="6" strokeLinecap="round" />
        <circle cx="32" cy="16" r="5" fill="#4F46E5" />
        <circle cx="68" cy="16" r="5" fill="#4F46E5" />
        <path d="M50 58v8a14 14 0 0 0 28 0v-4" fill="none" stroke="#6366F1" strokeWidth="6" strokeLinecap="round" />
        <circle cx="78" cy="70" r="12" fill="#A5B4FC" stroke="#4F46E5" strokeWidth="2.5" />
        <circle className="cq-eye" cx="74" cy="68" r="2.4" fill="#0F172A" />
        <circle className="cq-eye-2" cx="82" cy="68" r="2.4" fill="#0F172A" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------
   CartoonCloud + CartoonSparkles - friendly scenery.
   ------------------------------------------------------------------------- */
export function CartoonCloud({ size = 70, className = '' }) {
  return (
    <svg viewBox="0 0 120 60" width={size} height={size / 2} className={`cq-cloud ${className}`} aria-hidden="true">
      <g fill="#E0E7FF" opacity="0.9">
        <ellipse cx="38" cy="38" rx="24" ry="16" />
        <ellipse cx="62" cy="32" rx="26" ry="20" />
        <ellipse cx="86" cy="40" rx="20" ry="14" />
        <rect x="36" y="38" width="52" height="16" rx="8" />
      </g>
    </svg>
  );
}

export function CartoonSparkle({ size = 22, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={`cq-twinkle ${className}`} aria-hidden="true">
      <path d="M12 2l2.1 6.2L20 10l-5.9 1.8L12 18l-2.1-6.2L4 10l5.9-1.8z" fill="#FBBF24" />
    </svg>
  );
}

/* -------------------------------------------------------------------------
   CartoonBubble - a speech bubble with a friendly line and typing dots.
   ------------------------------------------------------------------------- */
export function CartoonBubble({
  children,
  tone = 'var(--card)',
  border = 'var(--border)',
  className = '',
}) {
  return (
    <div className={`relative rounded-2xl border px-4 py-3 ${className}`} style={{ background: tone, borderColor: border }}>
      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 left-6 w-3 h-3 rotate-45"
        style={{ background: tone, borderRight: '1px solid ' + border, borderBottom: '1px solid ' + border }}
      />
      <div className="cq-pop">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   TypingDots - "someone is writing" indicator.
   ------------------------------------------------------------------------- */
export function TypingDots({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label="Typing indicator">
      <span className="cq-bubble-dot w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
      <span className="cq-bubble-dot-2 w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
      <span className="cq-bubble-dot-3 w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
    </span>
  );
}

/* -------------------------------------------------------------------------
   ConfettiBurst - celebratory sprinkle for completed milestones.
   ------------------------------------------------------------------------- */
export function ConfettiBurst({ count = 14, className = '' }) {
  const colors = ['#4F46E5', '#0D9488', '#F59E0B', '#EF4444', '#8B5CF6'];
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {Array.from({ length: count }).map((_, i) => {
        const left = (i / count) * 100 + (i % 3) * 4;
        return (
          <span
            key={i}
            className="cq-confetti absolute top-0 w-1.5 h-3 rounded-sm"
            style={{
              left: `${left}%`,
              background: colors[i % colors.length],
              animationDelay: `${(i % 7) * 0.22}s`,
              animationDuration: `${1.7 + (i % 4) * 0.35}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------
   CartoonHero - the main patient-dashboard cartoon scene.
   Replaces the plain vitals panel header with a friendly illustrated band.
   ------------------------------------------------------------------------- */
export function CartoonHero({
  title = 'Your care, on your schedule',
  line = 'Your token is moving. Sit back, relax - we will call you.',
  className = '',
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-[var(--border)] p-5 sm:p-6 ${className}`}
      style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--card) 60%)' }}
      aria-label="Care cartoon"
    >
      <CartoonCloud size={110} className="absolute right-6 top-2 opacity-70" />
      <CartoonSparkle size={18} className="absolute right-24 top-8" />
      <CartoonSparkle size={13} className="absolute right-14 top-20" />
      <CartoonSparkle size={16} className="absolute left-[46%] top-6" />

      <div className="relative flex flex-wrap items-center gap-5">
        <CartoonHeart size={104} />
        <CartoonAmbulance size={118} className="hidden sm:block" />
        <CartoonPill size={78} className="hidden md:block" />
        <CartoonStethoscope size={80} className="hidden lg:block" />

        <div className="flex-1 min-w-[220px]">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--primary)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Care companion
          </p>
          <h3 className="text-xl font-extrabold tracking-tight text-[var(--text)] mt-1">{title}</h3>
          <CartoonBubble className="mt-2.5 max-w-md">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed flex items-center gap-2">
              {line}
              <TypingDots />
            </p>
          </CartoonBubble>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
            <HeartPulse className="w-3.5 h-3.5 text-[var(--secondary)]" />
            <Heart className="w-3.5 h-3.5 text-rose-500 cq-heartbeat" />
            <Pill className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Questions? Ask at the front desk any time.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CartoonHero;
