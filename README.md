# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

## Real SMS OTP Service Setup (Patient Portal Authentication)

Arogya Queue includes a production-ready SMS OTP service supporting **MSG91** (recommended for India), **Twilio**, and **Fast2SMS**.

### 1. Choose your SMS Provider & Obtain Credentials

#### Option A: MSG91 (India)
1. Register at [msg91.com](https://msg91.com).
2. Go to **Settings → API Keys** and generate an **Auth Key**.
3. Under **OTP Templates**, create or approve an OTP template (e.g. `"Your Arogya verification code is ##OTP##."`) and copy the **Template ID**.

#### Option B: Twilio
1. Register at [twilio.com](https://twilio.com).
2. Retrieve your **Account SID** and **Auth Token** from your Twilio Console.
3. Configure your active **Twilio Phone Number** with SMS capabilities.

#### Option C: Fast2SMS
1. Register at [fast2sms.com](https://fast2sms.com).
2. Copy your **Dev API Authorization Key** from your Fast2SMS profile.

---

### 2. Configure Environment Variables

Open `.env` in the root of your project and configure your provider:

```env
# Choose provider: msg91 | twilio | fast2sms
SMS_PROVIDER=msg91

# If using MSG91:
MSG91_AUTH_KEY=your_msg91_auth_key_here
MSG91_TEMPLATE_ID=your_template_id_here
MSG91_SENDER_ID=AROGYA

# If using Twilio:
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# If using Fast2SMS:
FAST2SMS_API_KEY=your_fast2sms_api_key
```

---

### 3. Verification & Development Fallback

- **Production Mode:** When credentials are configured in `.env`, entering an Indian 10-digit mobile number sends a real 6-digit SMS OTP via your provider. The code expires in 5 minutes with a 30-second resend cooldown.
- **Demo Mode:** When credentials are left blank, the application automatically runs in safe **DEVELOPMENT / DEMO MODE**, clearly stating that SMS service is not configured and presenting a demo verification code for local testing without crashing.

