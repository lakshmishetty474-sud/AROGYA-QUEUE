import crypto from 'node:crypto';
import { smsService } from './smsService.js';

/**
 * Production-ready Patient OTP API Middleware for Vite Dev Server.
 *
 * Implements:
 * - POST /api/auth/patient/send-otp
 * - POST /api/auth/patient/verify-otp
 *
 * Security Features:
 * - Cryptographically secure 6-digit random generation via crypto.randomInt().
 * - SHA-256 OTP hashing (avoids storing plain-text OTPs in memory).
 * - 5-minute validity window (300 seconds).
 * - 30-second resend cooldown timer.
 * - Rate limiting against spamming (max 5 resends in 15 minutes).
 * - Brute-force lockout (max 5 incorrect verification attempts).
 * - Multi-provider SMS dispatch: MSG91, Twilio, Fast2SMS.
 * - Clean DEVELOPMENT / DEMO MODE fallback when credentials are not configured.
 */

// Authoritative in-memory store for active verification sessions
const otpStore = new Map();

// Helper to parse JSON from node incoming request
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(payload));
}

export function otpApiPlugin(customEnv = {}) {
  return {
    name: 'otp-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        const env = { ...process.env, ...customEnv };

        // Handle CORS preflight
        if (req.method === 'OPTIONS' && url.startsWith('/api/auth/patient/')) {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          res.end();
          return;
        }

        // ==========================================
        // 0. HIGH-PRECISION CLOUD TTS (GET /api/tts)
        // ==========================================
        if (req.method === 'GET' && url === '/api/tts') {
          try {
            const reqUrl = new URL(req.url, 'http://localhost:5173');
            const text = reqUrl.searchParams.get('text');
            const lang = reqUrl.searchParams.get('lang') || 'kn';

            if (!text) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Text query parameter is required' }));
              return;
            }

            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
            const ttsResp = await fetch(ttsUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            });

            if (!ttsResp.ok) {
              res.writeHead(ttsResp.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Upstream TTS service error' }));
              return;
            }

            const arrayBuf = await ttsResp.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);

            res.writeHead(200, {
              'Content-Type': 'audio/mpeg',
              'Content-Length': buffer.length,
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=86400',
            });
            res.end(buffer);
            return;
          } catch (err) {
            console.error('Vite TTS proxy error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // ==========================================
        // 1. SEND OTP (POST /api/auth/patient/send-otp)
        // ==========================================
        if (req.method === 'POST' && url === '/api/auth/patient/send-otp') {
          try {
            const body = await parseBody(req);
            const { mobile, name } = body;

            // Validate Indian mobile number
            const norm = smsService.normalizeIndianMobile(mobile);
            if (!norm.isValid) {
              return sendJson(res, 400, {
                success: false,
                error: norm.error || 'Please enter a valid 10-digit mobile number.',
              });
            }

            const cleanMobile = norm.clean10;
            const existing = otpStore.get(cleanMobile);
            const now = Date.now();

            // 1. Enforce 30s resend cooldown
            if (existing && existing.resendCooldownUntil && now < existing.resendCooldownUntil) {
              const secondsLeft = Math.ceil((existing.resendCooldownUntil - now) / 1000);
              return sendJson(res, 429, {
                success: false,
                error: `Please wait ${secondsLeft}s before requesting another OTP.`,
              });
            }

            // 2. Protect against excessive resends (max 5 per session)
            if (existing && existing.resendCount >= 5 && now - existing.createdAt < 15 * 60 * 1000) {
              return sendJson(res, 429, {
                success: false,
                error: 'Too many OTP requests. Please try again later.',
              });
            }

            // 3. Cryptographically secure 6-digit random code (100000 - 999999)
            const otp = crypto.randomInt(100000, 1000000).toString();

            // 4. Compute SHA-256 hash for secure storage
            const otpHash = crypto.createHash('sha256').update(`${cleanMobile}:${otp}`).digest('hex');

            const EXPIRES_IN_SECONDS = 300; // 5 minutes validity
            const RESEND_COOLDOWN_SECONDS = 30; // 30 seconds resend cooldown
            const expiresAt = now + EXPIRES_IN_SECONDS * 1000;
            const resendCooldownUntil = now + RESEND_COOLDOWN_SECONDS * 1000;
            const maskedMobile = `******${cleanMobile.slice(-4)}`;

            // 5. Attempt SMS dispatch through configured provider
            const smsResult = await smsService.sendOtpSMS(cleanMobile, otp, env);

            // 6. Save hashed OTP session to store
            otpStore.set(cleanMobile, {
              otpHash,
              // Retain plain OTP only in demo mode for UI display
              demoOtp: smsResult.isConfigured ? null : otp,
              expiresAt,
              resendCooldownUntil,
              createdAt: existing?.createdAt || now,
              resendCount: (existing?.resendCount || 0) + 1,
              attempts: 0,
              name: name || '',
            });

            // 7. PRODUCTION MODE (Provider credentials configured)
            if (smsResult.isConfigured) {
              if (smsResult.success) {
                return sendJson(res, 200, {
                  success: true,
                  mode: 'production',
                  provider: smsResult.provider,
                  maskedMobile,
                  expiresIn: EXPIRES_IN_SECONDS,
                  resendCooldown: RESEND_COOLDOWN_SECONDS,
                  message: `OTP sent successfully to ${maskedMobile}.`,
                });
              } else {
                // Provider failure (e.g. invalid template, network error, insufficient credits)
                return sendJson(res, 502, {
                  success: false,
                  error: smsResult.error || 'Unable to deliver SMS right now. Please try again.',
                });
              }
            }

            // 8. DEVELOPMENT / DEMO MODE (No credentials configured)
            console.log(`[OTP Server Demo] Mobile: ${maskedMobile}, Demo Code: ${otp}`);
            return sendJson(res, 200, {
              success: true,
              mode: 'demo',
              demoOtp: otp,
              maskedMobile,
              expiresIn: EXPIRES_IN_SECONDS,
              resendCooldown: RESEND_COOLDOWN_SECONDS,
              message: `SMS service is not configured. Demo OTP: ${otp}`,
            });
          } catch (err) {
            if (err instanceof SyntaxError) {
              return sendJson(res, 400, {
                success: false,
                error: 'Invalid JSON request payload.',
              });
            }
            console.error('[OTP Server] send-otp exception:', err);
            return sendJson(res, 500, {
              success: false,
              error: 'Server error while generating OTP. Please try again.',
            });
          }
        }

        // ==========================================
        // 2. VERIFY OTP (POST /api/auth/patient/verify-otp)
        // ==========================================
        if (req.method === 'POST' && url === '/api/auth/patient/verify-otp') {
          try {
            const body = await parseBody(req);
            const { mobile, otp } = body;

            if (!mobile || !otp) {
              return sendJson(res, 400, {
                success: false,
                error: 'Mobile number and OTP code are required.',
              });
            }

            const norm = smsService.normalizeIndianMobile(mobile);
            const cleanMobile = norm.isValid ? norm.clean10 : String(mobile).replace(/\D/g, '').slice(-10);
            const cleanOtp = String(otp).trim();

            const record = otpStore.get(cleanMobile);

            if (!record) {
              return sendJson(res, 400, {
                success: false,
                error: 'No active OTP found for this mobile number. Please request an OTP first.',
              });
            }

            // Check Expiry
            if (Date.now() > record.expiresAt) {
              otpStore.delete(cleanMobile);
              return sendJson(res, 400, {
                success: false,
                error: 'OTP expired. Please request a new OTP.',
              });
            }

            // Verify SHA-256 Hash
            const computedHash = crypto.createHash('sha256').update(`${cleanMobile}:${cleanOtp}`).digest('hex');

            if (computedHash !== record.otpHash) {
              record.attempts = (record.attempts || 0) + 1;

              if (record.attempts >= 5) {
                otpStore.delete(cleanMobile);
                return sendJson(res, 403, {
                  success: false,
                  error: 'Too many incorrect attempts. Please request a new OTP.',
                });
              }

              return sendJson(res, 400, {
                success: false,
                error: 'Invalid OTP code. Please check and try again.',
              });
            }

            // Successfully Verified! Clear OTP from store immediately
            otpStore.delete(cleanMobile);
            console.log(`[OTP Server] Verified access for patient: ******${cleanMobile.slice(-4)}`);

            return sendJson(res, 200, {
              success: true,
              message: 'Patient access confirmed.',
              mobile: cleanMobile,
            });
          } catch (err) {
            if (err instanceof SyntaxError) {
              return sendJson(res, 400, {
                success: false,
                error: 'Invalid JSON request payload.',
              });
            }
            console.error('[OTP Server] verify-otp exception:', err);
            return sendJson(res, 500, {
              success: false,
              error: 'Server error during OTP verification.',
            });
          }
        }

        next();
      });
    },
  };
}
