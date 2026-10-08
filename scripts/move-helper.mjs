/**
 * Moves the pushSupabaseApproval helper ABOVE the booking callbacks.
 *
 * It was inserted just before "// Cancel Appointment", which is after
 * bookAppointment. Since bookAppointment names it in its dependency array, that
 * reference was still in the temporal dead zone and threw
 * "Cannot access pushSupabaseApproval before initialization".
 *
 * A const declaration is only initialised when execution reaches it, so the
 * helper must sit above every callback whose dependency list mentions it.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/context/AppContext.jsx';
const lines = readFileSync(file, 'utf8').split('\n');

const start = lines.findIndex((l) => l.indexOf('const pushSupabaseApproval = useCallback') !== -1);
if (start === -1) { console.log('  helper not found'); process.exit(1); }

let from = start;
while (from > 0 && /^\s*(\/\*|\*|\/\/)/.test(lines[from - 1])) from--;

let to = start;
while (to < lines.length && lines[to].indexOf('pushSupabaseApproval]);') === -1) to++;
if (lines[to].indexOf('pushSupabaseApproval]);') === -1) {
  console.log('  end of helper not found');
  process.exit(1);
}

const block = lines.slice(from, to + 1);
console.log('  moving L' + (from + 1) + '-L' + (to + 1) + ' (' + block.length + ' lines)');

lines.splice(from, block.length + 1);

const target = lines.findIndex((l) => l.indexOf('const bookAppointment = useCallback') !== -1);
if (target === -1) { console.log('  bookAppointment not found'); process.exit(1); }

lines.splice(target, 0, ...block, '');
console.log('  re-inserted above bookAppointment at L' + (target + 1));

writeFileSync(file, lines.join('\n'), 'utf8');