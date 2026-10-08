/**
 * Fixes bed allocation against the REAL beds schema.
 *
 * The brief specified beds(id, hospital, bed_no, type, status), but the live
 * table is camelCase:
 *
 *   hospitalId   not hospital
 *   bedNumber    not bed_no
 *   bedType      not type
 *   status       status          (this one matches)
 *
 * PostgREST does not error on a filter against a column that does not exist -
 * it simply matches nothing. Filtering on type/hospital would have failed
 * silently: every bed approval would report "no bed available" with no
 * explanation anywhere.
 *
 * Also: bed_requests.hospital was filled with the hospital DISPLAY NAME while
 * beds.hospitalId holds an ID, so the join could never match. The booking
 * insert now sends the ID.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const log = [];

{
  const file = 'src/services/approvalService.js';
  let t = readFileSync(file, 'utf8');
  const pairs = [
    ["'id, bed_no, type, hospital, status'", "'id, bedNumber, bedType, hospitalId, status'"],
    ["'type', bedType", "'bedType', bedType"],
    ["'hospital', hospital || ''", "'hospitalId', hospital || ''"],
    ["'bed_no', { ascending: true }", "'bedNumber', { ascending: true }"]
  ];
  for (const [a, b] of pairs) {
    if (t.indexOf(a) === -1) { log.push('MISS: ' + a); continue; }
    t = t.split(a).join(b);
    log.push('ok: ' + a);
  }
  writeFileSync(file, t, 'utf8');
}

{
  const file = 'src/components/receptionist/ReceptionistApprovalCenter.jsx';
  let t = readFileSync(file, 'utf8');
  if (t.indexOf('bed_no') !== -1) {
    t = t.split('bed_no').join('bedNumber');
    writeFileSync(file, t, 'utf8');
    log.push('component: bed_no -> bedNumber');
  } else log.push('component: no bed_no references');
}

{
  const file = 'src/context/AppContext.jsx';
  let t = readFileSync(file, 'utf8');
  const from = '      hospital: formData.hospitalName || newReservation.hospitalName,';
  const to = '      // beds.hospitalId holds an ID, so the queue must carry the ID - not the display name\n' +
             '      hospital: formData.hospitalId || newReservation.hospitalId || newReservation.hospitalName,';
  if (t.indexOf(from) !== -1) {
    t = t.replace(from, to);
    writeFileSync(file, t, 'utf8');
    log.push('AppContext: bed_requests.hospital now carries the hospital ID');
  } else log.push('AppContext: hospital field anchor MISS');
}

console.log(log.map((l) => '  ' + l).join('\n'));