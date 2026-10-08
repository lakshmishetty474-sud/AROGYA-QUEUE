/**
 * Production SMS Delivery Service for Arogya Queue.
 *
 * Responsibilities:
 * - Normalizes Indian phone numbers (+91, 91, or 10-digit formats).
 * - Dispatches SMS through configured provider: MSG91 (primary for India), Twilio, Fast2SMS.
 * - Handles provider errors, network timeouts, and balance issues safely.
 * - Performs safe operational logging without exposing OTPs or private keys.
 */

export const smsService = {
  /**
   * Validates and normalizes Indian mobile numbers.
   * Accepts: 10-digit number (e.g. 9876543210), with +91 or 91 prefix, or leading 0.
   * @param {string|number} rawMobile
   * @returns {{ isValid: boolean, clean10: string, formattedWithCountry: string, error?: string }}
   */
  normalizeIndianMobile(rawMobile) {
    if (!rawMobile) {
      return { isValid: false, clean10: '', formattedWithCountry: '', error: 'Mobile number is required.' };
    }

    // Strip all non-digit characters
    const digits = String(rawMobile).replace(/\D/g, '');

    let clean10 = '';
    if (digits.length === 10) {
      clean10 = digits;
    } else if (digits.length === 11 && digits.startsWith('0')) {
      clean10 = digits.slice(1);
    } else if (digits.length === 12 && digits.startsWith('91')) {
      clean10 = digits.slice(2);
    } else {
      return {
        isValid: false,
        clean10: '',
        formattedWithCountry: '',
        error: 'Please enter a valid 10-digit Indian mobile number.',
      };
    }

    // Indian mobile numbers must begin with 6, 7, 8, or 9
    if (!/^[6-9]\d{9}$/.test(clean10)) {
      return {
        isValid: false,
        clean10: '',
        formattedWithCountry: '',
        error: 'Indian mobile numbers must start with 6, 7, 8, or 9.',
      };
    }

    return {
      isValid: true,
      clean10,
      formattedWithCountry: `91${clean10}`,
      formattedWithPlus: `+91${clean10}`,
    };
  },

  /**
   * Detects which SMS provider is configured from environment variables.
   * @param {object} env - Environment dictionary
   * @returns {'msg91'|'twilio'|'fast2sms'|null}
   */
  detectProvider(env = {}) {
    const explicit = (env.SMS_PROVIDER || '').trim().toLowerCase();

    if (explicit === 'msg91' || env.MSG91_AUTH_KEY) {
      return 'msg91';
    }
    if (explicit === 'twilio' || (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN)) {
      return 'twilio';
    }
    if (explicit === 'fast2sms' || env.FAST2SMS_API_KEY) {
      return 'fast2sms';
    }
    return null;
  },

  /**
   * Dispatches OTP SMS through the configured provider to the entered mobile number.
   *
   * @param {string} mobile10 - Clean 10-digit mobile number
   * @param {string} otp - 6-digit verification code
   * @param {object} env - Server environment variables
   * @returns {Promise<{ success: boolean, provider?: string, messageId?: string, isConfigured: boolean, error?: string }>}
   */
  async sendOtpSMS(mobile10, otp, env = {}) {
    const norm = this.normalizeIndianMobile(mobile10);
    if (!norm.isValid) {
      return { success: false, isConfigured: true, error: norm.error };
    }

    const provider = this.detectProvider(env);
    const maskedPhone = `******${norm.clean10.slice(-4)}`;

    if (!provider) {
      return {
        success: false,
        isConfigured: false,
        error: 'No SMS provider configured. Set MSG91, Twilio, or Fast2SMS credentials in .env.',
      };
    }

    const messageText = `Your Arogya Queue verification code is ${otp}. Valid for 5 minutes. Please do not share this code with anyone.`;

    try {
      // ==========================================
      // 1. MSG91 (Leading SMS Gateway in India)
      // ==========================================
      if (provider === 'msg91') {
        const authKey = env.MSG91_AUTH_KEY;
        const templateId = env.MSG91_TEMPLATE_ID;
        const senderId = env.MSG91_SENDER_ID || 'AROGYA';

        if (!authKey) {
          return { success: false, isConfigured: false, error: 'MSG91_AUTH_KEY is not configured.' };
        }

        // MSG91 v5 OTP API
        const msg91Url = new URL('https://control.msg91.com/api/v5/otp');
        msg91Url.searchParams.append('template_id', templateId || '');
        msg91Url.searchParams.append('mobile', norm.formattedWithCountry);
        msg91Url.searchParams.append('authkey', authKey);
        msg91Url.searchParams.append('otp', otp);
        if (senderId) {
          msg91Url.searchParams.append('sender', senderId);
        }

        const response = await fetch(msg91Url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && (data.type === 'success' || data.message?.toLowerCase().includes('success'))) {
          console.log(`[SMS Gateway] Dispatched OTP SMS to ${maskedPhone} via MSG91 (Status: Success)`);
          return { success: true, provider: 'MSG91', messageId: data.request_id || 'OK', isConfigured: true };
        } else {
          console.warn(`[SMS Gateway] MSG91 returned failure for ${maskedPhone}:`, data.message || response.statusText);
          return {
            success: false,
            provider: 'MSG91',
            isConfigured: true,
            error: data.message || 'Unable to deliver SMS through MSG91. Please verify template and account balance.',
          };
        }
      }

      // ==========================================
      // 2. TWILIO
      // ==========================================
      if (provider === 'twilio') {
        const accountSid = env.TWILIO_ACCOUNT_SID;
        const authToken = env.TWILIO_AUTH_TOKEN;
        const fromNumber = env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
          return {
            success: false,
            isConfigured: false,
            error: 'Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are incomplete.',
          };
        }

        const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const formParams = new URLSearchParams({
          To: norm.formattedWithPlus,
          From: fromNumber,
          Body: messageText,
        });

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${basicAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formParams.toString(),
          }
        );

        const data = await response.json().catch(() => ({}));

        if (response.ok && !data.error_code) {
          console.log(`[SMS Gateway] Dispatched OTP SMS to ${maskedPhone} via Twilio (SID: ${data.sid || 'OK'})`);
          return { success: true, provider: 'Twilio', messageId: data.sid, isConfigured: true };
        } else {
          console.warn(`[SMS Gateway] Twilio returned failure for ${maskedPhone}:`, data.message || response.statusText);
          return {
            success: false,
            provider: 'Twilio',
            isConfigured: true,
            error: data.message || 'Twilio SMS dispatch failed. Please check credentials and account balance.',
          };
        }
      }

      // ==========================================
      // 3. FAST2SMS (India Bulk SMS / OTP)
      // ==========================================
      if (provider === 'fast2sms') {
        const apiKey = env.FAST2SMS_API_KEY;
        if (!apiKey) {
          return { success: false, isConfigured: false, error: 'FAST2SMS_API_KEY is not configured.' };
        }

        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: norm.clean10,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && (data.return === true || data.status_code === 200)) {
          console.log(`[SMS Gateway] Dispatched OTP SMS to ${maskedPhone} via Fast2SMS (Status: Success)`);
          return { success: true, provider: 'Fast2SMS', messageId: data.request_id || 'OK', isConfigured: true };
        } else {
          console.warn(`[SMS Gateway] Fast2SMS returned failure for ${maskedPhone}:`, data.message || response.statusText);
          return {
            success: false,
            provider: 'Fast2SMS',
            isConfigured: true,
            error: data.message?.[0] || data.message || 'Fast2SMS dispatch failed.',
          };
        }
      }

      return { success: false, isConfigured: false, error: 'Unsupported SMS provider.' };
    } catch (netErr) {
      console.error(`[SMS Gateway] Network exception while sending SMS to ${maskedPhone}:`, netErr.message);
      return {
        success: false,
        isConfigured: true,
        provider,
        error: 'Network error communicating with SMS gateway. Please try again.',
      };
    }
  },
};
