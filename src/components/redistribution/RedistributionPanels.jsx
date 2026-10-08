import React, { useState } from 'react';
import {
  Send, MessageCircleQuestion, CheckCircle2, XCircle, ShieldCheck,
  Bell, Clock, ArrowRight, MessageSquarePlus, Truck, Building2, FileText,
} from 'lucide-react';
import { useHealthcare } from '../../context/AppContext';
import { useRedistribution, RD_STATUS, RD_STAGE } from '../../context/RedistributionContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

/* ============================================================================
   Redistribution panels
   ----------------------------------------------------------------------------
   Four views over one approval chain, each rendered into the dashboard that
   owns that stage:

     PharmacistRequestPanel -> Pharmacy        (raise the request)
     HospitalAdminPanel     -> Hospital OS     (same-hospital approval)
     SystemAdminPanel       -> Administration  (network approval)
     TargetHospitalPanel    -> Pharmacy        (incoming from another hospital)

   A pharmacist cannot reach another hospital directly: createRequest always
   files against their OWN hospital admin, and the target hospital is only ever
   notified after the System Admin approves.
   ============================================================================ */

const STAGES = [
  { key: 'PHARMACIST', label: 'Pharmacist Requested' },
  { key: 'HOSPITAL_ADMIN', label: 'Hospital Admin Approved' },
  { key: 'SYSTEM_ADMIN', label: 'System Admin Approved' },
  { key: 'TARGET', label: 'Sent to Other Hospital' },
];

const ORDER = [
  RD_STATUS.PENDING_HOSPITAL_ADMIN,
  RD_STATUS.PENDING_SYSTEM_ADMIN,
  RD_STATUS.APPROVED_BY_SYSTEM_ADMIN,
  RD_STATUS.SENT_TO_TARGET,
  RD_STATUS.ACCEPTED_BY_TARGET,
];

function statusVariant(s) {
  if (s === RD_STATUS.ACCEPTED_BY_TARGET) return 'success';
  if (s === RD_STATUS.REJECTED) return 'danger';
  if (s === RD_STATUS.SENT_TO_TARGET || s === RD_STATUS.APPROVED_BY_SYSTEM_ADMIN) return 'info';
  return 'warning';
}

