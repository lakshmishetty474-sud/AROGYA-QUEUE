import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../utils/storage';
import { useHealthcare } from './AppContext';

/* ============================================================================
   RedistributionContext - two-level approval for medicine stock transfers
   ----------------------------------------------------------------------------
   Replaces the old direct pharmacist -> other-hospital request with a chain:

     Pharmacist  ->  Hospital Admin (same hospital)  ->  System Admin
                                                          ->  Target Hospital

   A pharmacist can no longer reach another hospital directly. Their request
   lands with their OWN hospital admin first, is forwarded to the system admin
   only after approval, and the target hospital is notified ONLY once the
   system admin has approved.

   STATUS CHAIN
     PENDING_HOSPITAL_ADMIN
       -> CLARIFICATION_NEEDED -> (reply) -> PENDING_HOSPITAL_ADMIN
       -> PENDING_SYSTEM_ADMIN
          -> APPROVED_BY_SYSTEM_ADMIN -> SENT_TO_TARGET
             -> ACCEPTED_BY_TARGET   (stock actually moves)
             -> REJECTED             (rejected at any stage)
   ============================================================================ */

export const RD_STATUS = {
  PENDING_HOSPITAL_ADMIN: 'PENDING_HOSPITAL_ADMIN',
  CLARIFICATION_NEEDED: 'CLARIFICATION_NEEDED',
  PENDING_SYSTEM_ADMIN: 'PENDING_SYSTEM_ADMIN',
  APPROVED_BY_SYSTEM_ADMIN: 'APPROVED_BY_SYSTEM_ADMIN',
  SENT_TO_TARGET: 'SENT_TO_TARGET',
  ACCEPTED_BY_TARGET: 'ACCEPTED_BY_TARGET',
  REJECTED: 'REJECTED',
};

export const RD_STAGE = {
  PHARMACIST: 'PHARMACIST',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  TARGET: 'TARGET',
};

const Ctx = createContext(null);

