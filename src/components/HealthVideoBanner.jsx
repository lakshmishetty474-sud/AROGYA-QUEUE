import { useState, useEffect, useRef, useCallback } from 'react';
import './HealthVideoBanner.css';

/* ============================================================================
   HealthVideoBanner
   ----------------------------------------------------------------------------
   Full-length health awareness videos for the patient portal and the
   waiting-room TV board.

   ---------------------------------------------------------------------------
   WHY THERE IS NO SLIDE TIMER
   ---------------------------------------------------------------------------
   Measured durations of these two videos:
     Br4sQmiJ1jU "10 Steps to Washing Your Hands (Short Version)" -> 122s (2:02)
     bwx2Z69S0YA "Doctor Checkup for Kids - Types of Doctors"     -> 275s (4:35)

   An 8-second setInterval was cutting them off after roughly 6% and 3% of
   playback. So there is deliberately NO fixed slide timer: each video is given
   loop=0 and we advance only when YouTube reports the video has actually
   finished (player state 0 = ENDED), which arrives over postMessage from the
   iframe because the embed is loaded with enablejsapi=1.

   That message is the ONLY thing that advances the carousel (apart from the
   user clicking a dot).

   ---------------------------------------------------------------------------
   MESSAGE HANDLING - the source guard matters
   ---------------------------------------------------------------------------
   Any page script can postMessage to the window. Listening for `data === 0`
   without checking who sent it will happily advance the carousel on unrelated
   messages. Every handler below therefore verifies
   event.source === iframe.contentWindow before acting.

   ---------------------------------------------------------------------------
   MUTE
   ---------------------------------------------------------------------------
   The src always carries mute=1, because YouTube refuses to autoplay audible
   video. Unmuting is done with a postMessage command issued inside the click
   handler, which is a user gesture and is therefore permitted. The iframe is
   NOT remounted on mute change (no key remount), so toggling sound is instant
   and does not restart the video.
   ============================================================================ */

const VIDEOS = [
  {
    id: 'Br4sQmiJ1jU',
    tag: '20 SECONDS THAT MATTER',
    title: 'Wash your hands',
    sub: 'Proper handwashing prevents most hospital-acquired infections.',
    seconds: 122,
  },
  {
    id: 'bwx2Z69S0YA',
    tag: 'YOUR HEALTH IS YOUR PRIORITY',
    title: 'Doctor Checkup for Kids',
    sub: 'Learn what happens during a doctor visit - no fear, just care.',
    seconds: 275,
  },
];

/* YouTube player states delivered over postMessage */
const STATE_ENDED = 0;
const STATE_PLAYING = 1;
const STATE_BUFFERING = 3;

/* If the embed has not proven it is alive by now, show the standby panel
   instead of leaving a black rectangle on a hospital TV. */
const READY_TIMEOUT_MS = 3000;
const TICK_MS = 500;

const VARIANTS = {
  patient: {
    height: 'h-[320px]',
    radius: 'rounded-[24px]',
    title: 'text-2xl',
    sub: 'text-[13px]',
    tag: 'text-[10px]',
    btn: 'w-8 h-8 text-base',
    dotOn: 'w-8',
    dotOff: 'w-3',
    counterPad: 'top-4 left-4 px-3 py-1 text-[11px]',
    textPad: 'p-6 pb-14',
    fallbackIcon: 'text-5xl',
  },
  tv: {
    height: 'h-[520px]',
    radius: 'rounded-[32px]',
    title: 'text-5xl lg:text-6xl',
    sub: 'text-xl lg:text-2xl',
    tag: 'text-base lg:text-lg',
    btn: 'w-14 h-14 text-3xl',
    dotOn: 'w-14',
    dotOff: 'w-6',
    counterPad: 'top-6 left-6 px-5 py-2 text-lg',
    textPad: 'p-8 lg:p-12 pb-24',
    fallbackIcon: 'text-[9rem]',
  },
};

function StandbyPanel({ v }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-slate-900 to-black grid place-items-center px-8 text-center">
      <div>
        <div
          className={`${v.fallbackIcon} mb-6 inline-flex h-[1.4em] w-[1.4em] items-center justify-center rounded-[28%] bg-emerald-500/15 text-emerald-300 hvb-standby-pulse`}
          aria-hidden="true"
        >
          +
        </div>
        <p className="text-emerald-300/90 text-sm font-semibold tracking-wide uppercase">
          Health awareness video
        </p>
        <p className="mt-2 text-white/70 text-lg max-w-md">
          {v.title} - video unavailable on this network. Please watch the looped
          summary on the board, or ask at the front desk.
        </p>
      </div>
    </div>
  );
}

