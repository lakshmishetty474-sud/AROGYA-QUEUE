/**
 * Receptionist Approval Center - data access.
 *
 * Deliberately kept out of supabaseService.js: that file is a long-lived,
 * feature-by-feature catalogue and the approval centre owns a four-table
 * realtime contract. Keeping it together makes that contract readable.
 *
 * Every insert writes status 'Pending'. Nothing in this module ever creates an
 * approved request - only the receptionist can, via decide().
 */

import { supabase } from './supabaseClient';

export const PENDING = 'Pending';
export const APPROVED = 'Approved';
export const REJECTED = 'Rejected';

/**
 * Statuses that count as an allocatable bed.
 *
 * The live beds table does not use 'Free' - it uses Available / Cleaning /
 * Maintenance / Occupied / Reserved. Blocking on 'Free' alone would silently
 * match nothing, so a bed approval would report "no bed available" every
 * time. Both spellings are accepted so the queue works against either dataset.
 */
const FREE_BED_STATUSES = ['Free', 'Available'];

const TABLES = {
  ambulance: 'ambulance_requests',
  appointment: 'appointments',
  bed: 'bed_requests',
  beds: 'beds',
};

/* -------------------------------------------------------------------------- */
/* reads                                                                      */
/* -------------------------------------------------------------------------- */

/** Fetch one queue, newest first. */
export async function fetchQueue(kind) {
  const table = TABLES[kind];
  if (!table) return { data: [], error: new Error(`unknown queue: ${kind}`) };

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error };
  return { data: data || [], error };
}

/** Fetch every queue at once - used for the initial paint and the counters. */
export async function fetchAllQueues() {
  const [ambulance, appointment, bed] = await Promise.all([
    fetchQueue('ambulance'),
    fetchQueue('appointment'),
    fetchQueue('bed'),
  ]);
  return {
    ambulance: ambulance.data,
    appointment: appointment.data,
    bed: bed.data,
    errors: [ambulance.error, appointment.error, bed.error].filter(Boolean),
  };
}

/** Live bed board. */
export async function fetchBeds() {
  const { data, error } = await supabase.from(TABLES.beds).select('*');
  if (error) return { data: [], error };
  return { data: data || [], error };
}


/** Exact count of free beds, straight from Supabase (Command Center tile). */
export async function countFreeBeds(hospital = null) {
  let q = supabase.from(TABLES.beds).select('*', { count: 'exact', head: true }).in('status', FREE_BED_STATUSES);
  if (hospital) q = q.eq('hospital', hospital);
  const { count, error } = await q;
  if (error) return { count: 0, error };
  return { count: count ?? 0, error: null };
}

/* -------------------------------------------------------------------------- */
/* writes                                                                     */
/* -------------------------------------------------------------------------- */

/** Patient-side booking. Always lands as Pending. */
export async function submitRequest(kind, payload) {
  const table = TABLES[kind];
  if (!table) return { data: null, error: new Error(`unknown queue: ${kind}`) };

  const row = { ...payload, status: PENDING };
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) return { data: null, error };
  return { data, error: null };
}

/**
 * Claim one free bed of a given type.
 *
 * NOTE: `update(...).eq(...).eq(...).limit(1)` does not work here. PostgREST
 * does not accept `limit` on an UPDATE, and without it every matching bed is
 * set to BLOCKED at once. So the bed is selected first, then updated by id.
 * That also keeps this atomic per request - one approval blocks one bed.
 */
export async function blockOneFreeBed(bedType, hospital) {
  if (!bedType) return { data: null, error: new Error('bed_type is required') };

  const { data: candidates, error: pickErr } = await supabase
    .from(TABLES.beds)
    .select('id, bedNumber, bedType, hospitalId, status')
    .eq('bedType', bedType)
    .in('status', FREE_BED_STATUSES)
    .eq('hospitalId', hospital || '')
    .order('bedNumber', { ascending: true })
    .limit(1);

  if (pickErr) return { data: null, error: pickErr };
  const bed = candidates && candidates[0];
  if (!bed) return { data: null, error: null, noneAvailable: true };

  const { data, error } = await supabase
    .from(TABLES.beds)
    .update({ status: 'BLOCKED' })
    .eq('id', bed.id)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data, error };
}

/**
 * The receptionist's decision.
 *
 * Ambulance and appointment: a single status update.
 * Bed: status update, and on approval one matching free bed is blocked.
 *
 * Realtime pushes the change to the patient, so no polling is needed.
 */
export async function decide(kind, id, decision) {
  const table = TABLES[kind];
  if (!table) return { data: null, error: new Error(`unknown queue: ${kind}`) };

  const status = decision === 'approve' ? APPROVED : REJECTED;

  const { data, error } = await supabase
    .from(table)
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return { data: null, error };

  // A rejected bed request blocks nothing.
  if (kind === 'bed' && decision === 'approve') {
    const bed = await blockOneFreeBed(data.bed_type, data.hospital);
    return { data, error: bed.error, bed: bed.data, noBedAvailable: !!bed.noneAvailable };
  }

  return { data, error: null };
}

/* -------------------------------------------------------------------------- */
/* realtime                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Subscribe to every table the approval centre depends on.
 *
 * All four share one channel, and any change triggers a refetch rather than a
 * local patch. Refetching is the honest choice: a bed approval touches two
 * tables, and a filtered local update would not reflect that.
 *
 * @param {() => void} onChange called after any INSERT/UPDATE/DELETE
 * @returns {() => void} unsubscribe
 */
export function subscribeApprovals(onChange) {
  const channel = supabase.channel('approvals');

  for (const table of [TABLES.ambulance, TABLES.appointment, TABLES.bed, TABLES.beds]) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, onChange);
  }

  channel.subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {
      /* channel already torn down */
    }
  };
}

export { FREE_BED_STATUSES };

export default {
  FREE_BED_STATUSES,
  PENDING, APPROVED, REJECTED,
  fetchQueue, fetchAllQueues, fetchBeds,
  submitRequest, blockOneFreeBed, decide, countFreeBeds, countFreeBeds,
  subscribeApprovals,
};