export function RedistributionProvider({ children }) {
  const { currentUser, hospitals, medicines, setMedicines, showToast, activeHospitalId } = useHealthcare();

  const [requests, setRequests] = useState(() => storage.getItem('redistributionRequests', []));

  useEffect(() => {
    storage.setItem('redistributionRequests', requests);
  }, [requests]);

  const hospName = useCallback((id) => hospitals.find((h) => h.id === id)?.name || 'Unknown Hospital', [hospitals]);
  const stamp = () => new Date().toISOString();

  const pushEvent = (req, status, actor, note) => [
    ...(req.timeline || []),
    { status, note: note || '', at: stamp(), by: actor?.name || 'System' },
  ];

  const update = useCallback((id, fn) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? fn(r) : r)));
  }, []);

  /* ------------------------- 1. pharmacist requests ------------------------- */
  const createRequest = useCallback(
    ({ medicineName, quantity, reason, targetHospitalId }) => {
      const qty = Number(quantity);
      if (!medicineName) return { ok: false, error: 'Select a medicine' };
      if (!qty || qty <= 0) return { ok: false, error: 'Enter a valid quantity' };
      if (!targetHospitalId) return { ok: false, error: 'Select a target hospital' };
      const sourceHospitalId = activeHospitalId || currentUser?.hospitalId || 'HOSP-01';
      if (targetHospitalId === sourceHospitalId) return { ok: false, error: 'Target must be a different hospital' };

      const sourceMed = medicines.find((m) => m.hospitalId === sourceHospitalId && m.name === medicineName);

      const req = {
        id: 'RD-' + Date.now().toString(36).toUpperCase(),
        requestedByPharmacistId: currentUser?.id || null,
        requestedByPharmacistName: currentUser?.name || 'Pharmacist',
        sourceHospitalId,
        sourceHospitalName: hospName(sourceHospitalId),
        targetHospitalId,
        targetHospitalName: hospName(targetHospitalId),
        medicineName,
        quantity: qty,
        pharmacistReason: reason || '',
        status: RD_STATUS.PENDING_HOSPITAL_ADMIN,
        hospitalAdminId: null,
        hospitalAdminApproved: false,
        hospitalAdminNotes: '',
        systemAdminId: null,
        systemAdminApproved: false,
        systemAdminComment: '',
        clarificationQuestion: '',
        clarificationReply: '',
        targetDecision: null,
        availableAtSource: sourceMed ? sourceMed.quantity : 0,
        createdAt: stamp(),
        timeline: [],
      };
      req.timeline = pushEvent(req, RD_STATUS.PENDING_HOSPITAL_ADMIN, currentUser, 'Requested by pharmacist');

      setRequests((prev) => [req, ...prev]);
      showToast('Request sent to Hospital Admin for verification', 'success');
      return { ok: true, id: req.id };
    },
    [currentUser, medicines, hospName, activeHospitalId, showToast]
  );

  /* --------------------- 2. hospital admin: ask why ---------------------- */
  const askClarification = useCallback(
    (id, question) => {
      update(id, (r) => ({
        ...r,
        status: RD_STATUS.CLARIFICATION_NEEDED,
        clarificationQuestion: question || 'Please justify this request.',
        clarificationReply: '',
        timeline: pushEvent(r, RD_STATUS.CLARIFICATION_NEEDED, currentUser, question),
      }));
      showToast('Clarification requested from pharmacist', 'info');
    },
    [update, currentUser, showToast]
  );

  const replyClarification = useCallback(
    (id, reply) => {
      update(id, (r) => ({
        ...r,
        status: RD_STATUS.PENDING_HOSPITAL_ADMIN,
        clarificationReply: reply || '',
        timeline: pushEvent(r, RD_STATUS.PENDING_HOSPITAL_ADMIN, currentUser, 'Pharmacist replied'),
      }));
      showToast('Reply sent to Hospital Admin', 'success');
    },
    [update, currentUser, showToast]
  );

  /* ------------------ 3. hospital admin: approve / reject ------------------ */
  const hospitalAdminApprove = useCallback(
    (id, notes) => {
      update(id, (r) => ({
        ...r,
        status: RD_STATUS.PENDING_SYSTEM_ADMIN,
        hospitalAdminId: currentUser?.id || null,
        hospitalAdminApproved: true,
        hospitalAdminNotes: notes || '',
        timeline: pushEvent(r, RD_STATUS.PENDING_SYSTEM_ADMIN, currentUser, notes),
      }));
      showToast('Approved and forwarded to System Admin', 'success');
    },
    [update, currentUser, showToast]
  );

  const rejectAtHospitalAdmin = useCallback(
    (id, reason) => {
      update(id, (r) => ({
        ...r,
        status: RD_STATUS.REJECTED,
        hospitalAdminId: currentUser?.id || null,
        hospitalAdminApproved: false,
        hospitalAdminNotes: reason || '',
        timeline: pushEvent(r, RD_STATUS.REJECTED, currentUser, reason),
      }));
      showToast('Request rejected by Hospital Admin', 'error');
    },
    [update, currentUser, showToast]
  );

  /* ------------------- 4. system admin: approve / reject ------------------- */
  const systemAdminApprove = useCallback(
    (id, comment) => {
      update(id, (r) => ({
        ...r,
        status: RD_STATUS.SENT_TO_TARGET,
        systemAdminId: currentUser?.id || null,
        systemAdminApproved: true,
        systemAdminComment: comment || '',
        timeline: pushEvent(r, RD_STATUS.APPROVED_BY_SYSTEM_ADMIN, currentUser, comment),
        // The popup to the OTHER hospital is raised only here, never before.
        targetNotification: `New Stock Redistribution Request from ${r.sourceHospitalName} for ${r.medicineName} x ${r.quantity}. Reason: ${r.pharmacistReason || 'not stated'}`,
        targetNotifiedAt: stamp(),
      }));
      showToast('Approved - request sent to target hospital', 'success');
    },
    [update, currentUser, showToast]
  );

  const rejectAtSystemAdmin = useCallback(
    (id, comment) => {
      update(id, (r) => ({
        ...r,
        status: RD_STATUS.REJECTED,
        systemAdminId: currentUser?.id || null,
        systemAdminApproved: false,
        systemAdminComment: comment || '',
        timeline: pushEvent(r, RD_STATUS.REJECTED, currentUser, comment),
      }));
      showToast('Request rejected by System Admin', 'error');
    },
    [update, currentUser, showToast]
  );

  /* ---- 5. target hospital decides - only reachable after system approval ---- */
  const targetAccept = useCallback(
    (id) => {
      const req = requests.find((r) => r.id === id);
      if (!req) return;

      // Verify the source can still cover it before anything is written.
      const src = medicines.find(
        (m) => m.hospitalId === req.sourceHospitalId && m.name === req.medicineName
      );
      if (!src || src.quantity < req.quantity) {
        showToast(`Source hospital no longer holds ${req.quantity} ${req.medicineName}`, 'error');
        return;
      }

      // Stock moves only here. This is a plain independent update - nesting a
      // setMedicines inside the setRequests updater would be silently dropped.
      setMedicines((all) => {
        let next = all.map((m) =>
          m.id === src.id ? { ...m, quantity: m.quantity - req.quantity } : m
        );
        const dest = next.find(
          (m) => m.hospitalId === req.targetHospitalId && m.name === req.medicineName
        );
        if (dest) {
          next = next.map((m) =>
            m.id === dest.id ? { ...m, quantity: m.quantity + req.quantity } : m
          );
        } else {
          next = [
            ...next,
            {
              id: 'MED-' + Date.now(),
              hospitalId: req.targetHospitalId,
              name: src.name,
              dosageForm: src.dosageForm,
              category: src.category,
              batch: src.batch + '-TR',
              quantity: req.quantity,
              minStock: src.minStock,
              expiry: src.expiry,
              status: 'In Stock',
            },
          ];
        }
        return next;
      });

      update(id, (r) => ({
        ...r,
        status: RD_STATUS.ACCEPTED_BY_TARGET,
        targetDecision: 'accepted',
        transferredAt: stamp(),
        timeline: pushEvent(r, RD_STATUS.ACCEPTED_BY_TARGET, currentUser,
          `Stock moved: ${req.quantity} ${req.medicineName}`),
      }));
      showToast(`Accepted - ${req.quantity} ${req.medicineName} transferred`, 'success');
    },
    [requests, medicines, setMedicines, update, currentUser, showToast]
  );

  const targetReject = useCallback(
    (id, reason) => {
      update(id, (r) => ({
        ...r,
        status: RD_STATUS.REJECTED,
        targetDecision: 'rejected',
        systemAdminComment: `${r.systemAdminComment || ''}${r.systemAdminComment ? ' | ' : ''}Target declined: ${reason || 'not stated'}`,
        timeline: pushEvent(r, RD_STATUS.REJECTED, currentUser, reason),
      }));
      showToast('Transfer declined by target hospital', 'error');
    },
    [update, currentUser, showToast]
  );

  /* --------------------------- query helpers --------------------------- */
  const visible = useCallback(
    (stage) => {
      const me = activeHospitalId || currentUser?.hospitalId || 'HOSP-01';
      switch (stage) {
        case RD_STAGE.PHARMACIST:
          return requests.filter((r) => r.sourceHospitalId === me);
        case RD_STAGE.HOSPITAL_ADMIN:
          return requests.filter(
            (r) =>
              r.sourceHospitalId === me &&
              [RD_STATUS.PENDING_HOSPITAL_ADMIN, RD_STATUS.CLARIFICATION_NEEDED].includes(r.status)
          );
        case RD_STAGE.SYSTEM_ADMIN:
          return requests.filter((r) => r.status === RD_STATUS.PENDING_SYSTEM_ADMIN);
        case RD_STAGE.TARGET:
          return requests.filter((r) => r.targetHospitalId === me && r.status === RD_STATUS.SENT_TO_TARGET);
        default:
          return requests;
      }
    },
    [requests, activeHospitalId, currentUser]
  );

  const counts = useMemo(
    () => ({
      pendingHospitalAdmin: requests.filter((r) => r.status === RD_STATUS.PENDING_HOSPITAL_ADMIN).length,
      clarification: requests.filter((r) => r.status === RD_STATUS.CLARIFICATION_NEEDED).length,
      pendingSystemAdmin: requests.filter((r) => r.status === RD_STATUS.PENDING_SYSTEM_ADMIN).length,
      sentToTarget: requests.filter((r) => r.status === RD_STATUS.SENT_TO_TARGET).length,
      accepted: requests.filter((r) => r.status === RD_STATUS.ACCEPTED_BY_TARGET).length,
      rejected: requests.filter((r) => r.status === RD_STATUS.REJECTED).length,
    }),
    [requests]
  );

  const value = useMemo(
    () => ({
      RD_STATUS, RD_STAGE, requests, counts, visible,
      createRequest, askClarification, replyClarification,
      hospitalAdminApprove, rejectAtHospitalAdmin,
      systemAdminApprove, rejectAtSystemAdmin,
      targetAccept, targetReject,
    }),
    [
      requests, counts, visible, createRequest, askClarification, replyClarification,
      hospitalAdminApprove, rejectAtHospitalAdmin, systemAdminApprove, rejectAtSystemAdmin,
      targetAccept, targetReject,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRedistribution() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRedistribution must be used inside RedistributionProvider');
  return ctx;
}

export default RedistributionProvider;