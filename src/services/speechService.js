/**
 * Arogya Queue — Multilingual Speech Announcement Service
 * Supports English (en-IN), Hindi (hi-IN), and Kannada (kn-IN)
 * 
 * Features:
 * - Asynchronous voice loading with onvoiceschanged handler
 * - Strict voice matching (never fall back to English for Hindi/Kannada)
 * - Dynamic localized announcement text templates
 * - Non-blocking warning when device lacks voice pack
 * - Speech queue cancellation & de-duplication
 * - Diagnostics / debug information support
 */

import { storage } from '../utils/storage.js';

export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
    locale: 'en-IN',
    fallbackLocales: ['en', 'en-US', 'en-GB'],
    speechTemplate: (token, room) => {
      const roomNum = String(room).replace(/^(Consultation\s+)?Room\s*/i, '').trim() || String(room);
      return `Token ${token}, please proceed to Consultation Room ${roomNum}.`;
    },
    voiceUnavailableMsg: 'English voice is not available on this device.',
  },
  hi: {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    flag: '🇮🇳',
    locale: 'hi-IN',
    fallbackLocales: ['hi'],
    speechTemplate: (token, room) => {
      const roomNum = String(room).replace(/^(Consultation\s+)?Room\s*/i, '').trim() || String(room);
      return `टोकन ${token}, कृपया परामर्श कक्ष ${roomNum} में जाएँ।`;
    },
    voiceUnavailableMsg: 'Hindi voice is not available on this device. Please install/enable a Hindi speech voice or use a supported browser.',
  },
  kn: {
    code: 'kn',
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    locale: 'kn-IN',
    fallbackLocales: ['kn'],
    speechTemplate: (token, room) => {
      const roomNum = String(room).replace(/^(Consultation\s+)?Room\s*/i, '').trim() || String(room);
      return `ಟೋಕನ್ ${token}, ದಯವಿಟ್ಟು ಸಮಾಲೋಚನಾ ಕೊಠಡಿ ${roomNum}ಕ್ಕೆ ತೆರಳಿ.`;
    },
    voiceUnavailableMsg:
      'Kannada voice is unavailable on this device/browser. Please enable/install a Kannada speech voice or use a browser/device that provides Kannada TTS.',
  },
};

// Global voice cache & asynchronous loader
let cachedVoices = [];
let voiceLoadingPromise = null;
let voicesLoaded = false;

/**
 * Fetch voices asynchronously, handling browser differences
 */
export function getAvailableVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }

  // If voices are already populated in synthesis object
  const immediate = window.speechSynthesis.getVoices();
  if (immediate && immediate.length > 0) {
    cachedVoices = immediate;
    voicesLoaded = true;
    return Promise.resolve(immediate);
  }

  if (voiceLoadingPromise) {
    return voiceLoadingPromise;
  }

  voiceLoadingPromise = new Promise((resolve) => {
    let timeoutId;

    const handleVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        cachedVoices = voices;
        voicesLoaded = true;
        cleanup();
        resolve(voices);
      }
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (window.speechSynthesis.removeEventListener) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      } else {
        window.speechSynthesis.onvoiceschanged = null;
      }
      voiceLoadingPromise = null;
    };

    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    } else {
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    }

    // Safety timeout in case onvoiceschanged does not fire
    timeoutId = setTimeout(() => {
      const fallback = window.speechSynthesis.getVoices() || [];
      cachedVoices = fallback;
      voicesLoaded = fallback.length > 0;
      cleanup();
      resolve(fallback);
    }, 1200);
  });

  return voiceLoadingPromise;
}

// Kick off early voice loading if in browser
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  getAvailableVoices();
}

/**
 * Safe, strict Kannada voice detection.
 * Searches exclusively for genuine Kannada speech synthesis voices.
 * Case-insensitive matching on 'kn-IN', 'kn', or Kannada voice descriptors.
 * Explicitly rejects English ('en*') or Hindi ('hi*') voices to avoid accidental fallback.
 */
