/**
 * Project audit: finds currency symbols, animations, transitions and keyframes.
 * Usage: node scripts/audit.mjs [currency|animation|keyframes|motionjs|all]
 */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'scripts'].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (['.jsx', '.js', '.css'].includes(extname(name))) acc.push(full);
  }
  return acc;
}

const files = walk('src');
const mode = process.argv[2] || 'all';

if (mode === 'currency' || mode === 'all') {
  console.log('=== CURRENCY ===');
  let total = 0;
  for (const f of files) {
    const t = readFileSync(f, 'utf8');
    const rupee = t.split('\u20B9').length - 1;
    if (rupee) { console.log(`  ${String(rupee).padStart(4)}  ${f}`); total += rupee; }
  }
  console.log(`  total literal rupee sign in src: ${total}\n`);
}

if (mode === 'animation' || mode === 'all') {
  console.log('=== ANIMATION UTILITY CLASSES (per file) ===');
  const patterns = {
    'animate-*': /\banimate-[a-z-]+/g,
    'transition-*': /\btransition(?:-[a-z]+)?(?=["\s])/g,
    'duration-*': /\bduration-\d+/g,
    'ease-*': /\bease-(?:in|out|linear)/g,
    'delay-*': /\bdelay-\d+/g,
  };
  const tally = {};
  for (const f of files) {
    const t = readFileSync(f, 'utf8');
    const hits = {};
    for (const [name, re] of Object.entries(patterns)) {
      const n = (t.match(re) || []).length;
      if (n) { hits[name] = n; tally[name] = (tally[name] || 0) + n; }
    }
    if (Object.keys(hits).length) {
      console.log(`  ${relative('.', f).padEnd(50)} ${Object.entries(hits).map(([k, v]) => `${k}=${v}`).join(' ')}`);
    }
  }
  console.log('\n  totals: ' + Object.entries(tally).map(([k, v]) => `${k}=${v}`).join('  ') + '\n');
}

if (mode === 'keyframes' || mode === 'all') {
  console.log('=== CSS @keyframes / animation declarations ===');
  for (const f of files.filter((x) => x.endsWith('.css'))) {
    const t = readFileSync(f, 'utf8');
    const kf = (t.match(/@keyframes/g) || []).length;
    const an = (t.match(/animation\s*:/g) || []).length;
    if (kf || an) console.log(`  ${relative('.', f).padEnd(44)} keyframes=${kf} animation=${an}`);
  }
  console.log();
}

if (mode === 'motionjs' || mode === 'all') {
  console.log('=== JS-driven animation (rAF / setInterval) ===');
  for (const f of files) {
    const t = readFileSync(f, 'utf8');
    const n = (t.match(/requestAnimationFrame/g) || []).length;
    const si = (t.match(/setInterval/g) || []).length;
    const st = (t.match(/setTimeout/g) || []).length;
    if (n || si) console.log(`  ${relative('.', f).padEnd(44)} rAF=${n} setInterval=${si} setTimeout=${st}`);
  }
  console.log();
}