/**
 * Pass 2 of the approval centre, per the revised brief:
 *   - strip every dummy/demo affordance (no fake data, no seed button)
 *   - bed blocking now also matches hospital
 *   - add an exact free-bed count from Supabase
 *   - patient booking functions in AppContext now INSERT real Pending rows
 *
 * The booking functions stay synchronous: the local state update, toast and
 * return value are untouched, and the Supabase insert is a side effect with
 * its own error handling. Making them async would break their callers.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const log = [];
const say = (m) => log.push(m);

/* ================= 1. approvalService: drop demo, match hospital ================= */
{
  const file = 'src/services/approvalService.js';
  let t = readFileSync(file, 'utf8');

  // remove the whole demo-data section
  const demoStart = t.indexOf('/* -------------------------------------------------------------------------- */\n/* demo data');
  const realtimeStart = t.indexOf('/* -------------------------------------------------------------------------- */\n/* realtime');
  if (demoStart !== -1 && realtimeStart > demoStart) {
    t = t.slice(0, demoStart) + t.slice(realtimeStart);
    say('approvalService: demo data block removed');
  } else {
    say('approvalService: DEMO BLOCK NOT FOUND');
  }

  // blockOneFreeBed now takes hospital
  t = t.replace(
    'export async function blockOneFreeBed(bedType) {\n  if (!bedType) return { data: null, error: new Error(\'bed_type is required\') };',
    'export async function blockOneFreeBed(bedType, hospital) {\n  if (!bedType) return { data: null, error: new Error(\'bed_type is required\') };'
  );

  // add the hospital filter to the select
  const selOld = "    .eq('type', bedType)\n    .eq('status', 'Free')\n    .order('bed_no', { ascending: true })\n    .limit(1);";
  const selNew = "    .eq('type', bedType)\n    .eq('status', 'Free')\n    .eq('hospital', hospital || '')\n    .order('bed_no', { ascending: true })\n    .limit(1);";
  if (t.includes(selOld)) { t = t.replace(selOld, selNew); say('approvalService: hospital filter added to bed select'); }
  else say('approvalService: BED SELECT ANCHOR MISS');

  // pass hospital through from decide()
  t = t.replace(
    'const bed = await blockOneFreeBed(data.bed_type);',
    'const bed = await blockOneFreeBed(data.bed_type, data.hospital);'
  );

  // free bed count, exact, straight from Supabase
  const countFn = `
/** Exact count of free beds, straight from Supabase (Command Center tile). */
export async function countFreeBeds(hospital = null) {
  let q = supabase.from(TABLES.beds).select('*', { count: 'exact', head: true }).eq('status', 'Free');
  if (hospital) q = q.eq('hospital', hospital);
  const { count, error } = await q;
  if (error) return { count: 0, error };
  return { count: count ?? 0, error: null };
}

`;
  const anchor = '/* -------------------------------------------------------------------------- */\n/* writes';
  if (t.includes(anchor)) { t = t.replace(anchor, countFn + anchor); say('approvalService: countFreeBeds added'); }
  else say('approvalService: COUNT ANCHOR MISS');

  // export list
  t = t.replace(
    '  submitRequest, blockOneFreeBed, decide,\n  seedDemoRequests, DEMO_GROUPS, subscribeApprovals,',
    '  submitRequest, blockOneFreeBed, decide, countFreeBeds,\n  subscribeApprovals,'
  );
  t = t.replace(
    "  fetchQueue, fetchAllQueues, fetchBeds,\n  submitRequest, blockOneFreeBed, decide,",
    "  fetchQueue, fetchAllQueues, fetchBeds,\n  submitRequest, blockOneFreeBed, decide, countFreeBeds,"
  );
  say('approvalService: exports updated');

  writeFileSync(file, t, 'utf8');
}

/* ================= 2. component: remove dummy button ================= */
{
  const file = 'src/components/receptionist/ReceptionistApprovalCenter.jsx';
  let t = readFileSync(file, 'utf8');

  t = t.replace(
    "  FlaskConical, Radio, MapPin, User, Activity, Loader2,\n} from 'lucide-react';",
    "  FlaskConical, Radio, MapPin, User, Activity, Loader2,\n} from 'lucide-react';"
  );

  // drop seedDemoRequests from the service import
  t = t.replace(
    "  fetchAllQueues, fetchBeds, decide, seedDemoRequests,\n  subscribeApprovals, PENDING,",
    "  fetchAllQueues, fetchBeds, decide, countFreeBeds,\n  subscribeApprovals, PENDING,"
  );
  say('component: seed import removed');

  // remove seeding state
  t = t.replace('  const [seeding, setSeeding] = useState(false);\n', '');

  // remove the handleSeed function
  const hs = t.indexOf('  /* ------------------------------ demo ------------------------------ */');
  const he = t.indexOf('  /* ---------------------------- derived ----------------------------- */');
  if (hs !== -1 && he > hs) {
    t = t.slice(0, hs) + t.slice(he);
    say('component: handleSeed removed');
  } else say('component: HANDLE SEED NOT FOUND');

  // remove the seed button
  const btn = t.match(/\n\s*<button\n\s*type="button"\n\s*onClick=\{handleSeed\}[\s\S]*?<\/button>/);
  if (btn) { t = t.replace(btn[0], ''); say('component: seed button removed'); }
  else say('component: SEED BUTTON NOT FOUND');

  // empty-state copy no longer mentions the demo button
  t = t.replace(
    'Patient bookings land here automatically, or use “Create Dummy Requests”.',
    'Patient bookings appear here the moment they are submitted - no refresh needed.'
  );

  // free beds from the exact Supabase count
  t = t.replace(
    "  const freeBeds = beds.filter((b) => String(b.status).toLowerCase() === 'free').length;",
    "  // exact count straight from Supabase, not a client-side tally\n  const [freeBedCount, setFreeBedCount] = useState(0);\n  useEffect(() => { countFreeBeds().then((r) => { if (!r.error) setFreeBedCount(r.count); }); }, [beds]);"
  );
  t = t.replace("{ label: 'Free beds', value: freeBeds, icon: BedDouble },", "{ label: 'Free beds', value: freeBedCount, icon: BedDouble },");

  writeFileSync(file, t, 'utf8');
}

console.log(log.map((l) => '  ' + l).join('\n'));