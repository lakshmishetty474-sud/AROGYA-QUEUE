/**
 * pdfBrand.js
 * ---------------------------------------------------------------------------
 * Branding for every generated PDF.
 *
 * WHY THIS IS DRAWN IN VECTOR RATHER THAN ONLY EMBEDDING AN IMAGE
 * ---------------------------------------------------------------
 * jsPDF's addImage() needs real image bytes. The brand mark has to work today,
 * whether or not a logo file is present on disk, so this module takes the
 * robust route:
 *
 *   1. If public/assets/arogya-logo.png loads -> embed that bitmap.
 *   2. Otherwise -> draw the emblem with jsPDF vector primitives
 *      (rounded square, medical cross, wordmark). No file needed.
 *
 * The vector tier is not a downgrade you would notice on paper: it is crisp at
 * any zoom and prints identically at any size.
 *
 * Usage is synchronous and cheap - the logo probe is cached after the first
 * attempt, so generating a batch of reports does not re-request the image.
 */

/* Deliberately NOT a static ES import: a missing file would fail the
   entire build. The path is resolved at runtime and a load error is
   treated as a normal outcome, falling back to the vector emblem. */
const LOGO_SRC = '/arogya-logo.png';

const BRAND_INK = [13, 84, 136];      // deep teal, matches the mark
const BRAND_TEAL = [13, 148, 136];
const BRAND_INDIGO = [79, 70, 229];

/* Resolved once per session. */
let cachedLogo = null;
let probed = false;

function loadImage(src) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Resolve the logo bitmap, or null to fall back to the vector emblem.
 * Safe to call repeatedly - the promise is cached.
 */
export function resolveLogo() {
  if (!probed) {
    probed = true;
    cachedLogo = loadImage(LOGO_SRC);
  }
  return cachedLogo;
}

/**
 * Draw the AROGYA QUEUE lockup into the top-left of the current jsPDF doc.
 * Falls back to the vector emblem automatically when no bitmap is available.
 */
export function drawBrand(doc, { x = 40, y = 30, size = 30 } = {}) {
  const r = size / 2;

  const drawVector = () => {
    doc.saveGraphicsState();

    // rounded-square emblem
    doc.setFillColor(...BRAND_TEAL);
    doc.roundedRect(x, y, size, size, 8, 8, 'F');

    // medical cross
    doc.setFillColor(255, 255, 255);
    const t = size * 0.17;
    const c = size / 2;
    doc.rect(x + c - t / 2, y + c - size * 0.30, t, size * 0.60, 'F');
    doc.rect(x + c - size * 0.30, y + c - t / 2, size * 0.60, t, 'F');

    doc.setTextColor(...BRAND_INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size * 0.42);
    doc.text('AROGYA', x + size + 10, y + size * 0.44);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size * 0.26);
    doc.setTextColor(...BRAND_TEAL);
    doc.text('Q U E U E', x + size + 10, y + size * 0.78);

    doc.setFontSize(size * 0.17);
    doc.setTextColor(120, 138, 150);
    doc.text('Hospital OS', x + size + 10, y + size * 1.02);

    doc.restoreGraphicsState();
  };

  return resolveLogo().then((img) => {
    if (img && img.width) {
      try {
        const ratio = img.height / img.width;
        doc.addImage(img, 'PNG', x, y, size, size * ratio, undefined, 'FAST');
        // wordmark beside the bitmap
        doc.setTextColor(...BRAND_INK);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text('AROGYA', x + size + 10, y + 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...BRAND_TEAL);
        doc.text('Q U E U E', x + size + 10, y + 27);
        doc.setFontSize(6.5);
        doc.setTextColor(120, 138, 150);
        doc.text('Hospital OS', x + size + 10, y + 38);
        return true;
      } catch {
        /* fall through to vector */
      }
    }
    drawVector();
    return false;
  });
}

/**
 * Rounded rectangle for jsPDF.
 *
 * Delegates to jsPDF's own doc.roundedRect - an earlier hand-rolled version
 * called doc.quadraticCurveTo, which jsPDF does not implement, so it threw on
 * every single report. Do not reimplement this; use the native method.
 */
export function roundedRect(doc, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  doc.roundedRect(x, y, w, h, rr, rr, 'F');
}

export { BRAND_INK, BRAND_TEAL, BRAND_INDIGO };
