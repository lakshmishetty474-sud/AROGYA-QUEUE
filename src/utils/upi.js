/**
 * UPI helpers - single source of truth for AROGYA QUEUE payments.
 *
 * Every payment surface builds its QR from buildUpiUri() so the encoded payload
 * is always a real upi:// intent. That is what makes a scan hand off to
 * PhonePe / Google Pay / Paytm instead of opening a web page.
 *
 * A QR carrying a plain https:// link just opens a browser tab; only a
 * upi://pay URI is dispatched to the installed UPI app.
 */

export const UPI_ID = 'arogyaqueue@oksbi';
export const UPI_PAYEE_NAME = 'AROGYA QUEUE';
export const UPI_CURRENCY = 'INR';

/**
 * Build a spec-compliant UPI intent URI.
 *
 * @param {object}  opts
 * @param {number} [opts.amount]     Amount in rupees (2dp)
 * @param {string} [opts.billId]     Bill / receipt reference, goes in the note
 * @param {string} [opts.note]       Overrides the default note entirely
 * @param {string} [opts.payeeName]  Overrides the default payee name
 * @returns {string} upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
 */
export function buildUpiUri({ amount = 0, billId = '', note, payeeName = UPI_PAYEE_NAME } = {}) {
  const numeric = Number(amount);
  const safeAmount = Number.isFinite(numeric) && numeric > 0 ? numeric.toFixed(2) : '';

  // Query values are encoded so the spaces in the payee name survive.
  const params = [
    ['pa', UPI_ID],
    ['pn', payeeName],
    ...(safeAmount ? [['am', safeAmount]] : []),
    ['cu', UPI_CURRENCY],
    ['tn', note || (billId ? `Hospital Bill ${billId}` : 'Hospital Payment')],
  ];

  return `upi://pay?${params.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')}`;
}

/**
 * Hand the intent to the device's default UPI app.
 * Returns false when there is no navigator to dispatch through.
 */
export function openUpiApp(uri) {
  if (typeof window === 'undefined') return false;
  try {
    window.location.href = uri;
    return true;
  } catch {
    return false;
  }
}

/** Copy a string to the clipboard, falling back for older browsers. */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export default { UPI_ID, UPI_PAYEE_NAME, UPI_CURRENCY, buildUpiUri, openUpiApp, copyToClipboard };