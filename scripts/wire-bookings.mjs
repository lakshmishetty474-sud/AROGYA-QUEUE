/**
 * Patient-side wiring: the three booking functions in AppContext now write a
 * real Pending row to Supabase, so the receptionist sees them immediately and
 * approval comes back over the same realtime channel.
 *
 * The functions stay SYNCHRONOUS on purpose. Callers in PatientPortal use the
 * returned object straight away, so making them async would break them. Local
 * state, toasts and return values are untouched; the insert is a side effect
 * that reports its own failure without taking the UI down.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/context/AppContext.jsx';
let t = readFileSync(file, 'utf8');
const log = [];

/* ------------------------------ 1. import ------------------------------ */
if (!t.includes("from '../services/approvalService'")) {
  const anchor = t.match(/^import .*supabaseService.*$/m);
  if (anchor) {
    t = t.replace(anchor[0], anchor[0] + "\nimport { submitRequest } from '../services/approvalService';");
    log.push('AppContext: approvalService import added');
  } else {
    log.push('AppContext: IMPORT ANCHOR MISS');
  }
} else {
  log.push('AppContext: import already present');
}

/* --------------------------- 2. shared helper --------------------------- */
if (!t.includes('pushSupabaseApproval')) {
  const helper = `
  /**
   * Mirror a booking into the Supabase approval queue.
   *
   * Fire and forget on purpose: the optimistic local record and its toast have
   * already been shown, so a network or schema failure must not roll that back.
   * The error is surfaced as its own toast and the receptionist simply will not
   * see this particular request.
   */
  const pushSupabaseApproval = useCallback((kind, row) => {
    submitRequest(kind, row)
      .then(({ error }) => {
        if (error) {
          showToast(
            'Saved locally, but the approval queue could not be reached: ' + error.message,
            'error'
          );
        }
      })
      .catch((err) => {
        showToast('Saved locally, approval queue unreachable: ' + err.message, 'error');
      });
  }, [showToast]);

`;
  const spot = '  // Cancel Appointment';
  if (t.includes(spot)) {
    t = t.replace(spot, helper + spot);
    log.push('AppContext: pushSupabaseApproval helper added');
  } else {
    log.push('AppContext: HELPER ANCHOR MISS');
  }
}

/* ------------------------- 3. appointment insert ------------------------- */
{
  const anchor = "    showToast(`Appointment ${aptId} booked successfully!`, 'success');";
  if (!t.includes('kind: \'appointment\'') && t.includes(anchor)) {
    const block = `    // Real approval queue row - the receptionist approves this.
    pushSupabaseApproval('appointment', {
      patient_name: newAppointment.patientName,
      doctor: newAppointment.doctor,
      date_time: (() => {
        // combine the chosen date + slot when both are present
        if (formData.date && formData.timeSlot) {
          const m = /(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i.exec(formData.timeSlot);
          if (m) {
            let hh = Number(m[1]) % 12;
            if (/pm/i.test(m[3])) hh += 12;
            const d = new Date(formData.date);
            d.setHours(hh, Number(m[2]), 0, 0);
            return d.toISOString();
          }
        }
        return new Date().toISOString();
      })(),
    });

`;
    t = t.replace(anchor, block + anchor);
    log.push('AppContext: bookAppointment -> appointments insert');
  } else {
    log.push('AppContext: appointment insert already present or anchor missing');
  }
}

/* --------------------------- 4. bed insert --------------------------- */
{
  const anchor = "    setNotifications((prev) => [notif, ...prev]);\n\n    showToast(\n      newReservation.isEmergency";
  if (t.includes(anchor)) {
    const block = `    setNotifications((prev) => [notif, ...prev]);

    // Real approval queue row - approving it blocks one free bed.
    pushSupabaseApproval('bed', {
      patient_name: newReservation.patientName,
      bed_type: formData.bedType || newReservation.bedType,
      hospital: formData.hospitalName || newReservation.hospitalName,
    });

`;
    t = t.replace(anchor, block);
    log.push('AppContext: requestBedReservation -> bed_requests insert');
  } else {
    log.push('AppContext: bed insert anchor missing');
  }
}

/* ------------------------- 5. ambulance insert ------------------------- */
{
  const anchor = "    setNotifications((prev) => [driverNotif, patientNotif, ...prev]);";
  if (t.includes(anchor)) {
    const block = `    setNotifications((prev) => [driverNotif, patientNotif, ...prev]);

    // Real approval queue row - the front desk dispatches the unit.
    pushSupabaseApproval('ambulance', {
      patient_name: newRequest.patientName,
      pickup_location: reqData.pickupLocation || newRequest.pickupLocation,
    });

`;
    t = t.replace(anchor, block);
    log.push('AppContext: requestAmbulance -> ambulance_requests insert');
  } else {
    log.push('AppContext: ambulance insert anchor missing');
  }
}

/* --------------- 6. add pushSupabaseApproval to the 3 dep arrays --------------- */
{
  const deps = [
    ['  }, [activeHospitalId, currentUser, showToast]);', 'bookAppointment'],
    ['  }, [activeHospitalId, currentUser, hospitals, showToast]);', 'requestBedReservation'],
    ['  }, [currentUser, hospitals, showToast]);', 'requestAmbulance'],
  ];
  for (const [dep, name] of deps) {
    // only patch the occurrence that closes the function we just touched
    const at = t.indexOf(dep);
    if (at === -1) { log.push('AppContext: dep array not found for ' + name); continue; }
    if (t.includes(dep.replace('});', ', pushSupabaseApproval]);'))) {
      log.push('AppContext: deps already patched for ' + name);
      continue;
    }
    t = t.slice(0, at) + dep.replace('});', ', pushSupabaseApproval]);') + t.slice(at + dep.length);
    log.push('AppContext: deps patched for ' + name);
  }
}

writeFileSync(file, t, 'utf8');
console.log(log.map((l) => '  ' + l).join('\n'));