export default function HealthVideoBanner({ variant = 'patient' }) {
  const v = VARIANTS[variant] || VARIANTS.patient;

  const [current, setCurrent] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);

  const iframeRef = useRef(null);
  const readyTimer = useRef(null);

  const slide = VIDEOS[current];

  const next = useCallback(() => {
    setElapsed(0);
    setStarted(false);
    setCurrent((p) => (p + 1) % VIDEOS.length);
  }, []);

  const previous = useCallback(() => {
    setElapsed(0);
    setStarted(false);
    setCurrent((p) => (p - 1 + VIDEOS.length) % VIDEOS.length);
  }, []);

  /* Reset per-slide state whenever the slide changes. */
  useEffect(() => {
    setBlocked(false);
    setElapsed(0);
    setStarted(false);
  }, [current]);

  /* Readiness watchdog: nothing alive within 3s -> standby panel. */
  useEffect(() => {
    if (readyTimer.current) clearTimeout(readyTimer.current);
    readyTimer.current = setTimeout(() => {
      setBlocked(true);
    }, READY_TIMEOUT_MS);
    return () => {
      if (readyTimer.current) clearTimeout(readyTimer.current);
      readyTimer.current = null;
    };
  }, [current]);

  /* Listen for player state from the embed. */
  useEffect(() => {
    const onMessage = (event) => {
      const frame = iframeRef.current;
      /* Guard against unrelated window messages. */
      if (!frame || event.source !== frame.contentWindow) return;

      const data = event.data;

      if (data === STATE_PLAYING || data === STATE_BUFFERING) {
        if (readyTimer.current) clearTimeout(readyTimer.current);
        setStarted(true);
        setBlocked(false);
        return;
      }

      /* The video really finished. Only now do we move on. */
      if (data === STATE_ENDED) {
        if (readyTimer.current) clearTimeout(readyTimer.current);
        setElapsed(slide.seconds);
        next();
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [next, slide.seconds]);

  /* Elapsed-time ticker for the progress bar. */
  useEffect(() => {
    if (blocked || !started) return undefined;
    const id = setInterval(() => {
      setElapsed((e) => (e >= slide.seconds ? slide.seconds : e + TICK_MS / 1000));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [blocked, started, slide.seconds]);

  /* Mute / unmute through postMessage - no remount, so playback continues. */
  const sendCommand = useCallback((func) => {
    const frame = iframeRef.current;
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args: [] }),
        '*'
      );
    } catch {
      /* frame not ready */
    }
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sendCommand(nextMuted ? 'mute' : 'unMute');
    if (!nextMuted) {
      sendCommand('playVideo');
      sendCommand('setVolume', [80]);
    }
  };

  /* Re-apply the sound choice after a slide change (new frame boots muted). */
  useEffect(() => {
    if (!started) return;
    sendCommand(isMuted ? 'mute' : 'unMute');
  }, [current, started, isMuted, sendCommand]);

  const pct = slide.seconds > 0 ? Math.min(100, (elapsed / slide.seconds) * 100) : 0;
  const mmss = (n) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;

  return (
    <div className={`relative w-full ${v.height} ${v.radius} overflow-hidden shadow-lg bg-black border`}>
      {/* Playback progress */}
      <div className="absolute inset-x-0 top-0 h-[4px] bg-white/15 z-20 pointer-events-none">
        <div
          className="h-full bg-emerald-400 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Counter */}
      <div
        className={`absolute ${v.counterPad} z-20 bg-white/90 backdrop-blur rounded-full font-bold flex items-center gap-3`}
      >
        <span>
          {String(current + 1).padStart(2, '0')} / {String(VIDEOS.length).padStart(2, '0')}
        </span>
        {started && !blocked && (
          <span className="text-black/45 font-mono text-[0.75em]">
            {mmss(elapsed)} / {mmss(slide.seconds)}
          </span>
        )}
      </div>

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute awareness videos' : 'Mute awareness videos'}
        aria-pressed={!isMuted}
        className={`absolute top-4 right-4 z-20 ${v.btn} bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors cursor-pointer`}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {/* Media surface.
          The iframe is ALWAYS mounted. The standby panel is an overlay, never a
          replacement: YouTube's player can take longer than READY_TIMEOUT_MS to
          initialise, and swapping the iframe out would permanently kill a video
          that was merely slow. A late state message simply hides the overlay. */}
      <div className="absolute inset-0">
        <iframe
          key={slide.id}
          ref={iframeRef}
          title={slide.title}
          className="absolute inset-0 w-full h-full scale-[1.35] pointer-events-none border-0"
          src={`https://www.youtube.com/embed/${slide.id}?autoplay=1&mute=1&loop=0&enablejsapi=1&controls=0&rel=0&playsinline=1`}
          allow="autoplay; encrypted-media"
          loading="lazy"
          onLoad={() => {
            if (readyTimer.current) clearTimeout(readyTimer.current);
            setBlocked(false);
          }}
        />
        {blocked && (
          <div className="absolute inset-0 z-10">
            <StandbyPanel v={{ ...v, title: slide.title }} />
          </div>
        )}
      </div>

      {/* Gradient overlay */}
      {!blocked && (
        <div className="absolute inset-0 bg-gradient-to-t from-teal-900/80 via-black/10 to-transparent pointer-events-none" />
      )}

      {/* Text overlay */}
      <div className={`absolute bottom-0 left-0 right-0 ${v.textPad} z-10 pointer-events-none`}>
        <p className={`${v.tag} tracking-widest text-teal-100 font-bold`}>⚡ {slide.tag}</p>
        <h2 className={`${v.title} font-bold text-white mt-2`}>{slide.title}</h2>
        <p className={`${v.sub} text-white/80 mt-2 max-w-[80%]`}>{slide.sub}</p>
      </div>

      {/* Dots + arrows */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <button
          onClick={previous}
          aria-label="Previous video"
          className="text-white/70 hover:text-white cursor-pointer text-xl"
        >
          ‹
        </button>
        <div className="flex gap-2">
          {VIDEOS.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setCurrent(i)}
              aria-label={`Show video ${i + 1}: ${item.title}`}
              aria-current={i === current}
              className={`h-[3px] rounded-full transition-all cursor-pointer ${
                i === current ? `${v.dotOn} bg-white` : `${v.dotOff} bg-white/40 hover:bg-white/70`
              }`}
            />
          ))}
        </div>
        <button
          onClick={next}
          aria-label="Next video"
          className="text-white/70 hover:text-white cursor-pointer text-xl"
        >
          ›
        </button>
      </div>
    </div>
  );
}