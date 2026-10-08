import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import './loginTheme.css';

/**
 * LoginShell
 * ---------------------------------------------------------------------------
 * The frame every AROGYA QUEUE login renders inside: a calm #f0f9ff surface
 * carrying the logo as a faint tiled watermark (8% opacity, 300px tiles), with
 * the form in a centred 440px white card on top and the credit line beneath.
 *
 * Covers every role - doctor, nurse, pharmacist, receptionist, lab tech,
 * ambulance, patient and both admin tiers - because all of them route through
 * this single shell.
 *
 * WHY THE WATERMARK IS CONDITIONAL ON IMAGE LOAD
 * ----------------------------------------------
 * A missing background-image already fails silently, so the tile is safe either
 * way. The <img> brand mark, though, would render a broken-image glyph, so it
 * is gated on a successful load and the gradient tile stands in until then.
 *
 * Deliberately static: no Lottie, no drifting orbs, no looping motion.
 */
const LOGO_SRC = '/arogya-logo.png';

export function LoginShell({ title, subtitle, badge, action, children }) {
  const [logoOk, setLogoOk] = useState(false);

  return (
    <div className="login-shell">
      {/* clinical texture - only visible while the logo is unavailable */}
      <div className="login-bg-pattern" aria-hidden="true" />

      {/* Watermark: the emblem only, tiled at 8%. Driven entirely by CSS in
          loginTheme.css so no inline style can clobber it. The wordmark is
          deliberately excluded - repeating "AROGYA QUEUE" text across the
          background reads as clutter rather than a watermark. */}
      <div className="login-watermark" aria-hidden="true" />

      {/* legibility scrim, above the watermark and below the form */}
      <div className="login-scrim" aria-hidden="true" />

      {/* the form */}
      <div className="login-card">
        <header className="login-card-header">
          {action && <div className="flex justify-end -mt-1 mb-2">{action}</div>}

          <div className="login-brand-mark">
            {logoOk ? (
              <img src={LOGO_SRC} alt={`${title || 'AROGYA QUEUE'} logo`} />
            ) : (
              <>
                <ShieldCheck className="w-6 h-6" />
                {/* invisible probe: the moment the file loads, the mark swaps over */}
                <img
                  src={LOGO_SRC}
                  alt=""
                  aria-hidden="true"
                  onLoad={() => setLogoOk(true)}
                  onError={() => setLogoOk(false)}
                  style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
                />
              </>
            )}
          </div>

          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {title || 'AROGYA QUEUE'}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
          {badge && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {badge}
            </span>
          )}
        </header>
        <div className="login-card-body">{children}</div>
      </div>

      {/* footer credit */}
      <div className="login-footer">
        <p>AROGYA QUEUE by Lakshmi &amp; Sushmitha S K</p>
      </div>
    </div>
  );
}

export default LoginShell;