import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Stethoscope, Radio, Calendar, Clock, Users, Loader2, Check, X,
  ShieldAlert, Search, UserRound, AlertTriangle,
} from 'lucide-react';
import {
  fetchRoster, fetchOnDuty, fetchDoctors, fetchMyDuty, countOnDuty,
  markDuty, setDutyStatus, toggleMyDuty, subscribeDoctorDuty, todayISO,
  STATUSES, SHIFTS, ON_DUTY, OFF_DUTY, ON_LEAVE, EMERGENCY,
} from '../../services/dutyService';
import { submitRequest } from '../../services/approvalService';
import { useHealthcare } from '../../context/AppContext';

/* ============================================================================
   Doctor on-duty visibility - three views over one roster table
   ----------------------------------------------------------------------------
   DutyRosterPanel    hospital / admin   the roster, with add-shift + status edit
   DoctorAvailability patient            who is bookable right now
   DoctorDutySelf     doctor             my own state, and my team's

   All three read doctor_duty over one realtime channel, so a status change
   anywhere shows up everywhere without a refresh.

   Dark desk theme: #0B0F1A page, #111827 cards, #22D3EE accent.
   ============================================================================ */

const INK = { bg: '#0B0F1A', card: '#111827', border: '#1F2937', accent: '#22D3EE' };

/** Status colours. On Duty is the only one that pulses. */
const STATUS_UI = {
  'On Duty':   { fg: '#34D399', bg: 'rgba(16,185,129,0.14)',  bd: 'rgba(16,185,129,0.35)',  pulse: true },
  'Off Duty':  { fg: '#94A3B8', bg: 'rgba(148,163,184,0.12)', bd: 'rgba(148,163,184,0.3)', pulse: false },
  'On Leave':  { fg: '#FB7185', bg: 'rgba(244,63,94,0.14)',   bd: 'rgba(244,63,94,0.35)',   pulse: false },
  'Emergency': { fg: '#FB923C', bg: 'rgba(249,115,22,0.14)',  bd: 'rgba(249,115,22,0.35)',  pulse: true },
};

const SPECIALIZATIONS = ['Cardiology', 'Emergency', 'ICU', 'General'];

function StatusBadge({ status }) {
  const s = STATUS_UI[status] || STATUS_UI['Off Duty'];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.fg, border: '1px solid ' + s.bd }}
    >
      <span
        className={'w-1.5 h-1.5 rounded-full ' + (s.pulse ? 'aq-duty-pulse' : '')}
        style={{ background: s.fg }}
      />
      {status}
    </span>
  );
}

