/**
 * Aligns bed allocation with the statuses the live beds table actually uses.
 *
 * The beds table has no 'Free' status - it has Available, Cleaning, Maintenance,
 * Occupied and Reserved. Blocking on 'Free' alone would match nothing, so every
 * bed approval would report "no bed available". Both spellings are accepted so
 * the queue works against either dataset.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/services/approvalService.js';
let t = readFileSync(file, 'utf8');
const Q = String.fromCharCode(39);
const log = [];

const FREE_IN = '.in(' + Q + 'status' + Q + ', FREE_BED_STATUSES)';
const STALE_EQ = '.eq(' + Q + 'status' + Q + ', ' + Q + 'Free' + Q + ')';

if (t.indexOf('FREE_BED_STATUSES') === -1) {
  const anchor = 'const TABLES = {';
  const block =
    '/**\n' +
    ' * Statuses that count as an allocatable bed.\n' +
    ' *\n' +
    " * The live beds table does not use 'Free' - it uses Available / Cleaning /\n" +
    " * Maintenance / Occupied / Reserved. Blocking on 'Free' alone would silently\n" +
    ' * match nothing, so a bed approval would report "no bed available" every\n' +
    ' * time. Both spellings are accepted so the queue works against either dataset.\n' +
    ' */\n' +
    "const FREE_BED_STATUSES = ['Free', 'Available'];\n\n";
  t = t.replace(anchor, block + anchor);
  log.push('FREE_BED_STATUSES declared');
}

const before = t.split(STALE_EQ).length - 1;
t = t.split(STALE_EQ).join(FREE_IN);
log.push('replaced ' + before + ' stale eq(status,Free) with in(FREE_BED_STATUSES)');

if (t.indexOf('export { FREE_BED_STATUSES }') === -1) {
  t = t.replace('export default {', 'export { FREE_BED_STATUSES };\n\nexport default {\n  FREE_BED_STATUSES,');
  log.push('exported');
}

writeFileSync(file, t, 'utf8');
console.log(log.map((l) => '  ' + l).join('\n'));