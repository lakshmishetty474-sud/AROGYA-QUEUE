/**
 * The quick-access header row cannot hold the label and the hint side by side
 * inside the 360px content width of the login card - the hint clipped by 43px.
 * Stack them and centre both, which also lines up with the centred button grid.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/pages/Auth.jsx';
const lines = readFileSync(file, 'utf8').split('\n');

const rowIdx = lines.findIndex((l) => l.includes('justify-between mb-3'));
if (rowIdx === -1) {
  console.log('  header row NOT FOUND');
  process.exit(1);
}

lines[rowIdx] = lines[rowIdx].replace(
  'className="flex items-center justify-between mb-3"',
  'className="flex flex-col items-center gap-1 mb-3 text-center"'
);

const hintIdx = lines.findIndex((l, i) => i > rowIdx && l.includes('Password autofilled'));
if (hintIdx !== -1) {
  lines[hintIdx] = lines[hintIdx].replace(' shrink-0', '');
}

console.log('  row   -> ' + lines[rowIdx].trim());
console.log('  label -> ' + (lines[rowIdx + 1] || '').trim());
console.log('  hint  -> ' + (lines[hintIdx] || '').trim());

writeFileSync(file, lines.join('\n'), 'utf8');
console.log('  done');