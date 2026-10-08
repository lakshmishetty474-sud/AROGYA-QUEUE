import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Download,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Printer,
  Smartphone,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useHealthcare } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency } from '../../utils/formatters';
import { downloadPaymentReceipt, downloadQRImage } from '../../utils/exportHelpers';
import { UPI_ID, buildUpiUri, openUpiApp, copyToClipboard } from '../../utils/upi';

/**
 * PaymentQRModal
 * ---------------------------------------------------------------------------
 * Collects a hospital bill and renders a REAL UPI QR.
 *
 * The QR encodes a upi://pay intent built by buildUpiUri(), never an https
 * link - that is what makes a scan hand off to PhonePe / Google Pay / Paytm
 * rather than opening a browser tab. The same intent powers the
 * "Pay via UPI App" button, so desktop users without a scanner are covered too.
 *
 * Intentionally static: no scanning laser, no pulsing, no transitions.
 */
export function PaymentQRModal({
  isOpen,
  onClose,
  defaultAmount = 500,
  defaultPatientId = '',
  defaultPatientName = '',
  defaultCategory = 'OPD Consultation',
}) {
  const {
    patients,
    activeHospitalId,
    hospitals,
    recordPayment,
    showToast,
  } = useHealthcare();

  const [amount, setAmount] = useState(defaultAmount);
  const [patientId, setPatientId] = useState(defaultPatientId);
  const [patientName, setPatientName] = useState(defaultPatientName);
  const [category, setCategory] = useState(defaultCategory);
  const [transactionRef, setTransactionRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);
  const qrRef = useRef(null);

  const activeHospital = hospitals?.find((h) => h.id === activeHospitalId) || hospitals?.[0] || {
    name: 'Arogya Central Hospital',
    city: 'Bangalore',
  };

  const hospitalPatients = patients?.filter((p) => p.hospitalId === activeHospitalId) || patients || [];

  useEffect(() => {
    if (defaultAmount) setAmount(defaultAmount);
    if (defaultPatientId) setPatientId(defaultPatientId);
    if (defaultPatientName) setPatientName(defaultPatientName);
  }, [defaultAmount, defaultPatientId, defaultPatientName, isOpen]);

  // The live intent. Recomputed as the amount or bill reference changes so the
  // QR on screen always matches what the payer is about to be charged.
  const upiUri = useMemo(
    () =>
      buildUpiUri({
        amount,
        billId: lastPayment?.billNumber || transactionRef.trim(),
        note: lastPayment?.billNumber
          ? `Hospital Bill ${lastPayment.billNumber}`
          : `Hospital Payment ${category}`,
      }),
    [amount, lastPayment?.billNumber, transactionRef, category]
  );

  const handlePatientSelect = (e) => {
    const pId = e.target.value;
    setPatientId(pId);
    const found = hospitalPatients.find((p) => p.id === pId);
    if (found) setPatientName(found.name);
  };

  const copyUpiId = async () => {
    const ok = await copyToClipboard(UPI_ID);
    setCopiedUpi(ok);
    showToast(ok ? `UPI ID copied: ${UPI_ID}` : 'Could not access the clipboard', ok ? 'info' : 'error');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  /** Export the *rendered* QR (not the static placeholder image) as a card PNG. */
  const handleDownloadQr = () => {
    const canvas = qrRef.current;
    if (!canvas) {
      showToast('QR is not ready yet', 'error');
      return;
    }
    downloadQRImage(upiUri, 'Arogya_Queue_UPI_QR.png', canvas.toDataURL('image/png'));
  };

  const handlePayViaApp = () => {
    openUpiApp(upiUri);
    showToast('Opening your UPI app...', 'info');
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const selectedPatient = hospitalPatients.find((p) => p.id === patientId);
    const finalPatientName = patientName || selectedPatient?.name || 'Walk-in Guest Patient';

    try {
      const generatedTxn = transactionRef.trim() || `UPI-APP-${Date.now().toString().slice(-7)}`;
      const paymentRec = await recordPayment({
        patientId: selectedPatient?.id || null,
        patientName: finalPatientName,
        totalAmount: Number(amount) || 500,
        consultationFee: category === 'OPD Consultation' ? Number(amount) : 0,
        labFee: category === 'Lab Diagnostics' ? Number(amount) : 0,
        medicineFee: category === 'Pharmacy' ? Number(amount) : 0,
        bedCharges: category === 'Inpatient Admission' ? Number(amount) : 0,
        otherCharges: ['OPD Consultation', 'Lab Diagnostics', 'Pharmacy', 'Inpatient Admission'].includes(category)
          ? 0
          : Number(amount),
        method: 'UPI',
        transactionId: generatedTxn,
        hospitalId: activeHospitalId,
      });

      setLastPayment(paymentRec);
      showToast(`Payment of ₹${amount} confirmed for ${finalPatientName}`, 'success');
    } catch (err) {
      showToast('Error recording payment: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!lastPayment) return;
    const selectedPatient = hospitalPatients.find((p) => p.id === lastPayment.patientId) || {
      id: lastPayment.patientId,
      name: lastPayment.patientName,
      token: 'T-WALKIN',
      mobile: '+91 98765 43210',
    };
    downloadPaymentReceipt(lastPayment, selectedPatient, activeHospital);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Arogya Instant UPI Payment Terminal"
      subtitle="Scan with Google Pay, PhonePe, Paytm or BHIM - or pay straight from this device"
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* ---------- Left: the live UPI QR ---------- */}
        <div className="flex flex-col items-center text-center p-4 bg-gradient-to-b from-slate-50 to-teal-50/40 dark:from-slate-900/60 dark:to-teal-950/20 rounded-2xl border border-teal-200/50 dark:border-teal-900/50 shadow-inner">
          <div className="relative">
            <div className="w-56 h-56 bg-white p-3 rounded-2xl shadow-xl border-2 border-teal-500/20 flex items-center justify-center">
              <QRCodeCanvas
                ref={qrRef}
                value={upiUri}
                size={200}
                level="H"
                marginSize={1}
                bgColor="#ffffff"
                fgColor="#0f766e"
              />
            </div>

            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> NPCI Verified
            </span>
          </div>

          <p className="mt-5 text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrency(amount)}
          </p>

          <div className="mt-2 w-full">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span>UPI ID:</span>
              <code className="bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded text-teal-700 dark:text-teal-300 font-mono text-xs">
                {UPI_ID}
              </code>
              <button
                type="button"
                onClick={copyUpiId}
                className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded"
                title="Copy UPI ID"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Zero transaction surcharge. Instant automated settlement.
            </p>

            {/* Primary action for phones: hand the intent straight to the UPI app */}
            <Button
              variant="primary"
              size="sm"
              className="w-full mt-3"
              onClick={handlePayViaApp}
              icon={Smartphone}
            >
              Pay via UPI App
            </Button>

            <div className="mt-2 flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleDownloadQr}
                icon={Download}
              >
                Download QR
              </Button>
              {lastPayment && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handlePrintReceipt}
                  icon={Printer}
                >
                  Print Bill
                </Button>
              )}
            </div>

            {/* exactly what the QR encodes, for debugging and support */}
            <details className="mt-3 w-full text-left">
              <summary className="cursor-pointer text-[10px] text-slate-400 select-none">
                Show QR payload
              </summary>
              <code className="mt-1 block break-all text-[9px] text-slate-500 dark:text-slate-400">
                {upiUri}
              </code>
            </details>
          </div>
        </div>

        {/* ---------- Right: the bill form ---------- */}
        <div className="space-y-4">
          {lastPayment ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                  Payment Successfully Logged
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Receipt #{lastPayment.billNumber} · ₹{lastPayment.totalAmount}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                  TXN: {lastPayment.transactionId}
                </p>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePrintReceipt}
                  icon={Printer}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Download Receipt PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => setLastPayment(null)}>
                  New Payment
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Category
                </label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={[
                    { value: 'OPD Consultation', label: 'OPD Consultation' },
                    { value: 'Lab Diagnostics', label: 'Lab Diagnostics & Tests' },
                    { value: 'Pharmacy', label: 'Pharmacy Medication' },
                    { value: 'Inpatient Admission', label: 'Inpatient Bed & Care' },
                    { value: 'Blood Transfusion', label: 'Blood Bank Requisition' },
                    { value: 'Emergency Triage', label: 'Emergency & Trauma Care' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Patient (Optional)
                </label>
                <Select
                  value={patientId}
                  onChange={handlePatientSelect}
                  options={[
                    { value: '', label: 'Walk-in / Direct Counter Patient' },
                    ...hospitalPatients.map((p) => ({
                      value: p.id,
                      label: `${p.name} (${p.token || p.id}) - ${p.department || 'General'}`,
                    })),
                  ]}
                />
              </div>

              {!patientId && (
                <Input
                  label="Patient / Payee Name"
                  placeholder="Enter patient full name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payable Amount (₹)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter amount in ₹"
                />

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[100, 250, 500, 1000, 1500, 2500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                        amount === amt
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="UPI Reference / UTR Number (Optional)"
                placeholder="e.g. 423984928392 or leave empty to auto-generate"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
              />

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                    Total Settle
                  </span>
                  <span className="text-base font-extrabold text-teal-600 dark:text-teal-400">
                    {formatCurrency(amount)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    loading={isProcessing}
                    icon={CheckCircle2}
                  >
                    Confirm UPI Pay
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}