function hhmm(t) {
  if (!t) return '--';
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function initials(name) {
  if (!name) return '?';
  return String(name).trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/** One shared realtime subscription for whichever view is mounted. */
function useDutyChannel(onChange) {
  useEffect(() => {
    const off = subscribeDoctorDuty(() => { onChange(); });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
/* ============================================================================
   1. HOSPITAL / ADMIN - the live roster
   ============================================================================ */
export function DutyRosterPanel({ hospital = 'BCH-MAIN', hospitalLabel = 'Bengaluru Central Hospital' }) {
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [saving, setSaving] = useState(null);
  const [schemaError, setSchemaError] = useState(null);

  // add-shift form
  const [form, setForm] = useState({ doctor_id: '', shift: 'Morning', start_time: '08:00', end_time: '14:00' });

  const load = useCallback(async () => {
    try {
      const [r, d] = await Promise.all([fetchRoster(hospital, date), fetchDoctors(hospital)]);
      if (!r.error && r.data.length === 0) {
        // roster empty for this hospital code - fall back to the directory names
        // so the header still reads sensibly
      }
      setRows(r.data);
      setDoctors(d.data);
      const bad = [r.error, d.error].find(Boolean);
      setSchemaError(bad ? bad.message : null);
    } finally {
      setLoading(false);
    }
  }, [hospital, date]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useDutyChannel(() => { load(); setLive(true); });

  const counts = useMemo(() => {
    const c = { 'On Duty': 0, 'Off Duty': 0, 'On Leave': 0, 'Emergency': 0 };
    rows.forEach((r) => { if (c[r.status] !== undefined) c[r.status] += 1; });
    return c;
  }, [rows]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.doctor_id) { toast.error('Pick a doctor first'); return; }
    const doc = doctors.find((x) => x.id === form.doctor_id);
    if (!doc) return;

    setSaving('add');
    const res = await markDuty({
      doctor_id: doc.id,
      doctor_name: doc.name,
      specialization: doc.specialization,
      department: doc.department,
      hospital: hospital,
      shift: form.shift,
      start_time: form.start_time,
      end_time: form.end_time,
      duty_date: date,
    });
    setSaving(null);

    if (res.error) { toast.error('Could not mark on duty: ' + res.error.message); return; }
    toast.success(doc.name + ' marked on duty for ' + form.shift.toLowerCase() + ' shift.');
    setForm((f) => ({ ...f, doctor_id: '' }));
    load();
  };

  const handleStatus = async (row, next) => {
    setSaving(row.id);
    const res = await setDutyStatus(row.id, next);
    setSaving(null);
    if (res.error) { toast.error('Could not update: ' + res.error.message); return; }
    toast.success(row.doctor_name + ' is now ' + next.toLowerCase() + '.');
    load();
  };

  return (
    <section className="rounded-3xl border overflow-hidden" style={{ background: INK.bg, borderColor: INK.border }}>
      {/* header */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: INK.border }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
               style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)' }}>
            <Stethoscope className="w-5 h-5" style={{ color: INK.accent }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Live Doctor Duty Roster</h2>
            <p className="text-[11px] text-slate-400">{hospitalLabel} ({hospital})</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: live ? 'rgba(16,185,129,0.14)' : 'rgba(148,163,184,0.14)',
                         color: live ? '#34D399' : '#94A3B8',
                         border: '1px solid ' + (live ? 'rgba(16,185,129,0.35)' : 'rgba(148,163,184,0.3)') }}
                title={live ? 'Realtime connected' : 'Waiting for the realtime channel'}>
            <Radio className="w-3 h-3" />
            {live ? 'Live' : 'Connecting'}
          </span>
          <label className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-300"
                 style={{ background: INK.card, border: '1px solid ' + INK.border }}>
            <Calendar className="w-3.5 h-3.5" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                   className="bg-transparent text-slate-200 outline-none text-[11px]" />
          </label>
        </div>
      </header>

      {schemaError && (
        <div className="mx-5 mt-4 rounded-xl px-3.5 py-3 text-[11px]"
             style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.3)', color: '#FDA4AF' }}>
          <strong>Duty tables not reachable.</strong> Run the doctor duty migration in the Supabase SQL
          editor (<code className="font-mono">supabase/20251005_doctor_duty_roster.sql</code>).
          {schemaError ? ' (' + schemaError + ')' : ''}
        </div>
      )}

      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pt-4">
        {[
          { label: 'On Duty', value: counts['On Duty'], status: 'On Duty', icon: Check },
          { label: 'Off Duty', value: counts['Off Duty'], status: 'Off Duty', icon: X },
          { label: 'On Leave', value: counts['On Leave'], status: 'On Leave', icon: UserRound },
          { label: 'Emergency', value: counts['Emergency'], status: 'Emergency', icon: ShieldAlert },
        ].map((s) => {
          const ui = STATUS_UI[s.status];
          return (
            <div key={s.label} className="rounded-2xl px-3.5 py-3" style={{ background: INK.card, border: '1px solid ' + INK.border }}>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider" style={{ color: ui.fg }}>
                <s.icon className="w-3 h-3" />
                {s.label}
              </div>
              <div className="mt-1 text-xl font-extrabold text-white">{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* add shift */}
      <form onSubmit={handleAdd} className="mx-5 mt-4 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
            style={{ background: INK.card, border: '1px solid ' + INK.border }}>
        <label className="text-[11px] sm:col-span-2">
          <span className="block mb-1 text-slate-400">Doctor</span>
          <select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                  className="w-full rounded-lg px-2.5 py-2 text-xs bg-slate-900 text-slate-100 outline-none border"
                  style={{ borderColor: INK.border }}>
            <option value="">{doctors.length ? 'Select a doctor' : 'No doctors in directory'}</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name} - {d.specialization || d.department || 'General'}</option>
            ))}
          </select>
        </label>
        <label className="text-[11px]">
          <span className="block mb-1 text-slate-400">Shift</span>
          <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  className="w-full rounded-lg px-2.5 py-2 text-xs bg-slate-900 text-slate-100 outline-none border"
                  style={{ borderColor: INK.border }}>
            {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-[11px]">
          <span className="block mb-1 text-slate-400">Start</span>
          <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                 className="w-full rounded-lg px-2.5 py-2 text-xs bg-slate-900 text-slate-100 outline-none border"
                 style={{ borderColor: INK.border }} />
        </label>
        <label className="text-[11px]">
          <span className="block mb-1 text-slate-400">End</span>
          <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                 className="w-full rounded-lg px-2.5 py-2 text-xs bg-slate-900 text-slate-100 outline-none border"
                 style={{ borderColor: INK.border }} />
        </label>
        <button type="submit" disabled={saving === 'add'}
                className="rounded-lg px-3.5 py-2 text-xs font-bold text-slate-900 disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                style={{ background: INK.accent }}>
          {saving === 'add' ? <Loader2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
          Mark On Duty
        </button>
      </form>

      {/* table */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <Loader2 className="w-4 h-4" /> Loading roster...
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-slate-300">No duty entries for {date}</p>
            <p className="mt-1 text-xs text-slate-500">Mark a doctor on duty above to start the roster.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b" style={{ borderColor: INK.border }}>
                  {['Doctor', 'Specialization', 'Department', 'Shift', 'Time', 'Status', 'Action'].map((h) => (
                    <th key={h} className="py-2 pr-3 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: INK.border }}>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full grid place-items-center text-[10px] font-bold text-slate-900 shrink-0"
                              style={{ background: INK.accent }}>{initials(r.doctor_name)}</span>
                        <span className="text-xs font-semibold text-white">{r.doctor_name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-300">{r.specialization || '-'}</td>
                    <td className="py-3 pr-3 text-xs text-slate-400">{r.department || '-'}</td>
                    <td className="py-3 pr-3 text-xs text-slate-300">{r.shift || '-'}</td>
                    <td className="py-3 pr-3 text-xs font-mono text-slate-400">
                      {hhmm(r.start_time)} - {hhmm(r.end_time)}
                    </td>
                    <td className="py-3 pr-3"><StatusBadge status={r.status} /></td>
                    <td className="py-3">
                      <select
                        value={r.status}
                        disabled={saving === r.id}
                        onChange={(e) => handleStatus(r, e.target.value)}
                        className="rounded-lg px-2 py-1 text-[11px] bg-slate-900 text-slate-100 outline-none border disabled:opacity-50"
                        style={{ borderColor: INK.border }}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
/* ============================================================================
   2. PATIENT - who is bookable right now
   ============================================================================ */
export function DoctorAvailability({ title = 'Doctors Available Right Now' }) {
  const { currentUser } = useHealthcare();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [booking, setBooking] = useState(null);
  const [specialization, setSpecialization] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetchOnDuty(todayISO());
      setRows(r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useDutyChannel(() => { load(); setLive(true); });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const specOk = !specialization
        || (r.specialization || '').toLowerCase() === specialization.toLowerCase()
        || (r.department || '').toLowerCase() === specialization.toLowerCase();
      const qOk = !q
        || (r.doctor_name || '').toLowerCase().includes(q)
        || (r.department || '').toLowerCase().includes(q);
      return specOk && qOk;
    });
  }, [rows, specialization, query]);

  const handleBook = async (row) => {
    setBooking(row.id);
    // goes into the same Pending approval queue the receptionist clears
    const res = await submitRequest('appointment', {
      patient_name: (currentUser && currentUser.name) || 'Walk-in Patient',
      doctor: row.doctor_name,
      date_time: new Date().toISOString(),
    });
    setBooking(null);

    if (res.error) { toast.error('Could not request appointment: ' + res.error.message); return; }
    toast.success('Appointment requested with ' + row.doctor_name + '. Awaiting front desk approval.');
  };

  return (
    <section className="rounded-3xl border overflow-hidden" style={{ background: INK.bg, borderColor: INK.border }}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: INK.border }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
               style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)' }}>
            <Users className="w-5 h-5" style={{ color: INK.accent }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
            <p className="text-[11px] text-slate-400">{filtered.length} on duty today</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                 style={{ background: INK.card, border: '1px solid ' + INK.border }}>
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name"
                   className="bg-transparent text-[11px] text-slate-200 outline-none w-28 placeholder:text-slate-600" />
          </label>
          <select value={specialization} onChange={(e) => setSpecialization(e.target.value)}
                  className="rounded-lg px-2.5 py-2 text-[11px] bg-slate-900 text-slate-100 outline-none border"
                  style={{ borderColor: INK.border }}>
            <option value="">All specialisations</option>
            {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: live ? 'rgba(16,185,129,0.14)' : 'rgba(148,163,184,0.14)',
                         color: live ? '#34D399' : '#94A3B8',
                         border: '1px solid ' + (live ? 'rgba(16,185,129,0.35)' : 'rgba(148,163,184,0.3)') }}>
            <Radio className="w-3 h-3" />
            {live ? 'Live' : 'Connecting'}
          </span>
        </div>
      </header>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <Loader2 className="w-4 h-4" /> Checking who is on duty...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto text-amber-400 mb-2" />
            <p className="text-sm font-semibold text-slate-200">No doctors on duty</p>
            <p className="mt-1 text-xs text-slate-500">Please try emergency or call the hospital directly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((r) => (
              <article key={r.id} className="rounded-2xl p-4 flex flex-col gap-3"
                       style={{ background: INK.card, border: '1px solid ' + INK.border }}>
                <div className="flex items-start gap-3">
                  <span className="w-11 h-11 rounded-full grid place-items-center text-xs font-bold text-slate-900 shrink-0"
                        style={{ background: INK.accent }}>{initials(r.doctor_name)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{r.doctor_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{r.specialization || 'General'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{r.department || '-'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  {r.shift && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />{r.shift} {hhmm(r.start_time)}-{hhmm(r.end_time)}
                    </span>
                  )}
                  <span className="truncate">{r.hospital || ''}</span>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2">
                  <StatusBadge status="On Duty" />
                  <button onClick={() => handleBook(r)} disabled={booking === r.id}
                          className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-900 disabled:opacity-60 inline-flex items-center gap-1.5"
                          style={{ background: INK.accent }}>
                    {booking === r.id ? <Loader2 className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                    Book Appointment
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
   3. DOCTOR - my own state, and my team
   ============================================================================ */
export function DoctorDutySelf({ hospital = 'BCH-MAIN' }) {
  const { currentUser } = useHealthcare();
  // the doctor_duty row is keyed on doctors.id, so the logged-in user has to
  // carry that id. Fall back to matching the directory by name.
  const doctorId = (currentUser && (currentUser.doctorId || currentUser.doctor_id)) || null;

  const [mine, setMine] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resolvedId, setResolvedId] = useState(doctorId);

  const load = useCallback(async () => {
    try {
      // resolve this doctor's roster id if the session did not carry it
      let id = resolvedId;
      if (!id) {
        const dir = await fetchDoctors(null);
        const match = dir.data.find(
          (d) => d.name && currentUser && d.name.toLowerCase() === String(currentUser.name || '').toLowerCase()
        );
        if (match) { id = match.id; setResolvedId(match.id); }
      }

      if (id) {
        const own = await fetchMyDuty(id, todayISO());
        setMine(own.data);
      }

      const all = await fetchOnDuty(todayISO(), hospital);
      setTeam(all.data.filter((r) => r.doctor_id !== id));
    } finally {
      setLoading(false);
    }
  }, [resolvedId, hospital, currentUser]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useDutyChannel(() => { load(); });

  const isOn = mine && mine.status === ON_DUTY;

  const toggle = async () => {
    if (!resolvedId) {
      toast.error('No doctor_duty record is linked to this account yet. Ask an admin to add you to the roster.');
      return;
    }
    setBusy(true);
    const next = isOn ? OFF_DUTY : ON_DUTY;
    const res = await toggleMyDuty({
      doctorId: resolvedId,
      nextStatus: next,
      profile: { name: currentUser && currentUser.name, hospital, department: currentUser && currentUser.department },
    });
    setBusy(false);

    if (res.error) { toast.error('Could not update duty: ' + res.error.message); return; }
    toast.success(next === ON_DUTY ? 'You are marked on duty.' : 'You are marked off duty.');
    load();
  };

  return (
    <section className="rounded-3xl border overflow-hidden" style={{ background: INK.bg, borderColor: INK.border }}>
      <header className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: INK.border }}>
        <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
             style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)' }}>
          <Stethoscope className="w-5 h-5" style={{ color: INK.accent }} />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">My Duty Status</h2>
          <p className="text-[11px] text-slate-400">{hospital}</p>
        </div>
      </header>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <Loader2 className="w-4 h-4" /> Loading duty status...
          </div>
        ) : (
          <>
            {/* big status card */}
            <div className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
                 style={{ background: INK.card, border: '1px solid ' + INK.border }}>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Today</p>
                <p className="mt-1 text-2xl font-extrabold"
                   style={{ color: isOn ? '#34D399' : '#94A3B8' }}>
                  {mine ? (isOn ? 'YOU ARE ON DUTY' : 'YOU ARE OFF DUTY') : 'NOT SCHEDULED'}
                </p>
                {mine && (
                  <p className="mt-1 text-xs text-slate-400">
                    {mine.shift || 'No shift set'}
                    {mine.start_time ? ' - ' + hhmm(mine.start_time) + ' to ' + hhmm(mine.end_time) : ''}
                    {mine.specialization ? ' - ' + mine.specialization : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {mine && <StatusBadge status={mine.status} />}
                <button onClick={toggle} disabled={busy}
                        className="rounded-lg px-4 py-2 text-xs font-bold text-slate-900 disabled:opacity-60 inline-flex items-center gap-1.5"
                        style={{ background: isOn ? '#94A3B8' : INK.accent }}>
                  {busy ? <Loader2 className="w-3.5 h-3.5" /> : (isOn ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />)}
                  {isOn ? 'Go Off Duty' : 'Go On Duty'}
                </button>
              </div>
            </div>

            {/* team */}
            <h3 className="mt-5 mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Your Team On Duty Today ({team.length})
            </h3>

            {team.length === 0 ? (
              <p className="rounded-2xl px-4 py-6 text-center text-xs text-slate-500"
                 style={{ background: INK.card, border: '1px solid ' + INK.border }}>
                Nobody else is on duty at {hospital} right now.
              </p>
            ) : (
              <ul className="space-y-2">
                {team.map((r) => (
                  <li key={r.id} className="rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                      style={{ background: INK.card, border: '1px solid ' + INK.border }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-full grid place-items-center text-[10px] font-bold text-slate-900 shrink-0"
                            style={{ background: INK.accent }}>{initials(r.doctor_name)}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{r.doctor_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {r.specialization || 'General'}{r.department ? ' - ' + r.department : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.shift && <span className="text-[11px] text-slate-400">{r.shift} {hhmm(r.start_time)}-{hhmm(r.end_time)}</span>}
                      <StatusBadge status={r.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
   Command Center tile - doctors on duty, straight from Supabase
   ============================================================================ */
export function OnDutyCountTile({ hospital = null }) {
  const [count, setCount] = useState(null);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    const r = await countOnDuty(todayISO(), hospital);
    if (!r.error) setCount(r.count);
  }, [hospital]);

  useEffect(() => { load(); }, [load]);
  useDutyChannel(() => { load(); setLive(true); });

  return (
    <div className="rounded-2xl px-4 py-3.5" style={{ background: INK.card, border: '1px solid ' + INK.border }}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400">
        <span className={'w-1.5 h-1.5 rounded-full ' + (live ? 'aq-duty-pulse' : '')}
              style={{ background: live ? '#34D399' : '#94A3B8' }} />
        Doctors On Duty
      </div>
      <div className="mt-1 text-2xl font-extrabold text-white">{count === null ? '--' : count}</div>
    </div>
  );
}

export default { DutyRosterPanel, DoctorAvailability, DoctorDutySelf, OnDutyCountTile };
