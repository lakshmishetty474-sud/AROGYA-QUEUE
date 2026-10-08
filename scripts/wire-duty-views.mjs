/**
 * Mounts the three duty views into their dashboards.
 *
 * Route mapping (those paths are aliases, not real pages):
 *   /hospital, /admin    -> redirect to /overview         -> DutyRosterPanel
 *   /patient             -> redirect to /patient-portal  -> DoctorAvailability
 *   /doctor              -> redirect to /doctor-desk     -> DoctorDutySelf
 *
 * Idempotent.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const log = [];

function addImport(file, importLine, marker) {
  let t = readFileSync(file, 'utf8');
  if (t.indexOf(marker) !== -1) { log.push(file + ': already wired'); return; }
  const lines = t.split('\n');
  let last = -1;
  lines.forEach((l, i) => { if (l.startsWith('import ')) last = i; });
  if (last === -1) { log.push(file + ': no imports found'); return; }
  lines.splice(last + 1, 0, importLine);
  writeFileSync(file, lines.join('\n'), 'utf8');
  log.push(file + ': import added');
}

function insertIntoReturn(file, marker, block) {
  let t = readFileSync(file, 'utf8');
  if (t.indexOf(marker) !== -1) { log.push(file + ': already mounted'); return; }
  const m = t.match(/\n(\s*)return \(\n\s*<div className="[^"]*"/);
  if (!m) { log.push(file + ': return anchor NOT FOUND'); return; }
  const indent = m[1];
  const at = t.indexOf(m[0]) + m[0].length;
  t = t.slice(0, at) + '\n' + indent + '  ' + block + '\n' + t.slice(at);
  writeFileSync(file, t, 'utf8');
  log.push(file + ': mounted');
}

addImport('src/pages/Overview.jsx',
  "import { DutyRosterPanel, OnDutyCountTile } from '../components/duty/DutyViews';",
  'DutyViews');
insertIntoReturn('src/pages/Overview.jsx', 'DutyRosterPanel', '<DutyRosterPanel />');

addImport('src/pages/PatientPortal.jsx',
  "import { DoctorAvailability } from '../components/duty/DutyViews';",
  'DutyViews');
insertIntoReturn('src/pages/PatientPortal.jsx', 'DoctorAvailability', '<DoctorAvailability />');

addImport('src/pages/DoctorDesk.jsx',
  "import { DoctorDutySelf } from '../components/duty/DutyViews';",
  'DutyViews');
insertIntoReturn('src/pages/DoctorDesk.jsx', 'DoctorDutySelf', '<DoctorDutySelf />');

console.log(log.map((l) => '  ' + l).join('\n'));