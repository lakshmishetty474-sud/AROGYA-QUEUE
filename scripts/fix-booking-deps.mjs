/**
 * Adds pushSupabaseApproval to the dependency arrays of the three booking
 * callbacks that now call it.
 *
 * A previous pass reported "already patched" for all three, which was wrong:
 * it searched the whole file for the patched string and matched an unrelated
 * occurrence. This pass locates each function by name and patches only the
 * dependency line that closes it.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/context/AppContext.jsx';
const lines = readFileSync(file, 'utf8').split('\n');

const TARGETS = ['bookAppointment', 'requestBedReservation', 'requestAmbulance'];
const log = [];

for (const fn of TARGETS) {
  const decl = lines.findIndex((l) => l.includes('const ' + fn + ' = useCallback'));
  if (decl === -1) { log.push(fn + ': declaration not found'); continue; }

  let end = -1;
  for (let i = decl + 1; i < lines.length; i++) {
    if (/^ {2}\}, \[/.test(lines[i])) { end = i; break; }
  }
  if (end === -1) { log.push(fn + ': dep array closer not found'); continue; }

  const cur = lines[end];
  if (cur.indexOf('pushSupabaseApproval') !== -1) {
    log.push(fn + ': already patched (L' + (end + 1) + ')');
    continue;
  }

  lines[end] = cur.replace(']);', ', pushSupabaseApproval]);');
  log.push(fn + ': L' + (end + 1) + ' -> ' + lines[end].trim());
}

writeFileSync(file, lines.join('\n'), 'utf8');
console.log(log.map((l) => '  ' + l).join('\n'));