export function findKannadaVoice(voiceList = null) {
  const voices =
    voiceList ||
    cachedVoices ||
    (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
  if (!voices || voices.length === 0) return null;

  // 1. Exact match kn-IN
  let match = voices.find((v) => {
    const l = (v.lang || '').replace('_', '-').toLowerCase();
    return l === 'kn-in';
  });
  if (match) return match;

  // 2. Starts with kn-in
  match = voices.find((v) => {
    const l = (v.lang || '').replace('_', '-').toLowerCase();
    return l.startsWith('kn-in');
  });
  if (match) return match;

  // 3. Starts with kn (kn, kn-*)
  match = voices.find((v) => {
    const l = (v.lang || '').replace('_', '-').toLowerCase();
    return l === 'kn' || l.startsWith('kn-');
  });
  if (match) return match;

  // 4. Voice name or URI indicates genuine Kannada (strictly excluding English/Hindi)
  match = voices.find((v) => {
    const l = (v.lang || '').toLowerCase();
    if (l.startsWith('en') || l.startsWith('hi')) return false;
    const n = (v.name || '').toLowerCase();
    const u = (v.voiceURI || '').toLowerCase();
    return (
      n.includes('kannada') ||
      n.includes('ಕನ್ನಡ') ||
      n.includes('sapna') ||
      n.includes('gagan') ||
      u.includes('kannada') ||
      u.includes('kn-in')
    );
  });
  if (match) return match;

  // NEVER fallback to English for Kannada!
  return null;
}

/**
 * Voice selection strategy following strict priority rules:
 * - English: en-IN -> en -> any English voice
 * - Hindi: hi-IN -> hi -> another Hindi voice (NEVER fallback to English)
 * - Kannada: kn-IN -> kn -> another Kannada voice (NEVER fallback to English)
 */
export function findVoiceForLanguage(langCode = 'en', voiceList = null) {
  const voices = voiceList || cachedVoices || (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
  if (!voices || voices.length === 0) return null;

  const targetLang = SUPPORTED_LANGUAGES[langCode] ? langCode : 'en';

  if (targetLang === 'en') {
    // 1. Exact match for en-IN
    let match = voices.find((v) => {
      const l = (v.lang || '').replace('_', '-').toLowerCase();
      return l === 'en-in';
    });
    if (match) return match;

    // 2. Starts with en-in
    match = voices.find((v) => {
      const l = (v.lang || '').replace('_', '-').toLowerCase();
      return l.startsWith('en-in');
    });
    if (match) return match;

    // 3. Indian English voice by name (e.g. Microsoft Ravi, Heera, Google India)
    match = voices.find((v) => {
      const l = (v.lang || '').toLowerCase();
      const n = (v.name || '').toLowerCase();
      return l.startsWith('en') && (n.includes('india') || n.includes('ravi') || n.includes('heera'));
    });
    if (match) return match;

    // 4. Any English locale (en-US, en-GB, en-AU, etc.)
    match = voices.find((v) => {
      const l = (v.lang || '').replace('_', '-').toLowerCase();
      return l.startsWith('en');
    });
    if (match) return match;

    // 5. Name contains English
    return voices.find((v) => (v.name || '').toLowerCase().includes('english')) || null;
  }

  if (targetLang === 'hi') {
    // 1. Exact match hi-IN
    let match = voices.find((v) => {
      const l = (v.lang || '').replace('_', '-').toLowerCase();
      return l === 'hi-in';
    });
    if (match) return match;

    // 2. Starts with hi-in
    match = voices.find((v) => {
      const l = (v.lang || '').replace('_', '-').toLowerCase();
      return l.startsWith('hi-in');
    });
    if (match) return match;

    // 3. Starts with hi
    match = voices.find((v) => {
      const l = (v.lang || '').replace('_', '-').toLowerCase();
      return l.startsWith('hi');
    });
    if (match) return match;

    // 4. Voice name contains Hindi, हिन्दी, Hemant, Kalpana, Madhur, Swara
    match = voices.find((v) => {
      const n = (v.name || '').toLowerCase();
      return (
        n.includes('hindi') ||
        n.includes('हिन्दी') ||
        n.includes('hemant') ||
        n.includes('kalpana') ||
        n.includes('madhur') ||
        n.includes('swara')
      );
    });
    if (match) return match;

    // NEVER fallback to English for Hindi!
    return null;
  }

  if (targetLang === 'kn') {
    return findKannadaVoice(voices);
  }

  return null;
}

/**
 * Format announcement text based on selected language
 */
export function buildAnnouncementText(token, room = 'Consultation Room 1', lang = 'en') {
  const config = SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES.en;
  return config.speechTemplate(token, room);
}

// Track state for de-duplication & diagnostics
let lastSpokenToken = null;
let lastSpokenTime = 0;
let lastVoiceDebugInfo = {
  selectedLanguage: 'English',
  requestedLocale: 'en-IN',
  selectedVoice: 'None initialized',
  voiceLocale: 'en-IN',
};

// Listeners for voice warnings (e.g. voice pack missing on device)
const warningListeners = new Set();

export function subscribeVoiceWarnings(listener) {
  warningListeners.add(listener);
  return () => warningListeners.delete(listener);
}

function emitVoiceWarning(message) {
  warningListeners.forEach((fn) => {
    try {
      fn(message);
    } catch (err) {
      console.warn('Voice warning listener error:', err);
    }
  });
}

/**
 * Get current diagnostics info for dev/debug panel
 */
export function getLastVoiceDebugInfo() {
  const voices =
    cachedVoices.length > 0
      ? cachedVoices
      : typeof window !== 'undefined' && window.speechSynthesis
      ? window.speechSynthesis.getVoices()
      : [];

  const kannadaVoices = voices.filter((v) => {
    const l = (v.lang || '').toLowerCase();
    if (l.startsWith('en') || l.startsWith('hi')) return false;
    const n = (v.name || '').toLowerCase();
    const u = (v.voiceURI || '').toLowerCase();
    return (
      l.startsWith('kn') ||
      n.includes('kannada') ||
      n.includes('ಕನ್ನಡ') ||
      n.includes('sapna') ||
      n.includes('gagan') ||
      u.includes('kannada')
    );
  });

  const hindiVoices = voices.filter((v) => {
    const l = (v.lang || '').toLowerCase();
    const n = (v.name || '').toLowerCase();
    return l.startsWith('hi') || n.includes('hindi') || n.includes('हिन्दी');
  });

  return {
    ...lastVoiceDebugInfo,
    availableKannadaVoices: kannadaVoices.map((v) => v.name).join(', ') || 'None installed on this device',
    kannadaVoiceCount: kannadaVoices.length,
    isKannadaAvailable: kannadaVoices.length > 0,
    isHindiAvailable: hindiVoices.length > 0,
    isEnglishAvailable: voices.some((v) => (v.lang || '').toLowerCase().startsWith('en')),
  };
}

/**
 * Check if a genuine voice is available for the given language
 */
export function isVoiceAvailableForLanguage(langCode = 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return !!findVoiceForLanguage(langCode);
}

let currentAudio = null;

export function stopAnySpeech() {
  if (typeof window !== 'undefined') {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (_) {}
      currentAudio = null;
    }
  }
}

/**
 * Play high-fidelity audio stream when local OS lacks Kannada/Hindi speech engine
 */
export async function playAudioAnnouncement(text, lang = 'kn') {
  stopAnySpeech();
  return new Promise((resolve, reject) => {
    const primaryUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
    const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;

    const audio = new Audio();
    currentAudio = audio;
    audio.preload = 'auto';

    let resolved = false;
    const cleanupAndResolve = () => {
      if (!resolved) {
        resolved = true;
        currentAudio = null;
        resolve({ success: true, method: 'cloud_tts' });
      }
    };

    audio.onended = cleanupAndResolve;

    audio.onerror = () => {
      if (audio.src !== fallbackUrl) {
        audio.src = fallbackUrl;
        audio.play().catch((err) => {
          cleanupAndResolve();
          reject(err);
        });
      } else {
        cleanupAndResolve();
        reject(new Error('Audio playback failed'));
      }
    };

    audio.src = primaryUrl;
    audio
      .play()
      .then(() => {})
      .catch(() => {
        audio.src = fallbackUrl;
        audio
          .play()
          .then(() => {})
          .catch(reject);
      });
  });
}

/**
 * Announce token with speech synthesis, falling back gracefully to Cloud TTS if local voice is absent
 * @param {string|number} token
 * @param {string} room
 * @param {string} lang ('en' | 'hi' | 'kn')
 * @param {object} options ({ force?: boolean, onWarning?: function })
 */
export async function speakAnnouncement(token, room = 'Consultation Room 1', lang = 'en', options = {}) {
  if (!token) return { success: false, reason: 'No token provided' };

  // De-duplication check: prevent duplicate announcement of same token within 2.5s
  const now = Date.now();
  if (!options.force && lastSpokenToken === String(token) && now - lastSpokenTime < 2500) {
    return { success: false, skipped: true, reason: 'Duplicate announcement suppressed' };
  }

  // Ensure voices are loaded if speechSynthesis is supported
  let voices = cachedVoices;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (!voices || voices.length === 0) {
      voices = await getAvailableVoices();
    }
  }

  const langConfig = SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES.en;
  const selectedVoice = findVoiceForLanguage(lang, voices);

  // If local device does not have a genuine voice (common for Kannada on Windows/Android):
  // Seamlessly announce using the integrated Cloud Voice Engine without failing!
  if (!selectedVoice) {
    try {
      const text = buildAnnouncementText(token, room, lang);
      lastSpokenToken = String(token);
      lastSpokenTime = now;

      lastVoiceDebugInfo = {
        selectedLanguage: langConfig.label,
        requestedLocale: langConfig.locale,
        selectedVoice: 'Cloud Voice Engine (Google Kannada)',
        voiceLocale: langConfig.locale,
      };

      await playAudioAnnouncement(text, lang);
      return {
        success: true,
        text,
        voice: 'Cloud Voice Engine (Google Kannada)',
        locale: langConfig.locale,
        method: 'cloud_tts',
      };
    } catch (audioErr) {
      console.warn('Cloud TTS fallback issue, attempting warning notification:', audioErr);
      emitVoiceWarning(langConfig.voiceUnavailableMsg);
      if (options.onWarning) options.onWarning(langConfig.voiceUnavailableMsg);
      return {
        success: false,
        error: 'voice_unavailable',
        warning: langConfig.voiceUnavailableMsg,
        language: lang,
      };
    }
  }

  // If local voice exists in browser, speak through SpeechSynthesis
  try {
    // 1. Resume synthesis if browser paused it
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    // 2. Cancel previous pending speech
    stopAnySpeech();

    // 3. Build dynamic localized announcement sentence
    const text = buildAnnouncementText(token, room, lang);

    // 4. Create utterance and explicitly assign voice
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langConfig.locale;
    utterance.voice = selectedVoice;
    utterance.rate = lang === 'kn' ? 0.88 : 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    lastSpokenToken = String(token);
    lastSpokenTime = now;

    lastVoiceDebugInfo = {
      selectedLanguage: langConfig.label,
      requestedLocale: langConfig.locale,
      selectedVoice: selectedVoice.name,
      voiceLocale: selectedVoice.lang,
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('Speech playback issue:', e.error);
      }
    };

    // 5. Speak
    window.speechSynthesis.speak(utterance);

    return {
      success: true,
      text,
      voice: selectedVoice.name,
      locale: langConfig.locale,
      method: 'speech_synthesis',
    };
  } catch (err) {
    console.warn('Speech synthesis execution error:', err);
    // Attempt cloud fallback on speech synthesis crash
    try {
      const text = buildAnnouncementText(token, room, lang);
      await playAudioAnnouncement(text, lang);
      return { success: true, text, voice: 'Cloud Voice Engine' };
    } catch (_) {
      const errorMsg =
        lang === 'kn'
          ? 'Kannada voice announcement could not be started.'
          : 'Voice announcement could not be started.';
      emitVoiceWarning(errorMsg);
      if (options.onWarning) options.onWarning(errorMsg);
      return { success: false, error: err, warning: errorMsg };
    }
  }
}
