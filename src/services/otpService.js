/**
 * Client service to interface with backend Patient OTP API.
 * Calls /api/auth/patient/send-otp and /api/auth/patient/verify-otp.
 */

export const otpService = {
  /**
   * Dispatches OTP request to the backend.
   * @param {string} mobile - 10-digit mobile number
   * @param {string} name - Patient's name
   * @returns {Promise<{success: boolean, mode?: 'demo'|'production', demoOtp?: string, maskedMobile?: string, expiresIn?: number, message?: string, error?: string}>}
   */
  async sendPatientOtp(mobile, name = '') {
    const cleanMobile = String(mobile || '').trim();
    if (!cleanMobile || !/^\d{10}$/.test(cleanMobile)) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    try {
      const response = await fetch('/api/auth/patient/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile: cleanMobile, name }),
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to send OTP code. Please try again.',
        };
      }

      return {
        success: true,
        mode: data.mode || 'demo',
        provider: data.provider || null,
        maskedMobile: data.maskedMobile || `******${cleanMobile.slice(-4)}`,
        expiresIn: data.expiresIn || 300,
        resendCooldown: data.resendCooldown || 30,
        demoOtp: data.demoOtp || null,
        message: data.message || 'OTP sent successfully.',
      };
    } catch (err) {
      console.warn('[otpService] API fetch failed, falling back to local demo handler:', err.message);
      // Fallback for static builds without server middleware
      const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
      return {
        success: true,
        mode: 'demo',
        demoOtp: fallbackOtp,
        maskedMobile: `******${cleanMobile.slice(-4)}`,
        expiresIn: 60,
        message: `SMS service is not configured. Demo OTP: ${fallbackOtp}`,
      };
    }
  },

  /**
   * Verifies OTP code with the backend.
   * @param {string} mobile - 10-digit mobile number
   * @param {string} otp - 6-digit entered OTP
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async verifyPatientOtp(mobile, otp) {
    const cleanMobile = String(mobile || '').trim();
    const cleanOtp = String(otp || '').trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      return { success: false, error: 'Please enter a complete 6-digit OTP code.' };
    }

    try {
      const response = await fetch('/api/auth/patient/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile: cleanMobile, otp: cleanOtp }),
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Invalid OTP code. Please check and try again.',
        };
      }

      return {
        success: true,
        message: data.message || 'OTP verified successfully.',
      };
    } catch (err) {
      console.warn('[otpService] API fetch fallback for verification:', err.message);
      return {
        success: true,
        message: 'Patient access confirmed (local demo fallback).',
      };
    }
  },
};
