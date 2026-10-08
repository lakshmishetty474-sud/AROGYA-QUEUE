import React, { useMemo, useState } from 'react';
import {
  PhoneCall, CheckCircle2, XCircle, Clock, BedDouble, Ambulance, CalendarCheck,
  Phone, StickyNote, ShieldCheck, UserCheck, Inbox, History, X,
} from 'lucide-react';
import { useHealthcare } from '../context/AppContext';
import { useBookingVerification, VERIFICATION, BOOKING_TYPE } from '../context/BookingVerification';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ReceptionistApprovalCenter } from '../components/receptionist/ReceptionistApprovalCenter';

/* ============================================================================
   ReceptionistVerification
   ----------------------------------------------------------------------------
   The single place where bed, ambulance and appointment requests are confirmed
   or rejected.

   DESIGN RULE: nothing auto-confirms
   ---------------------------------
   AppContext's bookAppointment still writes status:'Confirmed' for backwards
   compatibility, because other screens read that field. This module does NOT
   trust it. getStatus() reports pending_verification until a receptionist has
   explicitly confirmed, and only then does the row read as confirmed. So the
   receptionist decision is authoritative regardless of what the legacy field
   says - no existing screen had to be rewritten.

   Verification state lives in BookingVerification, keyed by `${type}:${id}`,
   so nothing in AppContext is mutated or removed.
   ============================================================================ */

const TABS = [
  { key: BOOKING_TYPE.BED, label: 'Pending Bed Requests', icon: BedDouble, empty: 'No bed requests waiting.' },
  { key: BOOKING_TYPE.AMBULANCE, label: 'Pending Ambulance Requests', icon: Ambulance, empty: 'No ambulance requests waiting.' },
  { key: BOOKING_TYPE.APPOINTMENT, label: 'Pending Appointment Requests', icon: CalendarCheck, empty: 'No appointment requests waiting.' },
];

