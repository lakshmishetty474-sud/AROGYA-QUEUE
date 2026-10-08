/**
 * One-off wiring pass: favicon, title, footer copy, logo paths.
 * Kept in scripts/ so the changes are reviewable and repeatable.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const edits = [
  // ---- index.html -------------------------------------------------------
  ['index.html', [
    ['<link rel="icon" type="image/png" href="/logo.png" />',
     '<link rel="icon" type="image/png" href="/arogya-logo.png" />\n    <link rel="icon" type="image/png" sizes="512x512" href="/favicon.png" />'],
    ['<link rel="apple-touch-icon" href="/logo.png" />',
     '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />'],
    [/<title>[^<]*<\/title>/,
     '<title>AROGYA QUEUE - Hospital OS</title>'],
  ]],

  // ---- footer copy on the login screen ---------------------------------
  ['src/pages/Auth.jsx', [
    ['AROGYA QUEUE Hospital Operating System • Certified for Municipal Healthcare Delivery',
     'AROGYA QUEUE by Lakshmi & Sushmitha S K'],
  ]],

  // ---- logo paths ------------------------------------------------------
  ['src/components/auth/LoginShell.jsx', [
    ["const LOGO_SRC = '/logo.png';", "const LOGO_SRC = '/arogya-logo.png';"],
  ]],
  ['src/components/auth/loginTheme.css', [
    ["background-image: url('/logo.png');", "background-image: url('/arogya-logo.png');"],
    ['background-size: 200px 200px;', 'background-size: 300px 300px;'],
  ]],
  ['src/components/layout/Sidebar.jsx', [
    ['src="/logo.png"', 'src="/arogya-logo.png"'],
    ['the real /logo.png when present', 'the real logo when present'],
  ]],
  ['src/utils/pdfBrand.js', [
    ["const LOGO_SRC = '/assets/arogya-logo.png';", "const LOGO_SRC = '/arogya-logo.png';"],
  ]],
];

let changed = 0;
for (const [file, pairs] of edits) {
  let text = readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (from instanceof RegExp) {
      if (!from.test(text)) {
        console.log(`  MISS  ${file}  /${from.source.slice(0, 50)}/`);
        continue;
      }
      text = text.replace(from, to);
    } else {
      if (!text.includes(from)) {
        console.log(`  MISS  ${file}  >${from.slice(0, 60)}<`);
        continue;
      }
      text = text.split(from).join(to);
    }
    console.log(`  ok    ${file}`);
    changed++;
  }
  writeFileSync(file, text, 'utf8');
}
console.log(`\n${changed} replacement(s) applied.`);