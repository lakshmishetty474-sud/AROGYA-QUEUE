import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../utils/storage';
import { useHealthcare } from './AppContext';

/* ============================================================================
   BookingVerification
   ----------------------------------------------------------------------------
   Owns the receptionist-verification workflow for bed, ambulance and
   appointment bookings, plus lab-report sharing between lab and doctor.

   WHY A SEPARATE CONTEXT
   ----------------------
   AppContext is ~2700 lines and already owns the booking arrays. Rewriting
   those objects in place risked breaking working code. This layer therefore
   keeps its OWN record keyed by request id and never mutates AppContext:

       requestKey = `${type}:${id}`   e.g. "bed:RES-1042"

   The effective status of any request is resolved by getStatus(), which
   prefers the verification record and falls back to the original booking
   status. Nothing existing is removed or rewritten - the verification data is
   purely additive.

   STATUS FLOW
   -----------
     pending_verification  (default for every new booking)
        -> confirmed_by_receptionist   (receptionist clicked Confirm)
        -> rejected                    (receptionist gave a reason)
   ============================================================================ */

export const VERIFICATION = {
  PENDING: 'pending_verification',
  CONFIRMED: 'confirmed_by_receptionist',
  REJECTED: 'rejected',
};

export const BOOKING_TYPE = {
  BED: 'bed',
  AMBULANCE: 'ambulance',
  APPOINTMENT: 'appointment',
};

const BookingVerificationContext = createContext(null);

export function BookingVerificationProvider({ children }) {
  const { currentUser } = useHealthcare();

  /* requestKey -> { status, reason, note, calledAt, calledBy } */
  const [records, setRecords] = useState(() => storage.getItem('bookingVerifications', {}));

  /* [{ id, requestKey, type, requestId, patientName, phone, outcome, reason, note, calledAt, calledBy }] */
  const [callLogs, setCallLogs] = useState(() => storage.getItem('bookingCallLogs', []));

  /* [{ id, testKey, patientId, patientName, testName, doctorId, doctorName, sharedAt, seen, payload }] */
  const [sharedReports, setSharedReports] = useState(() => storage.getItem('sharedLabReports', []));

  useEffect(() => {
    storage.setItem('bookingVerifications', records);
  }, [records]);
  useEffect(() => {
    storage.setItem('bookingCallLogs', callLogs);
  }, [callLogs]);
  useEffect(() => {
    storage.setItem('sharedLabReports', sharedReports);
  }, [sharedReports]);

  const keyFor = useCallback((type, id) => `${type}:${id}`, []);

  /* Resolve the effective status. Anything with no verification record yet is
     PENDING by definition - that is what stops a booking being auto-confirmed. */
  const getStatus = useCallback(
    (type, item) => {
      if (!item) return VERIFICATION.PENDING;
      const rec = records[keyFor(type, item.id)];
      if (rec && rec.status) return rec.status;
      return VERIFICATION.PENDING;
    },
    [records, keyFor]
  );

  const decide = useCallback(
    (type, item, outcome, reason, note) => {
      const requestKey = keyFor(type, item.id);
      const stamp = new Date().toISOString();

      setRecords((prev) => ({
        ...prev,
        [requestKey]: {
          status: outcome === 'confirm' ? VERIFICATION.CONFIRMED : VERIFICATION.REJECTED,
          reason: reason || '',
          note: note || '',
          calledAt: stamp,
          calledBy: currentUser?.name || 'Reception',
        },
      }));

      setCallLogs((prev) => [
        {
          id: 'CALL-' + Date.now() + '-' + Math.floor(Math.random() * 900 + 100),
          requestKey,
          type,
          requestId: item.id,
          patientName: item.patientName || item.name || 'Patient',
          phone: item.mobile || item.phone || '',
          outcome,
          reason: reason || '',
          note: note || '',
          calledAt: stamp,
          calledBy: currentUser?.name || 'Reception',
        },
        ...prev,
      ]);
    },
    [keyFor, currentUser]
  );

  const confirmBooking = useCallback((type, item, note) => decide(type, item, 'confirm', '', note), [decide]);
  const rejectBooking = useCallback((type, item, reason, note) => decide(type, item, 'reject', reason, note), [decide]);

  /* Add a follow-up note without changing the decision. */
  const addCallNote = useCallback(
    (type, item, note) => {
      if (!note || !note.trim()) return;
      const requestKey = keyFor(type, item.id);
      const stamp = new Date().toISOString();
      setRecords((prev) => ({
        ...prev,
        [requestKey]: { ...(prev[requestKey] || {}), note, calledAt: stamp },
      }));
      setCallLogs((prev) => [
        {
          id: 'NOTE-' + Date.now(),
          requestKey,
          type,
          requestId: item.id,
          patientName: item.patientName || 'Patient',
          phone: item.mobile || '',
          outcome: 'note',
          reason: '',
          note,
          calledAt: stamp,
          calledBy: currentUser?.name || 'Reception',
        },
        ...prev,
      ]);
    },
    [keyFor, currentUser]
  );

  const logsFor = useCallback((type, id) => callLogs.filter((l) => l.requestKey === keyFor(type, id)), [callLogs, keyFor]);

  /* --------------------------- lab report sharing --------------------------- */

  const shareReport = useCallback(
    (payload) => {
      const report = {
        id: 'SHR-' + Date.now() + '-' + Math.floor(Math.random() * 900 + 100),
        sharedAt: new Date().toISOString(),
        seen: false,
        ...payload,
      };
      setSharedReports((prev) => [report, ...prev]);
      return report;
    },
    []
  );

  const markReportSeen = useCallback((reportId) => {
    setSharedReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, seen: true } : r)));
  }, []);

  /* Reports addressed to a specific doctor, newest first. */
  const reportsForDoctor = useCallback(
    (doctorName) =>
      sharedReports.filter((r) => {
        if (!doctorName) return true;
        const target = String(r.doctorName || '').toLowerCase();
        const wanted = String(doctorName).toLowerCase();
        return target === wanted || target.includes(wanted) || wanted.includes(target);
      }),
    [sharedReports]
  );

  const value = useMemo(
    () => ({
      VERIFICATION,
      BOOKING_TYPE,
      records,
      callLogs,
      sharedReports,
      getStatus,
      confirmBooking,
      rejectBooking,
      addCallNote,
      logsFor,
      shareReport,
      markReportSeen,
      reportsForDoctor,
      keyFor,
    }),
    [
      records,
      callLogs,
      sharedReports,
      getStatus,
      confirmBooking,
      rejectBooking,
      addCallNote,
      logsFor,
      shareReport,
      markReportSeen,
      reportsForDoctor,
      keyFor,
    ]
  );

  return <BookingVerificationContext.Provider value={value}>{children}</BookingVerificationContext.Provider>;
}

export function useBookingVerification() {
  const ctx = useContext(BookingVerificationContext);
  if (!ctx) {
    throw new Error('useBookingVerification must be used inside BookingVerificationProvider');
  }
  return ctx;
}

export default BookingVerificationProvider;