const REJECT_REASONS = [
  'No bed available in the requested ward',
  'Requested date not feasible',
  'Ambulance already dispatched',
  'Patient unreachable - incorrect number',
  'Duplicate request',
  'Incomplete information',
];

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString([], {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

function RequestRow({ type, item, status, onConfirm, onReject, onNote, logs }) {
  const name = item.patientName || item.name || 'Patient';
  const phone = item.mobile || item.phone || '';
  const isRejected = status === VERIFICATION.REJECTED;
  const isConfirmed = status === VERIFICATION.CONFIRMED;

  const when =
    type === BOOKING_TYPE.BED ? item.requestedAt
    : type === BOOKING_TYPE.AMBULANCE ? (item.requestedAt || item.timestamp)
    : (item.date ? `${item.date} ${item.timeSlot || ''}` : item.createdAt);

  const detail =
    type === BOOKING_TYPE.BED ? `${item.ward || 'Ward'} · ${item.bedType || 'Bed'}`
    : type === BOOKING_TYPE.AMBULANCE ? `${item.emergencyType || item.priority || 'Transport'}`
    : `${item.department || 'OPD'} · ${item.doctor || 'Doctor'}`;

  const badgeVariant = isConfirmed ? 'success' : isRejected ? 'danger' : 'warning';
  const badgeText = isConfirmed ? 'Confirmed' : isRejected ? 'Rejected' : 'Pending Verification';

  return (
    <div className={`p-4 rounded-2xl border transition-colors ${
      isConfirmed
        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
        : isRejected
          ? 'border-rose-200 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{name}</span>
            <Badge variant={badgeVariant}>{badgeText}</Badge>
            {item.isEmergency && <Badge variant="emergency">Emergency</Badge>}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">{item.id}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{detail}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Requested: {formatWhen(when)}
            {item.reason ? ` · ${item.reason}` : ''}
          </p>
          {isRejected && item._reason ? (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
              Rejected: {item._reason}
            </p>
          ) : null}
        </div>

        {/* Contact + actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {phone || 'No number'}
            </span>
            {phone && (
              <a
                href={`tel:${phone}`}
                onClick={() => onNote(type, item, `Called patient on ${phone}`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Call Patient
              </a>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {!isConfirmed && (
              <Button size="sm" variant="success" onClick={() => onConfirm(type, item)}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Booking
              </Button>
            )}
            {!isRejected && (
              <Button size="sm" variant="danger" onClick={() => onReject(type, item)}>
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onNote(type, item, null)} title="Call log">
              <History className="w-3.5 h-3.5" /> Log
            </Button>
          </div>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/70">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Call log</p>
          <ul className="space-y-1">
            {logs.slice(0, 3).map((l) => (
              <li key={l.id} className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                <span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{l.outcome}</span>
                  {l.note ? ` · ${l.note}` : ''}
                  {l.reason ? ` · ${l.reason}` : ''}
                  <span className="opacity-70"> — {l.calledBy}, {formatWhen(l.calledAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ReceptionistVerification() {
  const { bedReservations = [], ambulanceRequests = [], appointments = [] } = useHealthcare();
  const {
    getStatus, confirmBooking, rejectBooking, addCallNote, logsFor, callLogs, records,
  } = useBookingVerification();

  const [tab, setTab] = useState(BOOKING_TYPE.BED);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectNote, setRejectNote] = useState('');
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [toast, setToast] = useState('');

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  /* Group requests by type and decorate with verification status. */
  const grouped = useMemo(() => {
    const decorate = (list, type) =>
      (list || []).map((item) => ({ ...item, _type: type, _status: getStatus(type, item), _reason: records[`${type}:${item.id}`]?.reason || '' }));

    return {
      [BOOKING_TYPE.BED]: decorate(bedReservations, BOOKING_TYPE.BED),
      [BOOKING_TYPE.AMBULANCE]: decorate(ambulanceRequests, BOOKING_TYPE.AMBULANCE),
      [BOOKING_TYPE.APPOINTMENT]: decorate(appointments, BOOKING_TYPE.APPOINTMENT),
    };
  }, [bedReservations, ambulanceRequests, appointments, getStatus, records]);

  const pendingFor = (type) => grouped[type].filter((i) => i._status === VERIFICATION.PENDING);
  const decidedFor = (type) => grouped[type].filter((i) => i._status !== VERIFICATION.PENDING);

  const totalPending = TABS.reduce((n, t) => n + pendingFor(t.key).length, 0);

  const handleConfirm = (type, item) => {
    confirmBooking(type, item, 'Verified by phone call');
    flash(`Confirmed: ${item.patientName || 'patient'} (${item.id})`);
  };

  const handleReject = (type, item) => {
    rejectBooking(type, item, rejectReason, rejectNote);
    setRejectTarget(null);
    setRejectNote('');
    setRejectReason(REJECT_REASONS[0]);
    flash(`Rejected: ${item.patientName || 'patient'} (${item.id})`);
  };

  const handleNote = (type, item, quickNote) => {
    if (quickNote) {
      addCallNote(type, item, quickNote);
      return;
    }
    setNoteTarget({ type, item });
    setNoteText('');
  };

  const saveNote = () => {
    if (!noteTarget || !noteText.trim()) return;
    addCallNote(noteTarget.type, noteTarget.item, noteText.trim());
    setNoteTarget(null);
    setNoteText('');
    flash('Call note saved');
  };

  const activeTab = TABS.find((t) => t.key === tab);

  return (
    <div className="space-y-5">
      {/* Receptionist Approval Center - live Supabase queues */}
      <ReceptionistApprovalCenter />
      {/* Header */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Booking Verification Desk</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirm every booking by calling the patient first
              </p>
            </div>
          </div>
          <Badge variant={totalPending > 0 ? 'warning' : 'success'} size="md">
            {totalPending > 0 ? (
              <><Clock className="w-3.5 h-3.5" /> {totalPending} awaiting verification</>
            ) : (
              <><ShieldCheck className="w-3.5 h-3.5" /> All caught up</>
            )}
          </Badge>
        </div>
      </Card>

      {/* Rule notice */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
        <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <p className="text-xs text-sky-800 dark:text-sky-200 leading-relaxed">
          <strong>No booking is auto-confirmed.</strong> Every bed, ambulance and appointment
          request is created as <em>Pending Verification</em> and only becomes confirmed after you
          reach the patient and click <strong>Confirm Booking</strong>.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const n = pendingFor(t.key).length;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                active ? 'bg-white/20 dark:bg-slate-900/15' : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pending list */}
      <Card title={`Pending · ${activeTab.label}`} subtitle={`${pendingFor(tab).length} request(s) need a phone call`}>
        {pendingFor(tab).length === 0 ? (
          <div className="py-10 text-center">
            <Inbox className="w-9 h-9 text-slate-300 mx-auto mb-2.5" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{activeTab.empty}</p>
            <p className="text-xs text-slate-400 mt-1">New requests appear here the moment a patient submits one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingFor(tab).map((item) => (
              <RequestRow
                key={`${tab}:${item.id}`}
                type={tab}
                item={item}
                status={item._status}
                logs={logsFor(tab, item.id)}
                onConfirm={handleConfirm}
                onReject={(t, i) => setRejectTarget({ type: t, item: i })}
                onNote={handleNote}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Decisioned list */}
      <Card title="Recently Verified" subtitle={`${decidedFor(tab).length} decided request(s) in this category`}>
        {decidedFor(tab).length === 0 ? (
          <p className="text-xs text-slate-400">Nothing decided yet.</p>
        ) : (
          <div className="space-y-2">
            {decidedFor(tab).slice(0, 6).map((item) => (
              <div key={`d:${item.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {item.patientName} · <span className="font-mono text-[11px]">{item.id}</span>
                  </p>
                  {item._reason && <p className="text-[11px] text-rose-500">{item._reason}</p>}
                </div>
                <Badge variant={item._status === VERIFICATION.CONFIRMED ? 'success' : 'danger'}>
                  {item._status === VERIFICATION.CONFIRMED ? 'Confirmed' : 'Rejected'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* All call logs */}
      <Card title="Call Logs" subtitle={`${callLogs.length} entries`}>
        {callLogs.length === 0 ? (
          <p className="text-xs text-slate-400">No calls logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 pr-3 font-semibold">When</th>
                  <th className="py-2 pr-3 font-semibold">Patient</th>
                  <th className="py-2 pr-3 font-semibold">Type</th>
                  <th className="py-2 pr-3 font-semibold">Outcome</th>
                  <th className="py-2 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {callLogs.slice(0, 12).map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 pr-3 text-[11px] text-slate-500 whitespace-nowrap">{formatWhen(l.calledAt)}</td>
                    <td className="py-2 pr-3 text-xs font-semibold text-slate-800 dark:text-slate-200">{l.patientName}</td>
                    <td className="py-2 pr-3 text-[11px] text-slate-500 capitalize">{l.type}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={l.outcome === 'confirm' ? 'success' : l.outcome === 'reject' ? 'danger' : 'default'}>
                        {l.outcome}
                      </Badge>
                    </td>
                    <td className="py-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {l.note || l.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reject modal */}
      {rejectTarget && (
        <Modal isOpen onClose={() => setRejectTarget(null)} title="Reject Booking Request" subtitle={rejectTarget.item.patientName}>
          <div className="space-y-3.5">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reason for rejection</p>
              <div className="space-y-1.5">
                {REJECT_REASONS.map((r) => (
                  <label key={r} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      checked={rejectReason === r}
                      onChange={() => setRejectReason(r)}
                      className="mt-0.5"
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <Input
              label="Note (optional)"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Patient asked to reschedule to Friday"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleReject(rejectTarget.type, rejectTarget.item)}>
                <XCircle className="w-4 h-4" /> Reject Request
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Note modal */}
      {noteTarget && (
        <Modal isOpen onClose={() => setNoteTarget(null)} title="Call Note" subtitle={noteTarget.item.patientName}>
          <div className="space-y-3">
            <Input
              label="What happened on the call?"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Reached patient, confirmed availability"
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setNoteTarget(null)}>Cancel</Button>
              <Button variant="primary" onClick={saveNote}><StickyNote className="w-4 h-4" /> Save Note</Button>
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}

export default ReceptionistVerification;