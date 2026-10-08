/**
 * Doctor on-duty roster - data access.
 *
 * One table (doctor_duty) is read by three surfaces: the hospital roster, the
 * patient availability list, and the doctor's own duty toggle. All three go
 * through this module so the filters stay identical and a status change
 * propagates the same way everywhere.
 */
import { supabase } from './supabaseClient';

export const ON_DUTY = 'On Duty';
export const OFF_DUTY = 'Off Duty';
export const ON_LEAVE = 'On Leave';
export const EMERGENCY = 'Emergency';

export const STATUSES = [ON_DUTY, OFF_DUTY, ON_LEAVE, EMERGENCY];
export const SHIFTS = ['Morning', 'Evening', 'Night'];

/** Local calendar date as YYYY-MM-DD. Never UTC - that can land on the wrong day. */
export function todayISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

export async function fetchRoster(hospital, dutyDate = todayISO()) {
  const { data, error } = await supabase
    .from('doctor_duty').select('*')
    .eq('hospital', hospital).eq('duty_date', dutyDate)
    .order('start_time', { ascending: true });
  if (error) return { data: [], error };
  return { data: data || [], error: null };
}

export async function fetchOnDuty(dutyDate = todayISO(), hospital = null) {
  let q = supabase.from('doctor_duty').select('*')
    .eq('status', ON_DUTY).eq('duty_date', dutyDate);
  if (hospital) q = q.eq('hospital', hospital);
  const { data, error } = await q.order('start_time', { ascending: true });
  if (error) return { data: [], error };
  return { data: data || [], error: null };
}

export async function countOnDuty(dutyDate = todayISO(), hospital = null) {
  let q = supabase.from('doctor_duty').select('*', { count: 'exact', head: true })
    .eq('status', ON_DUTY).eq('duty_date', dutyDate);
  if (hospital) q = q.eq('hospital', hospital);
  const { count, error } = await q;
  if (error) return { count: 0, error };
  return { count: count || 0, error: null };
}

export async function fetchDoctors(hospital = null) {
  let q = supabase.from('doctors').select('*');
  if (hospital) q = q.eq('hospital', hospital);
  const { data, error } = await q.order('name', { ascending: true });
  if (error) return { data: [], error };
  return { data: data || [], error: null };
}

export async function fetchMyDuty(doctorId, dutyDate = todayISO()) {
  const { data, error } = await supabase
    .from('doctor_duty').select('*')
    .eq('doctor_id', doctorId).eq('duty_date', dutyDate).limit(1);
  if (error) return { data: null, error };
  return { data: (data && data[0]) || null, error: null };
}

/**
 * Put a doctor on duty for a date.
 *
 * doctor_duty has a unique constraint on (doctor_id, duty_date), so this must
 * be an upsert. A plain insert fails the second time a doctor is marked for the
 * same day - which is exactly what a double tap on the duty toggle does.
 */
export async function markDuty(row) {
  const payload = {
    doctor_id: row.doctor_id,
    doctor_name: row.doctor_name,
    specialization: row.specialization || null,
    department: row.department || null,
    hospital: row.hospital,
    shift: row.shift || null,
    status: row.status || ON_DUTY,
    duty_date: row.duty_date || todayISO(),
    start_time: row.start_time || null,
    end_time: row.end_time || null,
  };
  const { data, error } = await supabase
    .from('doctor_duty').upsert(payload, { onConflict: 'doctor_id,duty_date' }).select().single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function setDutyStatus(id, status) {
  const { data, error } = await supabase
    .from('doctor_duty').update({ status }).eq('id', id).select().single();
  if (error) return { data: null, error };
  return { data, error: null };
}

/**
 * A doctor's own on/off duty toggle. Creates the row when the doctor has none
 * for today, otherwise they could never go on duty from their own dashboard.
 */
export async function toggleMyDuty({ doctorId, nextStatus, profile, dutyDate = todayISO() }) {
  const existing = await fetchMyDuty(doctorId, dutyDate);
  if (existing.error) return { data: null, error: existing.error };
  if (!existing.data) {
    return markDuty({
      doctor_id: doctorId,
      doctor_name: (profile && profile.name) || '',
      specialization: (profile && profile.specialization) || null,
      department: (profile && profile.department) || null,
      hospital: profile && profile.hospital,
      shift: null,
      status: nextStatus,
      duty_date: dutyDate,
    });
  }
  return setDutyStatus(existing.data.id, nextStatus);
}

/**
 * One channel across both tables. Any change refetches rather than patching a
 * row locally: the roster, patient list and Command Center tile read overlapping
 * data, and a partial update would let them disagree.
 */
export function subscribeDoctorDuty(onChange) {
  const channel = supabase.channel('doctor-duty-live');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'doctor_duty' }, onChange);
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, onChange);
  channel.subscribe();
  return () => { try { supabase.removeChannel(channel); } catch { /* gone */ } };
}

export default {
  ON_DUTY, OFF_DUTY, ON_LEAVE, EMERGENCY, STATUSES, SHIFTS, todayISO,
  fetchRoster, fetchOnDuty, countOnDuty, fetchDoctors, fetchMyDuty,
  markDuty, setDutyStatus, toggleMyDuty, subscribeDoctorDuty,
};