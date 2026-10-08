import { HospitalAdminPanel } from '../components/redistribution/RedistributionPanels';
import React, { useState } from 'react';
import {
  Building,
  BedDouble,
  UserCheck,
  FileText,
  CreditCard,
  QrCode,
  Download,
  Plus,
  CheckCircle2,
  Calendar,
  DollarSign,
  Printer,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import { useHealthcare } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { BedMatrixGrid } from '../components/modules/BedMatrixGrid';
import { SmartBedMatcher } from '../components/modules/SmartBedMatcher';
import { PaymentQRModal } from '../components/modules/PaymentQRModal';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';
import { downloadPaymentReceipt, downloadDischargeSummary, downloadQRImage } from '../utils/exportHelpers';

export function HospitalOS() {
  const {
    beds,
    assignBed,
    releaseBed,
    admissions,
    discharges,
    dischargePatient,
    payments,
    recordPayment,
    patients,
    activeHospitalId,
    hospitals,
    showToast,
    bedReservations,
    approveBedReservation,
    rejectBedReservation,
    cancelBedReservation,
    admitReservedBed,
  } = useHealthcare();

  // Submodule navigation tab: 'beds' | 'reservations' | 'admissions' | 'discharges' | 'payments'
  const [activeSubmodule, setActiveSubmodule] = useState('beds');

  const activeHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[0];
  const hospitalBeds = beds.filter((b) => b.hospitalId === activeHospitalId);
  const hospitalPatients = patients.filter((p) => p.hospitalId === activeHospitalId);
  const hospitalAdmissions = admissions.filter((a) => a.hospitalId === activeHospitalId);
  const hospitalDischarges = discharges.filter((d) => d.hospitalId === activeHospitalId);
  const hospitalPayments = payments.filter((p) => p.hospitalId === activeHospitalId);
  const hospitalReservations = bedReservations?.filter((r) => r.hospitalId === activeHospitalId) || [];
  const pendingReservationsCount = hospitalReservations.filter((r) => r.status === 'Pending').length;

  // Discharge modal state
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [dischargeTargetPatientId, setDischargeTargetPatientId] = useState(hospitalPatients[0]?.id || '');
  const [dischargeForm, setDischargeForm] = useState({
    diagnosis: 'Recovery post-acute management',
    treatmentSummary: 'Completed full antibiotic course with stable vitals.',
    medicines: '- Tab. Paracetamol 650mg SOS\n- Tab. Pantoprazole 40mg OD AC (5 days)',
    dischargeCondition: 'Clinically Stable / Ambulatory',
    followUpDate: '2026-09-18',
    finalBill: 1650,
    paymentMethod: 'UPI',
  });

  // Discharge Handler
  const handleDischargeSubmit = (e) => {
    e.preventDefault();
    if (!dischargeTargetPatientId) {
      showToast('Select patient for discharge', 'error');
      return;
    }
    const record = dischargePatient(dischargeTargetPatientId, dischargeForm);
    setDischargeModalOpen(false);
    downloadDischargeSummary(record, hospitalPatients.find((p) => p.id === dischargeTargetPatientId), activeHospital);
  };

  // Fast QR Payment Terminal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [terminalAmount, setTerminalAmount] = useState(500);
  const [terminalPatientId, setTerminalPatientId] = useState('');
  const [terminalCategory, setTerminalCategory] = useState('OPD Consultation');
  const [terminalUtr, setTerminalUtr] = useState('');
  const [isProcessingTerminalPay, setIsProcessingTerminalPay] = useState(false);

  const handleRecordTerminalPayment = async (e) => {
    e.preventDefault();
    setIsProcessingTerminalPay(true);
    const selectedPatient = hospitalPatients.find((p) => p.id === terminalPatientId);
    try {
      const rec = await recordPayment({
        patientId: selectedPatient?.id || null,
        patientName: selectedPatient?.name || 'Counter Walk-in Patient',
        totalAmount: Number(terminalAmount) || 500,
        consultationFee: terminalCategory === 'OPD Consultation' ? Number(terminalAmount) : 0,
        labFee: terminalCategory === 'Lab Diagnostics' ? Number(terminalAmount) : 0,
        medicineFee: terminalCategory === 'Pharmacy' ? Number(terminalAmount) : 0,
        otherCharges: ['OPD Consultation', 'Lab Diagnostics', 'Pharmacy'].includes(terminalCategory)
          ? 0
          : Number(terminalAmount),
        method: 'UPI',
        transactionId: terminalUtr.trim() || `UPI-TXN-${Date.now().toString().slice(-7)}`,
        hospitalId: activeHospitalId,
      });
      if (rec) {
        downloadPaymentReceipt(rec, selectedPatient, activeHospital);
      }
      setTerminalUtr('');
    } catch (err) {
      showToast('Error recording payment: ' + err.message, 'error');
    } finally {
      setIsProcessingTerminalPay(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pharmacist redistribution requests must clear this hospital first */}
      <HospitalAdminPanel />

      {/* Discharge Wizard Modal */}
      <Modal
        isOpen={dischargeModalOpen}
        onClose={() => setDischargeModalOpen(false)}
        title="Patient Inpatient Discharge Protocol"
        subtitle="Finalize treatment summary, release bed, and issue billing summary"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleDischargeSubmit} className="space-y-4 text-xs">
          <Select
            label="Select Inpatient to Discharge"
            options={hospitalPatients.map((p) => ({ value: p.id, label: `${p.name} (${p.token}) - ${p.status}` }))}
            value={dischargeTargetPatientId}
            onChange={(e) => setDischargeTargetPatientId(e.target.value)}
          />

          <Input
            label="Discharge Condition"
            value={dischargeForm.dischargeCondition}
            onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeCondition: e.target.value })}
          />

          <Input
            label="Clinical Treatment Summary"
            value={dischargeForm.treatmentSummary}
            onChange={(e) => setDischargeForm({ ...dischargeForm, treatmentSummary: e.target.value })}
          />

          <Input
            label="Discharge Medications Advised"
            value={dischargeForm.medicines}
            onChange={(e) => setDischargeForm({ ...dischargeForm, medicines: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Follow-up Date"
              type="date"
              value={dischargeForm.followUpDate}
              onChange={(e) => setDischargeForm({ ...dischargeForm, followUpDate: e.target.value })}
            />
            <Input
              label="Final Hospital Bill (₹)"
              type="number"
              value={dischargeForm.finalBill}
              onChange={(e) => setDischargeForm({ ...dischargeForm, finalBill: e.target.value })}
            />
            <Select
              label="Settlement Method"
              options={['UPI', 'Card', 'Cash', 'Insurance Claim']}
              value={dischargeForm.paymentMethod}
              onChange={(e) => setDischargeForm({ ...dischargeForm, paymentMethod: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setDischargeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Download}>
              Finalize Discharge & Download Summary
            </Button>
          </div>
        </form>
      </Modal>

      {/* Header & Submodule Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              Inpatient Management Core
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {activeHospital?.name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Building className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600 dark:text-teal-400" />
            Hospital Operating System (Hospital OS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            End-to-end bed allocation matrix, inpatient admissions, clinical discharges, and billing.
          </p>
        </div>

        {/* Submodule tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800 shadow-sm self-start lg:self-auto">
          {[
            { key: 'beds', label: 'Bed Matrix', icon: BedDouble },
            {
              key: 'reservations',
              label: `Bed Reservations (${pendingReservationsCount})`,
              icon: BedDouble,
            },
            { key: 'admissions', label: 'Admissions', icon: UserCheck },
            { key: 'discharges', label: 'Discharges', icon: FileText },
            { key: 'payments', label: 'Payments', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubmodule === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSubmodule(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/15 to-teal-500/5 text-teal-700 dark:text-teal-300 border border-teal-500/30 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBMODULE 1: BED MATRIX & SMART MATCHING */}
      {activeSubmodule === 'beds' && (
        <div className="space-y-6">
          <SmartBedMatcher
            patients={hospitalPatients.filter((p) => p.status !== 'Discharged')}
            beds={hospitalBeds}
            onAssignBed={assignBed}
          />

          <Card className="glass-card shadow-xl border border-slate-200/80 dark:border-slate-800" title="Facility Bed Matrix Telemetry" subtitle="Live occupancy across all floors and wards">
            <BedMatrixGrid beds={hospitalBeds} onReleaseBed={releaseBed} />
          </Card>
        </div>
      )}

      {/* SUBMODULE: BED RESERVATIONS */}
      {activeSubmodule === 'reservations' && (
        <Card
          title="Inpatient Bed Reservation Requests"
          subtitle="Review, approve, and assign reserved beds for standard and emergency patient requests"
          headerAction={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveSubmodule('beds')}
              icon={BedDouble}
            >
              View Bed Matrix
            </Button>
          }
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Ward Requested</th>
                  <th className="px-4 py-3">Emergency</th>
                  <th className="px-4 py-3">Clinical Reason</th>
                  <th className="px-4 py-3">Requested At</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Bed Allocation</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {hospitalReservations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No bed reservation requests for this hospital facility.
                    </td>
                  </tr>
                ) : (
                  hospitalReservations.map((res) => {
                    const isPending = res.status === 'Pending';
                    const isReserved = res.status === 'Reserved';
                    return (
                      <tr key={res.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {res.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {res.patientName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {res.mobile}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold">
                          {res.ward} Ward
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant={res.isEmergency ? 'danger' : 'default'}
                            size="sm"
                          >
                            {res.isEmergency ? 'ðŸš¨ CRITICAL EMERGENCY' : 'Standard'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 max-w-xs truncate text-slate-600 dark:text-slate-300 text-[11px]" title={res.reason}>
                          {res.reason}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                          {formatDate(res.requestedAt)} {new Date(res.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant={
                              res.status === 'Reserved'
                                ? 'success'
                                : res.status === 'Pending'
                                ? 'warning'
                                : res.status === 'Admitted'
                                ? 'teal'
                                : 'default'
                            }
                            size="sm"
                          >
                            {res.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {res.bedNumber ? `Bed #${res.bedNumber}` : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {isPending && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => approveBedReservation(res.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                                onClick={() => rejectBedReservation(res.id, 'Capacity full in requested ward')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {isReserved && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                className="bg-teal-600 hover:bg-teal-700 text-white"
                                onClick={() => admitReservedBed(res.id)}
                              >
                                Admit Patient
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                                onClick={() => cancelBedReservation(res.id)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* SUBMODULE 2: ADMISSIONS */}
      {activeSubmodule === 'admissions' && (
        <Card
          title="Active Inpatient Admissions"
          subtitle="Hospital inpatient directory and bed assignments"
          headerAction={
            <Button variant="primary" size="sm" onClick={() => setActiveSubmodule('beds')} icon={Plus}>
              New Bed Admission
            </Button>
          }
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Admission ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Ward & Bed</th>
                  <th className="px-4 py-3">Department & Doctor</th>
                  <th className="px-4 py-3">Admission Time</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {hospitalAdmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No active inpatient admissions for this hospital.
                    </td>
                  </tr>
                ) : (
                  hospitalAdmissions.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {adm.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {adm.patientName}
                        </span>
                        <span className="text-[10px] text-slate-400">{adm.attendantName}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="teal" size="sm">
                          {adm.ward} — {adm.bedNumber}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">{adm.department}</span>
                        <span className="text-[10px] text-slate-400">{adm.doctor}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {formatDate(adm.admissionDate)} {formatTime(adm.admissionDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={adm.emergencyStatus === 'Critical' ? 'emergency' : 'success'} size="sm">
                          {adm.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* SUBMODULE 3: DISCHARGES */}
      {activeSubmodule === 'discharges' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDischargeModalOpen(true)}
              icon={Plus}
            >
              Initiate Patient Discharge
            </Button>
          </div>

          <Card title="Clinical Discharge Registry" subtitle="Completed discharges with generated summaries" noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Discharge ID</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Attending Doctor</th>
                    <th className="px-4 py-3">Exit Condition</th>
                    <th className="px-4 py-3">Final Bill</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {hospitalDischarges.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No discharge records in this facility.
                      </td>
                    </tr>
                  ) : (
                    hospitalDischarges.map((dis) => (
                      <tr key={dis.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {dis.id}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                          {dis.patientName}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {dis.doctor}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant="success" size="sm">
                            {dis.dischargeCondition}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 font-bold font-mono">
                          {formatCurrency(dis.finalBill)}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-400">
                          {dis.dischargeDate}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              downloadDischargeSummary(
                                dis,
                                hospitalPatients.find((p) => p.id === dis.patientId),
                                activeHospital
                              )
                            }
                            icon={Download}
                          >
                            Summary
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* SUBMODULE 4: PAYMENTS & BILLING */}
      {activeSubmodule === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Payment History Table */}
          <Card
            className="lg:col-span-2"
            title="Hospital Billing & Payments Ledger"
            subtitle="Itemized charges including consultation, diagnostics, medicines, and bed fees"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Charges Breakdown</th>
                    <th className="px-4 py-3">Total (₹)</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {hospitalPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    hospitalPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {pay.billNumber}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                          {pay.patientName}
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-slate-500">
                          Consult: ₹{pay.consultationFee} • Lab: ₹{pay.labFee} • Meds: ₹{pay.medicineFee}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(pay.totalAmount)}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={pay.paymentStatus === 'Paid' ? 'success' : 'warning'} size="sm">
                            {pay.method} ({pay.paymentStatus})
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              downloadPaymentReceipt(
                                pay,
                                hospitalPatients.find((p) => p.id === pay.patientId),
                                activeHospital
                              )
                            }
                            icon={Printer}
                          >
                            Print
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Right Col: Interactive Fast QR Payment Terminal */}
          <Card
            title="Fast QR Payment Terminal"
            subtitle="Official UPI Gateway for instant zero-contact settlement"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaymentModalOpen(true)}
                icon={Maximize2}
              >
                Expand Terminal
              </Button>
            }
          >
            <div className="flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              {/* Actual Uploaded QR Code Container */}
              <div
                className="relative group cursor-pointer"
                onClick={() => setPaymentModalOpen(true)}
                title="Click to expand scan window"
              >
                <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-md border-2 border-teal-500/30 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-75 top-3" />
                  <img
                    src="/payment-qr.png"
                    alt="Arogya Queue Official UPI QR Code"
                    className="w-40 h-40 object-contain rounded-xl group-hover:scale-105"
                  />
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Scan with any UPI
                </span>
              </div>

              <div className="mt-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                Arogya Queue National Health Gateway
              </div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Supports Google Pay, PhonePe, Paytm, BHIM, RuPay, and Net Banking.
              </p>

              {/* Fast Terminal Quick Payment Form */}
              <form onSubmit={handleRecordTerminalPayment} className="mt-4 w-full text-left space-y-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-700">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Quick Amount (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={terminalAmount}
                      onChange={(e) => setTerminalAmount(Number(e.target.value))}
                      className="text-xs font-bold"
                    />
                  </div>
                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[100, 250, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTerminalAmount(amt)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          terminalAmount === amt
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Patient (Optional)
                  </label>
                  <Select
                    value={terminalPatientId}
                    onChange={(e) => setTerminalPatientId(e.target.value)}
                    options={[
                      { value: '', label: 'Counter Walk-in / Unregistered' },
                      ...hospitalPatients.map((p) => ({
                        value: p.id,
                        label: `${p.name} (${p.token || p.id})`,
                      })),
                    ]}
                  />
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={isProcessingTerminalPay}
                  icon={CheckCircle2}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-2"
                >
                  Verify & Settle Payment (₹{terminalAmount})
                </Button>
              </form>

              <div className="mt-3 flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => downloadQRImage('upi://pay?pa=arogyaqueue@upi&pn=ArogyaQueue')}
                  icon={Download}
                >
                  Download QR
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    if (hospitalPayments[0]) {
                      downloadPaymentReceipt(hospitalPayments[0], hospitalPatients[0], activeHospital);
                    } else {
                      showToast('No recent transaction to download', 'info');
                    }
                  }}
                  icon={FileText}
                >
                  Last Receipt
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Global Payment QR Modal */}
      <PaymentQRModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        defaultAmount={terminalAmount}
        defaultPatientId={terminalPatientId}
        defaultCategory={terminalCategory}
      />
    </div>
  );
}
