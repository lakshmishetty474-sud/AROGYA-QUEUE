import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Ambulance, CalendarClock, BedDouble, Check, X, RefreshCw,
  FlaskConical, Radio, MapPin, User, Activity, Loader2,
} from 'lucide-react';
import {
  fetchAllQueues, fetchBeds, decide, countFreeBeds,
  subscribeApprovals, PENDING,
} from '../../services/approvalService';

/* ============================================================================
   Receptionist Approval Center
   ----------------------------------------------------------------------------
   Three queues the front desk clears: ambulances, appointments and beds.
   Everything here reads and writes Supabase directly and stays live through a
   single realtime channel, so a patient booking appears without a refresh and
   a decision here shows up on the patient's screen.

   Dark desk theme: #0B0F1A page, #111827 cards, #22D3EE accent.

   BEDS AND APPROVAL
     Approving a bed request also blocks one free bed of that type. That is a
     SELECT then an UPDATE by id, not `update().limit(1)` - PostgREST ignores
     limit on an UPDATE and would block every matching bed at once.
   ============================================================================ */

const INK = {
  bg: '#0B0F1A',
  card: '#111827',
  border: '#1F2937',
  accent: '#22D3EE',
};

const TABS = [
  { key: 'ambulance', label: 'Ambulance', icon: Ambulance },
  { key: 'appointment', label: 'Appointments', icon: CalendarClock },
  { key: 'bed', label: 'Bed Requests', icon: BedDouble },
];

const STATUS_STYLE = {
  Pending: { bg: 'rgba(245,158,11,0.14)', fg: '#FBBF24', border: 'rgba(245,158,11,0.35)' },
  Approved: { bg: 'rgba(16,185,129,0.14)', fg: '#34D399', border: 'rgba(16,185,129,0.35)' },
  Rejected: { bg: 'rgba(244,63,94,0.14)', fg: '#FB7185', border: 'rgba(244,63,94,0.35)' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.fg, border: '1px solid ' + s.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fg }} />
      {status}
    </span>
  );
}

