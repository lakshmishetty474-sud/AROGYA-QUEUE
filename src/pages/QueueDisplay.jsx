import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Volume2,
  VolumeX,
  Maximize,
  Clock,
  Building2,
  Activity,
  HeartPulse,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { AwarenessCarousel, TvTicker, QuickActionCards } from '../components/motion/QueueBoardSlides';
import HealthVideoBanner from '../components/HealthVideoBanner';

import { useHealthcare } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  announceToken,
  TRANSLATIONS,
  getLastVoiceDebugInfo,
  subscribeVoiceWarnings,
} from '../utils/translations';
import { storage } from '../utils/storage';
import { formatTime } from '../utils/formatters';

export function QueueDisplay() {
  const {
    patients,
    activeHospitalId,
    hospitals,
    emergencyMode,
    calculateQueueEta,
  } = useHealthcare();

  const [lang, setLang] = useState(() => storage.getItem('announcementLang', 'en'));
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [voiceWarning, setVoiceWarning] = useState(null);
  const [debugInfo, setDebugInfo] = useState(() => getLastVoiceDebugInfo());

  // Listen for non-blocking voice warnings (e.g. Hindi or Kannada voice pack not installed on device)
  useEffect(() => {
    const unsub = subscribeVoiceWarnings((warning) => {
      setVoiceWarning(warning);
      setDebugInfo(getLastVoiceDebugInfo());
    });
    return unsub;
  }, []);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    setVoiceWarning(null);
    storage.setItem('announcementLang', newLang);
    setTimeout(() => setDebugInfo(getLastVoiceDebugInfo()), 50);
  };

  const isDebugMode =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).has('debug') || storage.getItem('voice_debug', false));

  const activeHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[0];
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sort queue preserving existing priority/emergency rules + numerical token order
  const sortHospitalQueue = (list) => {
    const priorityWeight = {
      Emergency: 1,
      Urgent: 2,
      Normal: 3,
    };

    const extractTokenNum = (token = '') => {
      const match = String(token).match(/(\d+)$/);
      if (match) return parseInt(match[1], 10);
      const digits = String(token).replace(/\D/g, '');
      return digits ? parseInt(digits, 10) : 0;
    };

    return [...list].sort((a, b) => {
      // 1. Priority triage rules: Emergency > Urgent > Normal
      const pA = priorityWeight[a.priority] || 3;
      const pB = priorityWeight[b.priority] || 3;
      if (pA !== pB) return pA - pB;

      // 2. Queue position order
      if (a.queuePosition && b.queuePosition && a.queuePosition !== b.queuePosition) {
        return a.queuePosition - b.queuePosition;
      }

      // 3. Numerical token order (e.g. AQ-2026-0001 < AQ-2026-0002, not string alphabetical)
      const numA = extractTokenNum(a.token);
      const numB = extractTokenNum(b.token);
      if (numA !== numB) return numA - numB;

      // 4. Registration timestamp
      return new Date(a.registeredAt || 0) - new Date(b.registeredAt || 0);
    });
  };

  // Filter queue for active hospital
  const hospitalPatients = patients.filter((p) => p.hospitalId === activeHospitalId);

  // Currently serving tokens (In Consultation or active Emergency in consultation)
  const nowServing = sortHospitalQueue(
    hospitalPatients.filter(
      (p) => p.status === 'In Consultation' || (p.priority === 'Emergency' && p.status !== 'Waiting' && p.status !== 'Discharged')
    )
  );

  // Upcoming / next tokens waiting to be called
  const upcomingQueue = sortHospitalQueue(
    hospitalPatients.filter((p) => p.status === 'Waiting')
  );

  const prevServingTokenRef = React.useRef(null);
  const isInitialMount = React.useRef(true);

  // Auto-announce when next patient is called to Now Serving
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevServingTokenRef.current = nowServing[0]?.token;
      return;
    }

    const currentServingToken = nowServing[0]?.token;
    if (currentServingToken && currentServingToken !== prevServingTokenRef.current) {
      prevServingTokenRef.current = currentServingToken;
      if (audioEnabled) {
        const roomStr = nowServing[0]?.room ? `Consultation Room ${nowServing[0].room}` : 'Consultation Room 1';
        announceToken(currentServingToken, roomStr, lang);
      }
    }
  }, [nowServing, audioEnabled, lang]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleTestChime = () => {
    if (nowServing[0]) {
      const roomStr = nowServing[0]?.room ? `Consultation Room ${nowServing[0].room}` : 'Consultation Room 1';
      announceToken(nowServing[0].token, roomStr, lang, { force: true });
    } else if (upcomingQueue[0]) {
      announceToken(upcomingQueue[0].token, 'Consultation Room 1', lang, { force: true });
    }
    setTimeout(() => setDebugInfo(getLastVoiceDebugInfo()), 100);
  };

  return (
    <div className="aq-allow-motion min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Top TV Header Bar */}
      <header className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{t.appName}</span>
              <span className="text-xs font-normal text-teal-400 font-mono px-2 py-0.5 rounded-full bg-teal-950 border border-teal-800">
                LIVE OPD DISPLAY
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">{activeHospital?.name}</p>
          </div>
        </div>

        {/* Emergency Ticker if active */}
        {emergencyMode && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-red-600/30 border border-red-500 text-red-300 font-bold text-xs animate-pulse">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>{t.emergencyMode} — PRIORITY TRAUMA FAST-TRACK</span>
          </div>
        )}

        {/* Controls & Clock */}
        <div className="flex items-center gap-4">
          <div className="text-right font-mono">
            <span className="text-lg font-bold text-white block leading-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[11px] text-slate-400 block">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Multilingual Announcement Language Selector */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 p-1 rounded-xl">
            {[
              { code: 'en', label: 'English', flag: '🇬🇧' },
              { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
              { code: 'kn', label: 'Kannada', flag: '🇮🇳' },
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => handleLanguageChange(item.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  lang === item.code
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Announce tokens in ${item.label}`}
              >
                <span>{item.flag}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Voice Availability Accessibility Indicator */}
          <span
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg border bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
            title={`Speech announcement engine active for ${lang === 'kn' ? 'Kannada' : lang === 'hi' ? 'Hindi' : 'English'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Voice: Ready</span>
          </span>

          {/* Voice Announcement Audio Toggle Indicator */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              audioEnabled
                ? 'bg-teal-950/80 border-teal-500/50 text-teal-300 hover:bg-teal-900/80'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={audioEnabled ? 'Voice Announcement: ON' : 'Voice Announcement: MUTED'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span className="hidden md:inline font-mono">🔊 Voice: {audioEnabled ? 'ON' : 'MUTED'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
            </header>

            {/* TV slide animations: awareness carousel, big-print ticker and the
          quick-action row. Scoped in a `dark` wrapper so the shared theme
          tokens resolve to the dark palette this board always uses. */}
      <div className="dark px-4 sm:px-6 pt-3 space-y-3">
        <TvTicker speed={34} />
        {/* Animated health awareness clips - same media + Lottie fallback chain
            as the patient dashboard, rendered at TV scale for the waiting room. */}
        <HealthVideoBanner variant="tv" />
        <AwarenessCarousel />
        <QuickActionCards />
      </div>

      {/* Non-blocking Warning Banner if requested voice is not installed */}
      {voiceWarning && (
        <div className="mx-6 mt-3 px-4 py-2.5 bg-amber-950/90 border border-amber-500/60 rounded-2xl flex items-center justify-between text-amber-200 text-xs font-medium shadow-xl">
          <div className="flex items-center gap-2">
            <VolumeX className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{voiceWarning}</span>
          </div>
          <button
            onClick={() => setVoiceWarning(null)}
            className="text-amber-400 hover:text-white font-bold ml-4 px-2 py-0.5 rounded cursor-pointer"
            title="Dismiss warning"
          >
            ✕
          </button>
        </div>
      )}


      {/* Main TV Screen Content */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: NOW SERVING BIG DISPLAY (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-xl font-black uppercase tracking-wider text-emerald-400">
                {t.nowServing}
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Active Consultations & Triage
            </span>
          </div>

          {nowServing.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900/60 rounded-3xl border border-slate-800/80 text-center">
              <Clock className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
              <h3 className="text-2xl font-bold text-slate-400">Consultation Counter In Transition</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">
                Next patient token is being called by the consulting physician. Please watch the display screen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {nowServing.slice(0, 4).map((p, idx) => (
                <div
                  key={p.id}
                  className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/50 border-2 border-teal-500/60 shadow-2xl flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <Badge variant={p.priority === 'Emergency' ? 'emergency' : 'teal'} size="md">
                      {p.priority === 'Emergency' ? 'STAT EMERGENCY' : 'IN CONSULTATION'}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">
                      OPD TOKEN
                    </span>
                    <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white block">
                      {p.token}
                    </span>
                    <div className="mt-2.5">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                        Patient
                      </span>
                      <span className="text-xl font-bold text-white tracking-wide block truncate">
                        {p.name}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                          Doctor
                        </span>
                        <span className="text-sm font-bold text-teal-300 block">{p.doctor}</span>
                        <span className="text-xs text-slate-400">{p.department}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                          Room
                        </span>
                        <span className="text-lg font-mono font-black text-amber-400">
                          {p.room ? `Room ${p.room}` : `Room #${101 + idx}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: NEXT TOKENS & QUEUE VELOCITY (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xl font-black uppercase tracking-wider text-teal-400">
              {t.nextToken}
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Waiting ({upcomingQueue.length})
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {upcomingQueue.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-500 text-sm">
                No patients currently waiting in line.
              </div>
            ) : (
              upcomingQueue.slice(0, 6).map((patient, index) => (
                <div
                  key={patient.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono font-bold text-xs ${
                        index === 0
                          ? 'bg-teal-600 border-teal-400 text-white shadow-md shadow-teal-500/30'
                          : 'bg-slate-800 border-slate-700 text-teal-400'
                      }`}
                    >
                      {index === 0 ? 'NEXT' : `#${index + 1}`}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-white">
                          {patient.token}
                        </span>
                        {index === 0 && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                            NEXT IN LINE
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-slate-200">
                        Patient: <span className="text-teal-300 font-bold">{patient.name}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {patient.department} • {patient.doctor}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant={
                        patient.priority === 'Emergency'
                          ? 'emergency'
                          : patient.priority === 'Urgent'
                          ? 'warning'
                          : 'teal'
                      }
                      size="sm"
                    >
                      {patient.priority}
                    </Badge>
                    <span className="text-[11px] text-slate-400 block font-mono mt-1">
                      Est. Wait: {calculateQueueEta(patient.queuePosition, patient.priority)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Notice Footer */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Please arrive at your consultation room when token is announced.</span>
            <Button variant="ghost" size="sm" onClick={handleTestChime} className="text-teal-400 hover:text-teal-300">
              <Volume2 className="w-3.5 h-3.5 mr-1" />
              Chime
            </Button>
          </div>
        </div>
      </main>

      {/* Voice Diagnostics Debug Panel (Active when URL has ?debug=true or voice_debug is enabled) */}
      {isDebugMode && (
        <div className="fixed bottom-4 right-4 bg-slate-900/95 border border-teal-500/50 rounded-2xl p-3.5 text-xs font-mono shadow-2xl z-50 text-slate-300 max-w-xs backdrop-blur-md">
          <div className="font-bold text-teal-400 mb-1.5 flex items-center justify-between border-b border-slate-800 pb-1">
            <span>Voice Diagnostics</span>
            <span className="text-[10px] bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-800">DEV DEBUG</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div><span className="text-slate-500">Selected Language:</span> <span className="text-white font-semibold">{debugInfo.selectedLanguage}</span></div>
            <div><span className="text-slate-500">Requested Locale:</span> <span className="text-white">{debugInfo.requestedLocale}</span></div>
            <div><span className="text-slate-500">Selected Voice:</span> <span className="text-teal-300 truncate block">{debugInfo.selectedVoice}</span></div>
            <div><span className="text-slate-500">Voice Locale:</span> <span className="text-white">{debugInfo.voiceLocale}</span></div>
            <div><span className="text-slate-500">Kannada Voices:</span> <span className="text-amber-300 truncate block">{debugInfo.availableKannadaVoices || 'None'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
