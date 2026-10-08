/**
 * Formatting utilities for timestamps, currency, masks, and status badges
 */

export function formatTime(dateInput = new Date()) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDate(dateInput = new Date()) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '--/--/----';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(amount = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function maskAadhar(aadhar = '') {
  const clean = String(aadhar).replace(/\s+/g, '');
  if (clean.length < 4) return 'XXXX XXXX ' + clean;
  const lastFour = clean.slice(-4);
  return `XXXX XXXX ${lastFour}`;
}

export function maskMobile(mobile = '') {
  const clean = String(mobile).replace(/\D/g, '');
  if (clean.length < 4) return 'XXXXXX' + clean;
  return clean.slice(0, 2) + 'XXXXXX' + clean.slice(-2);
}

export function generateToken(prefix = 'AQ-2026') {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
}
