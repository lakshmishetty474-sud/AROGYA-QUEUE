/**
 * Restores source order in AppContext.
 *
 * A previous pass moved the pushSupabaseApproval helper by scanning for the
 * first line ending in "pushSupabaseApproval]);" - which matched a dependency
 * array 1200 lines later, not the helper's own closer. The helper ended up in
 * the right place (before every callback that names it) but bookAppointment
 * was left stranded in the middle of the bed-reservation block.
 *
 * This moves bookAppointment, with its leading comment, to sit directly after
 * the helper so the file reads top-down again.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/context/AppContext.jsx';
const lines = readFileSync(file, 'utf8').split('\n');
const idxOf = (n) => lines.findIndex((l) => l.indexOf(n) !== -1);

const baDecl = idxOf('const bookAppointment = useCallback');
if (baDecl === -1) { console.log('  bookAppointment not found'); process.exit(1); }

let baFrom = baDecl;
while (baFrom > 0 && /^\s*(\/\/|\/\*|\*)/.test(lines[baFrom - 1])) baFrom--;

let baTo = baDecl;
while (baTo < lines.length && lines[baTo].indexOf('pushSupabaseApproval]);') === -1) baTo++;
if (lines[baTo].indexOf('pushSupabaseApproval]);') === -1) {
  console.log('  closer not found');
  process.exit(1);
}

const baBlock = lines.slice(baFrom, baTo + 1);
console.log('  bookAppointment: L' + (baFrom + 1) + '-L' + (baTo + 1) + ' (' + baBlock.length + ' lines)');

const findInsert = () => {
  const helperDecl = idxOf('const pushSupabaseApproval = useCallback');
  let helperEnd = helperDecl;
  while (helperEnd < lines.length && lines[helperEnd].indexOf('pushSupabaseApproval]);') === -1) helperEnd++;
  for (let i = helperEnd + 1; i < lines.length; i++) {
    if (/const [a-zA-Z][a-zA-Z0-9_]* = (useCallback|useMemo)\(/.test(lines[i])) {
      let at = i;
      while (at > 0 && /^\s*(\/\/|\/\*|\*)/.test(lines[at - 1])) at--;
      return at;
    }
  }
  return -1;
};

let at = findInsert();
console.log('  insertion point L' + (at + 1) + ': ' + String(lines[at]).trim().slice(0, 55));

lines.splice(baFrom, baBlock.length);
at = findInsert();
lines.splice(at, 0, ...baBlock, '');
console.log('  re-inserted at L' + (at + 1));

writeFileSync(file, lines.join('\n'), 'utf8');