function timeAgo(iso) {
  if (!iso) return '-';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '-';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

function clockTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function ReceptionistApprovalCenter() {
  const [queues, setQueues] = useState({ ambulance: [], appointment: [], bed: [] });
  const [beds, setBeds] = useState([]);
  const [tab, setTab] = useState('ambulance');
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [schemaError, setSchemaError] = useState(null);
  const mounted = useRef(true);

  /* ------------------------------ data ------------------------------ */
  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetchAllQueues();
      const bedRes = await fetchBeds();
      if (!mounted.current) return;
      setQueues({ ambulance: res.ambulance, appointment: res.appointment, bed: res.bed });
      setBeds(bedRes.data);
      // A missing table is a setup problem, not a runtime bug - say so once.
      const first = res.errors[0] || bedRes.error;
      // Supabase phrases a missing table several ways depending on whether the
      // request hit the schema cache or the SQL layer. Match all of them, or the
      // screen just looks empty with no explanation.
      const msg = first && first.message ? first.message : '';
      const missing =
        /does not exist|42P01|schema cache|not found in the schema/i.test(msg);
      setSchemaError(missing ? msg : null);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load(true);

    // One channel across all four tables. Any change refetches, because a bed
    // approval writes to two tables and a per-row patch would miss the second.
    const unsubscribe = subscribeApprovals(() => {
      load(false);
      setLive(true);
    });

    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [load]);
  /* ---------------------------- decisions --------------------------- */
  const handleDecision = async (kind, row, decision) => {
    setBusyId(row.id);
    try {
      const res = await decide(kind, row.id, decision);

      if (res.error) {
        toast.error('Could not save: ' + res.error.message);
        return;
      }

      if (kind === 'bed' && decision === 'approve') {
        if (res.noBedAvailable) {
          toast.warning('Approved, but no free ' + (row.bed_type || 'matching') + ' bed was available to block.');
        } else {
          const label = res.bed && res.bed.bedNumber ? 'bed ' + res.bed.bedNumber : 'one bed';
          toast.success('Bed request approved - blocked ' + label + '.');
        }
      } else if (decision === 'approve') {
        toast.success(row.patient_name + ' approved.');
      } else {
        toast.error(row.patient_name + ' rejected.');
      }

      // Realtime will refetch, but do it now so the row does not linger.
      await load(false);
    } catch (err) {
      toast.error('Unexpected error: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  /* ---------------------------- derived ----------------------------- */
  const pendingCount = useMemo(
    () => ({
      ambulance: queues.ambulance.filter((r) => r.status === PENDING).length,
      appointment: queues.appointment.filter((r) => r.status === PENDING).length,
      bed: queues.bed.filter((r) => r.status === PENDING).length,
    }),
    [queues]
  );

  const totalPending = pendingCount.ambulance + pendingCount.appointment + pendingCount.bed;
  const rows = queues[tab] || [];
  // exact count straight from Supabase, not a client-side tally
  const [freeBedCount, setFreeBedCount] = useState(0);
  useEffect(() => { countFreeBeds().then((r) => { if (!r.error) setFreeBedCount(r.count); }); }, [beds]);
  const tabLabel = (TABS.find((t) => t.key === tab) || {}).label || '';

  return (
    <section
      className="rounded-3xl border overflow-hidden"
      style={{ background: INK.bg, borderColor: INK.border }}
    >
      {/* ------------------------------ header ------------------------------ */}
      <header
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b"
        style={{ borderColor: INK.border }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
            style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)' }}
          >
            <FlaskConical className="w-5 h-5" style={{ color: INK.accent }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Receptionist Approval Center
            </h2>
            <p className="text-[11px] text-slate-400">
              Ambulance, appointment and bed approvals - live from Supabase
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: live ? 'rgba(16,185,129,0.14)' : 'rgba(148,163,184,0.14)',
              color: live ? '#34D399' : '#94A3B8',
              border: '1px solid ' + (live ? 'rgba(16,185,129,0.35)' : 'rgba(148,163,184,0.3)'),
            }}
            title={live ? 'Realtime connected - no refresh needed' : 'Waiting for the realtime channel'}
          >
            <Radio className="w-3 h-3" />
            {live ? 'Live' : 'Connecting'}
          </span>

          <button
            type="button"
            onClick={() => load(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:text-white"
            style={{ background: '#111827', border: '1px solid ' + INK.border }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </header>

      {schemaError && (
        <div
          className="mx-5 mt-4 rounded-xl px-3.5 py-3 text-[11px]"
          style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.3)', color: '#FDA4AF' }}
        >
          <strong>Supabase tables not found.</strong> Run{' '}
          <code className="font-mono">supabase/migrations/20251003_receptionist_approval_center.sql</code>{' '}
          in the Supabase SQL editor, then press Refresh.
        </div>
      )}

      {/* ------------------------------ stats ------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pt-4">
        {[
          { label: 'Pending approval', value: totalPending, icon: Activity },
          { label: 'Free beds', value: freeBedCount, icon: BedDouble },
          { label: tabLabel + ' rows', value: rows.length, icon: CalendarClock },
          { label: 'Realtime', value: live ? 'ON' : 'OFF', icon: Radio },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl px-3.5 py-3"
            style={{ background: INK.card, border: '1px solid ' + INK.border }}
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400">
              <s.icon className="w-3 h-3" />
              {s.label}
            </div>
            <div className="mt-1 text-xl font-extrabold text-white">{s.value}</div>
          </div>
        ))}
      </div>
      {/* ------------------------------- tabs ------------------------------- */}
      <div
        className="flex items-center gap-1.5 px-5 pt-4 pb-1 overflow-x-auto"
        style={{ borderBottom: '1px solid ' + INK.border }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="inline-flex items-center gap-2 rounded-t-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap"
              style={{
                background: active ? INK.card : 'transparent',
                color: active ? INK.accent : '#94A3B8',
                border: '1px solid ' + (active ? INK.border : 'transparent'),
                borderBottom: active ? '2px solid ' + INK.accent : '2px solid transparent',
              }}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {pendingCount[t.key] > 0 && (
                <span
                  className="ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-slate-900"
                  style={{ background: '#FBBF24' }}
                >
                  {pendingCount[t.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ------------------------------- list ------------------------------- */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <Loader2 className="w-4 h-4" />
            Loading requests...
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-slate-300">No {tabLabel.toLowerCase()} yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Patient bookings appear here the moment they are submitted - no refresh needed.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((row) => {
              const isPending = row.status === PENDING;
              const busy = busyId === row.id;
              return (
                <li
                  key={row.id}
                  className="rounded-2xl px-4 py-3.5"
                  style={{ background: INK.card, border: '1px solid ' + INK.border }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {row.patient_name}
                        </span>
                        <StatusBadge status={row.status} />
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                        {tab === 'ambulance' && (
                          <>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {row.pickup_location || 'Location not stated'}
                            </span>
                            <span>Requested {timeAgo(row.created_at)}</span>
                          </>
                        )}
                        {tab === 'appointment' && (
                          <>
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {row.doctor || 'Doctor unassigned'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="w-3 h-3" />
                              {clockTime(row.date_time)}
                            </span>
                            <span>Requested {timeAgo(row.created_at)}</span>
                          </>
                        )}
                        {tab === 'bed' && (
                          <>
                            <span className="inline-flex items-center gap-1">
                              <BedDouble className="w-3 h-3" />
                              {row.bed_type || 'Any'} bed
                            </span>
                            <span>{row.hospital || 'Hospital unstated'}</span>
                            <span>Requested {timeAgo(row.created_at)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDecision(tab, row, 'reject')}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-60"
                          style={{ background: 'rgba(244,63,94,0.14)', color: '#FB7185', border: '1px solid rgba(244,63,94,0.35)' }}
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDecision(tab, row, 'approve')}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 disabled:opacity-60"
                          style={{ background: INK.accent }}
                        >
                          {busy ? <Loader2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">No action needed</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default ReceptionistApprovalCenter;