function statusLabel(s) {
  return String(s || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Timeline: Pharmacist -> Hospital Admin -> System Admin -> Other Hospital */
export function StatusTimeline({ request }) {
  const rejected = request.status === RD_STATUS.REJECTED;
  const idx = rejected ? -1 : ORDER.indexOf(request.status);

  return (
    <ol className="flex items-center gap-1 flex-wrap">
      {STAGES.map((s, i) => {
        const done = !rejected && i <= idx;
        return (
          <li key={s.key} className="flex items-center gap-1">
            <span
              className={'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ' +
                (done
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700')}
            >
              {done ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {s.label}
            </span>
            {i < STAGES.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />}
          </li>
        );
      })}
      {rejected && (
        <li className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
          <XCircle className="w-3 h-3" /> Rejected
        </li>
      )}
    </ol>
  );
}

function RequestMeta({ r }) {
  return (
    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
      <span>
        By <strong className="text-slate-600 dark:text-slate-300">{r.requestedByPharmacistName}</strong>
      </span>
      <span className="inline-flex items-center gap-1">
        <Building2 className="w-3 h-3" />
        {r.sourceHospitalName} &rarr; {r.targetHospitalName}
      </span>
      <span className="inline-flex items-center gap-1">
        <FileText className="w-3 h-3" />
        {new Date(r.createdAt).toLocaleDateString()}
      </span>
    </div>
  );
}

/* ============================================================================
   1. PHARMACIST - raise a request. Goes to their OWN hospital admin only.
   ============================================================================ */
export function PharmacistRequestPanel() {
  const { medicines, hospitals, activeHospitalId } = useHealthcare();
  const { createRequest, replyClarification, visible, RD_STATUS: S } = useRedistribution();

  const me = activeHospitalId || 'HOSP-01';
  const myMedicines = medicines.filter((m) => m.hospitalId === me);
  const others = hospitals.filter((h) => h.id !== me);
  const mine = visible(RD_STAGE.PHARMACIST);

  const [medicineName, setMedicineName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  // clarification round-trip: the admin's question must be answered to unblock
  const [replyFor, setReplyFor] = useState(null);
  const [reply, setReply] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const res = createRequest({ medicineName, quantity, reason, targetHospitalId: target });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMedicineName('');
    setQuantity('');
    setTarget('');
    setReason('');
  };

  return (
    <div className="space-y-4">
      <Card
        title="Request Medicine Redistribution"
        subtitle="Goes to your Hospital Admin first - you cannot contact another hospital directly"
      >
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Medicine"
            required
            options={myMedicines.map((m) => m.name)}
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
          />
          <Input
            label="Quantity"
            required
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Select
            label="Target Hospital"
            required
            options={others.map((h) => ({ value: h.id, label: h.name }))}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <Input
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Stock-out, urgent procedure"
          />
          {error && <p className="sm:col-span-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          <div className="sm:col-span-2 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[11px] text-slate-400">
              Status will be <strong>{statusLabel(S.PENDING_HOSPITAL_ADMIN)}</strong>
            </p>
            <Button type="submit" variant="primary">
              <Send className="w-4 h-4" /> Send Request
            </Button>
          </div>
        </form>
      </Card>

      <Card title="My Redistribution Requests" subtitle={mine.length + ' total'}>
        {mine.length === 0 ? (
          <p className="text-xs text-slate-400">No requests raised yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {mine.map((r) => (
              <li key={r.id} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {r.medicineName} <span className="text-slate-400">x{r.quantity}</span>
                    </p>
                    <RequestMeta r={r} />
                    {r.pharmacistReason && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        <strong>Reason:</strong> {r.pharmacistReason}
                      </p>
                    )}
                    {r.clarificationQuestion && (
                      <div className="mt-1.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                          <strong>Hospital Admin asked:</strong> {r.clarificationQuestion}
                        </p>
                        {r.status === S.CLARIFICATION_NEEDED ? (
                          <div className="mt-2 space-y-1.5">
                            <Input
                              value={replyFor === r.id ? reply : ''}
                              onChange={(e) => { setReplyFor(r.id); setReply(e.target.value); }}
                              placeholder="Justify your request to the Hospital Admin"
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={replyFor !== r.id || !reply.trim()}
                                onClick={() => { replyClarification(r.id, reply); setReplyFor(null); setReply('' ); }}
                              >
                                <Send className="w-3.5 h-3.5" /> Reply to Hospital Admin
                              </Button>
                            </div>
                          </div>
                        ) : (
                          r.clarificationReply && (
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                              <strong>Your reply:</strong> {r.clarificationReply}
                            </p>
                          )
                        )}
                      </div>
                    )}
                    {r.hospitalAdminApproved && r.hospitalAdminNotes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <strong>Hospital Admin approved:</strong> {r.hospitalAdminNotes}
                      </p>
                    )}
                    <div className="mt-2"><StatusTimeline request={r} /></div>
                  </div>
                  <Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ============================================================================
   2. HOSPITAL ADMIN - approve, ask why, or reject (same hospital)
   ============================================================================ */
export function HospitalAdminPanel() {
  const { askClarification, hospitalAdminApprove, rejectAtHospitalAdmin, visible, RD_STATUS: S } = useRedistribution();
  const queue = visible(RD_STAGE.HOSPITAL_ADMIN);

  const [askTarget, setAskTarget] = useState(null);
  const [question, setQuestion] = useState('');
  const [noteTarget, setNoteTarget] = useState(null);
  const [note, setNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <div className="space-y-4">
      <Card title="Medicine Redistribution Requests" subtitle={queue.length + ' awaiting your verification at this hospital'}>
        {queue.length === 0 ? (
          <p className="text-xs text-slate-400">Nothing waiting for approval.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[840px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 pr-3 font-semibold">Requested By</th>
                  <th className="py-2 pr-3 font-semibold">Medicine</th>
                  <th className="py-2 pr-3 font-semibold">Qty</th>
                  <th className="py-2 pr-3 font-semibold">Reason</th>
                  <th className="py-2 pr-3 font-semibold">Target</th>
                  <th className="py-2 font-semibold text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {queue.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="py-3 pr-3">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.requestedByPharmacistName}</div>
                      <div className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-700 dark:text-slate-300">{r.medicineName}</td>
                    <td className="py-3 pr-3 text-xs font-mono text-slate-700 dark:text-slate-300">{r.quantity}</td>
                    <td className="py-3 pr-3 text-[11px] text-slate-600 dark:text-slate-400 max-w-[200px]">
                      {r.pharmacistReason || '-'}
                      {r.clarificationReply && (
                        <span className="block mt-1 text-emerald-600 dark:text-emerald-400">
                          <strong>Reply:</strong> {r.clarificationReply}
                        </span>
                      )}
                      {r.status === S.CLARIFICATION_NEEDED && (
                        <span className="block mt-1 text-amber-600 dark:text-amber-400">
                          <strong>Awaiting reply:</strong> {r.clarificationQuestion}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-600 dark:text-slate-400">{r.targetHospitalName}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => { setAskTarget(r); setQuestion(''); }}>
                          <MessageCircleQuestion className="w-3.5 h-3.5" /> Ask Why
                        </Button>
                        <Button size="sm" variant="success" onClick={() => { setNoteTarget(r); setNote(''); }}>
                          <ShieldCheck className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => { setRejectTarget(r); setRejectReason(''); }}>
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {askTarget && (
        <Modal isOpen onClose={() => setAskTarget(null)} title="Ask Pharmacist for Clarification" subtitle={askTarget.medicineName}>
          <div className="space-y-3">
            <Input
              label="Your question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Why is this needed when we hold 200 units?"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAskTarget(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => { askClarification(askTarget.id, question); setAskTarget(null); }}>
                <MessageSquarePlus className="w-4 h-4" /> Send Question
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {noteTarget && (
        <Modal isOpen onClose={() => setNoteTarget(null)} title="Approve and Forward to System Admin" subtitle={noteTarget.medicineName}>
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              This moves the request to <strong>PENDING_SYSTEM_ADMIN</strong>. The other hospital is
              <strong> not</strong> contacted yet.
            </p>
            <Input
              label="Approval note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Confirmed stock-out, quantity reasonable"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setNoteTarget(null)}>Cancel</Button>
              <Button variant="success" onClick={() => { hospitalAdminApprove(noteTarget.id, note); setNoteTarget(null); }}>
                <ShieldCheck className="w-4 h-4" /> Approve and Forward
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {rejectTarget && (
        <Modal isOpen onClose={() => setRejectTarget(null)} title="Reject Request" subtitle={rejectTarget.medicineName}>
          <div className="space-y-3">
            <Input
              label="Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Quantity exceeds our reserve"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { rejectAtHospitalAdmin(rejectTarget.id, rejectReason); setRejectTarget(null); }}>
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


/* ============================================================================
   3. SYSTEM ADMIN - only sees what a hospital admin already approved
   ============================================================================ */
export function SystemAdminPanel() {
  const { systemAdminApprove, rejectAtSystemAdmin, visible, counts } = useRedistribution();
  const queue = visible(RD_STAGE.SYSTEM_ADMIN);
  const [target, setTarget] = useState(null);
  const [comment, setComment] = useState('');

  return (
    <Card
      title="Redistribution Approvals"
      subtitle="Only requests already approved by a Hospital Admin appear here"
      headerAction={<Badge variant={counts.pendingSystemAdmin > 0 ? 'warning' : 'success'}>{counts.pendingSystemAdmin} pending</Badge>}
    >
      {queue.length === 0 ? (
        <p className="text-xs text-slate-400">No requests waiting for network approval.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-2 pr-3 font-semibold">From - To</th>
                <th className="py-2 pr-3 font-semibold">Medicine</th>
                <th className="py-2 pr-3 font-semibold">Qty</th>
                <th className="py-2 pr-3 font-semibold">Pharmacist Reason</th>
                <th className="py-2 pr-3 font-semibold">Hospital Admin Note</th>
                <th className="py-2 font-semibold text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {queue.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="py-3 pr-3 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{r.sourceHospitalName}</div>
                    <ArrowRight className="w-3 h-3 inline my-0.5" />
                    <div>{r.targetHospitalName}</div>
                  </td>
                  <td className="py-3 pr-3 text-xs text-slate-700 dark:text-slate-300">{r.medicineName}</td>
                  <td className="py-3 pr-3 text-xs font-mono text-slate-700 dark:text-slate-300">{r.quantity}</td>
                  <td className="py-3 pr-3 text-[11px] text-slate-600 dark:text-slate-400">{r.pharmacistReason || '-'}</td>
                  <td className="py-3 pr-3 text-[11px] text-slate-600 dark:text-slate-400">{r.hospitalAdminNotes || '-'}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="success" onClick={() => { setTarget(r); setComment(''); }}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => { setTarget(r); setComment(''); }}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {target && (
        <Modal isOpen onClose={() => setTarget(null)} title="System Admin Decision" subtitle={target.medicineName + ' x' + target.quantity}>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
              <p>Pharmacist reason: {target.pharmacistReason || '-'}</p>
              <p className="mt-1">Hospital Admin: {target.hospitalAdminNotes || '-'}</p>
            </div>
            <Input label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Network-level note" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { rejectAtSystemAdmin(target.id, comment); setTarget(null); }}>
                <XCircle className="w-4 h-4" /> Reject
              </Button>
              <Button variant="success" onClick={() => { systemAdminApprove(target.id, comment); setTarget(null); }}>
                <Bell className="w-4 h-4" /> Approve and Notify Target
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}

/* ============================================================================
   4. TARGET HOSPITAL - the popup. Only appears after system approval.
   ============================================================================ */
export function TargetHospitalPanel() {
  const { targetAccept, targetReject, visible } = useRedistribution();
  const incoming = visible(RD_STAGE.TARGET);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');

  return (
    <Card
      title="Incoming Stock Requests"
      subtitle="Requests from other hospitals - sent only after System Admin approval"
      headerAction={<Badge variant={incoming.length > 0 ? 'info' : 'default'}>{incoming.length} new</Badge>}
    >
      {incoming.length === 0 ? (
        <p className="text-xs text-slate-400">No incoming stock requests.</p>
      ) : (
        <ul className="space-y-2.5">
          {incoming.map((r) => (
            <li key={r.id} className="p-3.5 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/25">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-sky-600" />
                    {r.medicineName} <span className="text-slate-400">x{r.quantity}</span>
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                    From <strong>{r.sourceHospitalName}</strong> - requested by {r.requestedByPharmacistName}
                  </p>
                  {r.targetNotification && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">{r.targetNotification}</p>
                  )}
                  {r.hospitalAdminNotes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <strong>Source hospital admin:</strong> {r.hospitalAdminNotes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="success" onClick={() => targetAccept(r.id)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => { setRejectTarget(r); setReason(''); }}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {rejectTarget && (
        <Modal isOpen onClose={() => setRejectTarget(null)} title="Decline Stock Transfer" subtitle={rejectTarget.medicineName}>
          <div className="space-y-3">
            <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Cannot spare stock this week" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { targetReject(rejectTarget.id, reason); setRejectTarget(null); }}>
                <XCircle className="w-4 h-4" /> Decline
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}