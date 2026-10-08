/**
 * Rasterises public/arogya-logo.svg into the PNG names the app expects.
 * Run with:  node scripts/svg2png.mjs
 * Re-run any time the SVG is tweaked.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('public/arogya-logo.svg');

const full = readFileSync('public/arogya-logo.svg');
const mark = readFileSync('public/arogya-mark.svg');

// full lockup: used for the navbar, favicon and brand tile
const square = [
  ['public/arogya-logo.png', 1024],
  ['public/logo.png', 1024],
  ['public/favicon.png', 512],
  ['public/apple-touch-icon.png', 180],
];
for (const [out, size] of square) {
  const buf = await sharp(full, { density: 384 })
    .resize(size, size, { fit: 'contain', background: '#ffffff' })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(out, buf);
  console.log(`  ${out.padEnd(30)} ${String(size).padStart(4)}px  ${(buf.length / 1024).toFixed(1)} KB`);
}

// emblem only, transparent: used for the tiled login watermark so the repeat
// pattern does not spell the wordmark over and over
for (const size of [300, 512]) {
  const out = `public/arogya-mark-${size}.png`;
  const buf = await sharp(mark, { density: 384 })
    .resize(size, size, { fit: 'inside' })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(out, buf);
  console.log(`  ${out.padEnd(30)} ${String(size).padStart(4)}px  ${(buf.length / 1024).toFixed(1)} KB`);
}