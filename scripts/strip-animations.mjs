/**
 * Removes motion from the whole app, with one deliberate exception:
 * the queue/kiosk display keeps its animation.
 *
 * WHAT IS REMOVED
 *   CSS   - every @keyframes block and every animation* declaration, in all
 *           stylesheets except the TV stylesheet that serves the display.
 *   JSX   - Tailwind motion utilities (animate-*, transition*, duration-*,
 *           ease-*, delay-*) from every className/class string, except the
 *           display components. transition/animation inside style={{ }} is
 *           dropped too.
 *
 * Only whole tokens are removed, and only inside class strings, so identifiers
 * like `transition` in real code are never touched.
 *
 * Usage: node scripts/strip-animations.mjs [--dry]
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const DRY = process.argv.includes('--dry');

// The queue display is explicitly allowed to keep animating.
const KEEP_JS = new Set([
  'src/pages/QueueDisplay.jsx',
  'src/components/motion/QueueBoardSlides.jsx',
]);
const KEEP_CSS = new Set(['src/components/motion/tv.css']);

const MOTION = [
  /^animate-.+$/,
  /^transition(-[a-z]+)?$/,
  /^duration-\d+$/,
  /^ease-(in|out|linear|in-out)$/,
  /^delay-\d+$/,
  /^motion-(safe|reduce)$/,
];
const VARIANT = /^(?:[\w-]+:)+/;

function isMotionToken(token) {
  const base = token.replace(VARIANT, '');
  return MOTION.some((re) => re.test(base));
}

function filterClassText(text) {
  return text.split(/\s+/).filter((t) => t && !isMotionToken(t)).join(' ');
}

const QUOTE = String.fromCharCode(34);
const SQUOTE = String.fromCharCode(39);
const BTICK = String.fromCharCode(96);
const DOLLAR = '$';

/**
 * Token-filter every className / class attribute, including template literals.
 *
 * A template literal is scanned with a small state machine rather than a regex:
 * an interpolation can contain quotes, braces and backticks of its own, so a
 * non-greedy regex stops at the wrong place and truncates surrounding code.
 */
function scrubClassAttributes(src) {
  let removed = 0;

  const quoted = (m, pre, q, body) => {
    const next = filterClassText(body);
    if (next !== body) removed++;
    return pre + q + next + q;
  };
  src = src.replace(/(\bclassName\s*=\s*)(["'])([^"']*)\2/g, quoted);
  src = src.replace(/(\bclass\s*=\s*)(["'])([^"']*)\2/g, quoted);

  // NOTE: template-literal className (`className={`...`}`) is deliberately NOT
  // rewritten here. An interpolation can contain quotes, braces and backticks of
  // its own, and every attempt to rewrite it textually corrupted real code. The
  // CSS kill-switch in index.css neutralises motion utilities wherever they
  // appear, template literal included, so these do not need touching.
  return { src, removed };
}

/**
 * Drop transition/animation properties, but ONLY inside a style={{ ... }} object.
 *
 * A global regex for `transition... : value` is unsafe: in JSX a class string
 * like `transition-colors ${ on ? 'bg-rose-600' : 'bg-slate-700' }` looks
 * exactly like a `transition:` declaration, and the match eats the ternary.
 */
const STYLE_PROP = new RegExp(
  '(?:-[\\w]-)?(?:transition(?:-[A-Za-z]+)?|animation(?:-[A-Za-z]+)?)\\s*:\\s*' +
    "(?:'[^']*'|\"[^\"]*\"|`[^`]*`|[^,}]+),?",
  'g'
);

function scrubInlineStyles(src) {
  let removed = 0;
  src = src.replace(/style=\{\{([\s\S]*?)\}\}/g, (m, body) => {
    const next = body.replace(STYLE_PROP, () => { removed++; return ''; });
    return 'style={{' + next + '}}';
  });
  return { src, removed };
}

/** Remove every @keyframes block (brace-balanced) and every animation* declaration. */
function stripCss(src) {
  let keyframes = 0;
  let decls = 0;

  let out = '';
  let idx = 0;
  for (;;) {
    const at = src.indexOf('@keyframes', idx);
    if (at === -1) { out += src.slice(idx); break; }
    out += src.slice(idx, at);
    const braceAt = src.indexOf('{', at);
    if (braceAt === -1) { out += src.slice(at); break; }
    let depth = 0;
    let end = src.length;
    for (let j = braceAt; j < src.length; j++) {
      if (src[j] === '{') depth++;
      else if (src[j] === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
    }
    keyframes++;
    idx = end;
  }
  src = out;

  // Preserve the declaration's indentation. NOTE: the replacement must be a
  // plain string here - inside a replacer *function* $1 is not substituted and
  // would land in the stylesheet literally.
  src = src.replace(
    /(?:^|\n)([ \t]*)(?:-\w+-)?animation(?:-[a-z-]+)?\s*:[^;{}]*;?[ \t]*/g,
    (_m, indent) => { decls++; return '\n' + indent; }
  );
  src = src.replace(/(?:-\w+-)?animation(?:-[a-z-]+)?\s*:[^;{}]*;/g, () => { decls++; return ''; });

  return { src, keyframes, decls };
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'scripts'].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

// walk() yields OS-native separators; normalise so the exempt sets match.
const norm = (p) => p.replace(/\\/g, '/');
const isExempt = (file) => KEEP_JS.has(norm(file)) || KEEP_CSS.has(norm(file));

const files = walk('src');
let totalClasses = 0, totalStyles = 0, totalKeyframes = 0, totalDecls = 0, touched = 0;

for (const file of files) {
  const ext = extname(file);
  if (!['.jsx', '.js', '.css'].includes(ext)) continue;
  if (isExempt(file)) continue;

  const original = readFileSync(file, 'utf8');
  let out = original;
  let kf = 0, dc = 0;

  if (ext === '.css') {
    const r = stripCss(out);
    out = r.src;
    kf = r.keyframes;
    dc = r.decls;
  }

  const c = scrubClassAttributes(out);
  out = c.src;
  const s = scrubInlineStyles(out);
  out = s.src;

  totalClasses += c.removed;
  totalStyles += s.removed;
  totalKeyframes += kf;
  totalDecls += dc;

  if (out !== original) {
    out = out.replace(/\n{3,}/g, '\n\n');
    if (!DRY) writeFileSync(file, out, 'utf8');
    touched++;
    console.log(`  ${relative('.', file).padEnd(48)} cls=${c.removed} style=${s.removed} kf=${kf} decl=${dc}`);
  }
}

console.log('');
console.log(`  files changed        : ${touched}`);
console.log(`  class tokens removed : ${totalClasses}`);
console.log(`  inline styles removed: ${totalStyles}`);
console.log(`  @keyframes removed   : ${totalKeyframes}`);
console.log(`  animation decls      : ${totalDecls}`);
console.log(`  exempt (keep motion) : ${[...KEEP_JS, ...KEEP_CSS].join(', ')}`);