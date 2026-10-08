/**
 * Finishes the Quick Role Access polish:
 *   1. heading row gets breathing room so the label stops wrapping mid-parenthesis
 *   2. removes the duplicate footer (LoginShell already renders it)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/pages/Auth.jsx';
const lines = readFileSync(file, 'utf8').split('\n');
const log = [];

// ---- 1. heading row -------------------------------------------------------
const rowIdx = lines.findIndex((l) => l.includes('justify-between mb-3'));
if (rowIdx === -1) {
  log.push('heading row: NOT FOUND');
} else {
  lines[rowIdx] = lines[rowIdx].replace('justify-between mb-3', 'justify-between gap-3 mb-3');
  log.push(`heading row: L${rowIdx + 1} -> gap added`);

  // the label text sits on its own line; the className is on the line above
  const textIdx = lines.findIndex((l) => l.includes('QUICK ROLE ACCESS PREVIEW'));
  const pIdx = textIdx - 1;
  if (pIdx > 0 && lines[pIdx].includes('tracking-widest')) {
    lines[pIdx] = lines[pIdx]
      .replace('tracking-widest', 'tracking-[0.06em]')
      .replace('flex items-center gap-1"', 'flex items-center gap-1 whitespace-nowrap"');
    log.push(`label: L${pIdx + 1} -> tracking relaxed + nowrap`);
  } else {
    log.push(`label: NOT FOUND at L${pIdx + 1} -> ${String(lines[pIdx]).slice(0, 70)}`);
  }
}

// ---- 2. duplicate footer --------------------------------------------------
const fStart = lines.findIndex((l) => l.includes('{/* Footer */}'));
if (fStart !== -1) {
  // walk forward to the closing </footer>
  let fEnd = fStart;
  while (fEnd < lines.length && !lines[fEnd].includes('</footer>')) fEnd++;
  // include one trailing blank line if present
  let cut = fEnd + 1;
  if (cut < lines.length && lines[cut].trim() === '') cut++;
  lines.splice(fStart, cut - fStart);
  log.push(`footer: removed L${fStart + 1}-${cut} (LoginShell owns it now)`);
} else {
  log.push('footer: NOT FOUND (may already be removed)');
}

writeFileSync(file, lines.join('\n'), 'utf8');
console.log(log.map((l) => '  ' + l).join('\n'));
console.log('  total lines now: ' + lines.length);