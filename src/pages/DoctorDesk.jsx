import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  Users,
  FlaskConical,
  Pill,
  CheckCircle2,
  Plus,
  Trash2,
  Send,
  AlertTriangle,
  FileSpreadsheet,
  Activity,
  HeartPulse,
  Volume2,
  History,
  FileText,
  Sparkles,
  Search,
  ScanFace,
  Download,
} from 'lucide-react';
import { MotionStrip } from '../components/motion/MotionKit';
import { SharedLabReportsPanel } from '../components/common/SharedLabReportsPanel';
import { useHealthcare } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { BiometricFaceLoginModal } from '../components/modules/BiometricFaceLoginModal';
import { formatTime } from '../utils/formatters';
import { announceToken, subscribeVoiceWarnings } from '../utils/translations';
import { storage } from '../utils/storage';
import { downloadDischargeSummary } from '../utils/exportHelpers';
import { DoctorDutySelf } from '../components/duty/DutyViews';

const COMMON_LAB_TESTS = [
  'CBC (Complete Blood Count)',
  'Blood Sugar (Fasting & PP)',
  '12-Lead ECG',
  'Cardiac Enzymes (CK-MB & Troponin)',
  'Knee X-ray (AP & Lateral)',
  'Chest X-Ray PA View',
  'HbA1c Glycated Hemoglobin',
  'Lipid Profile Comprehensive',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT / RFT)',
  'CT Scan Brain Plain',
  'MRI Lumbar Spine',
  'Serum Electrolytes',
  'Troponin-I STAT',
  'Thyroid Profile (T3, T4, TSH)',
];

// Symptom-Based Decision Support Rules (Demo mappings)
export const getSymptomSuggestions = (symptomText = '') => {
  const s = (symptomText || '').toLowerCase();
  const suggestions = [];

  // Chest pain / Chest discomfort
  if (s.includes('chest') || s.includes('angina') || s.includes('arm pain') || s.includes('heart') || s.includes('palpitation')) {
    suggestions.push('12-Lead ECG', 'Cardiac Enzymes (CK-MB & Troponin)', 'Blood Sugar (Fasting & PP)', 'CBC (Complete Blood Count)');
  }
  // Fever / Weakness
  if (s.includes('fever') || s.includes('chills') || s.includes('weakness') || s.includes('body ache') || s.includes('pyrexia')) {
    suggestions.push('CBC (Complete Blood Count)', 'Blood Sugar (Fasting & PP)', 'Serum Electrolytes');
  }
  // Knee pain / Knee injury / Joint stiffness
  if (s.includes('knee') || s.includes('joint') || s.includes('fracture') || s.includes('injury') || s.includes('swelling') || s.includes('bone')) {
    suggestions.push('Knee X-ray (AP & Lateral)', 'CBC (Complete Blood Count)');
  }
  // Breathing difficulty / Respiratory
  if (s.includes('breath') || s.includes('dyspnea') || s.includes('cough') || s.includes('wheez') || s.includes('respiratory') || s.includes('sob')) {
    suggestions.push('12-Lead ECG', 'Chest X-Ray PA View', 'CBC (Complete Blood Count)');
  }
  // Diabetes / High blood sugar concern
  if (s.includes('diabet') || s.includes('sugar') || s.includes('glucose') || s.includes('thirst') || s.includes('polyuria')) {
    suggestions.push('Blood Sugar (Fasting & PP)', 'HbA1c Glycated Hemoglobin', 'Kidney Function Test (KFT / RFT)');
  }

  // De-duplicate while preserving order
  const unique = Array.from(new Set(suggestions));
  if (unique.length === 0) {
    return ['CBC (Complete Blood Count)', 'Blood Sugar (Fasting & PP)'];
  }
  return unique;
};

const PRESCRIBABLE_MEDS = [
  'Paracetamol 650mg',
  'Amoxicillin 500mg',
  'Azithromycin 500mg',
  'Cetirizine 10mg',
  'Pantoprazole 40mg',
  'Metformin 500mg SR',
  'Amlodipine 5mg',
  'Atorvastatin 10mg',
  'Insulin Glargine 100 IU/ml',
  'Ibuprofen 400mg',
  'Omeprazole 20mg',
  'Losartan 50mg',
  'Cefixime 200mg',
  'Ondansetron 4mg',
];

export function DoctorDesk() {
  const {
    patients,
    hospitals,
    activeHospitalId,
    updatePatientClinical,
    addLabRequest,
    removeLabRequest,
    addPrescription,
    updatePatientStatus,
    showToast,
  } = useHealthcare();

  const activeHospital = hospitals?.find((h) => h.id === activeHospitalId) || hospitals?.[0] || { name: 'Arogya Central Hospital' };

  // Patients in this hospital who are Waiting or In Consultation
  const doctorQueue = patients.filter((p) => p.hospitalId === activeHospitalId);
  const [selectedPatientId, setSelectedPatientId] = useState(doctorQueue[0]?.id || null);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || doctorQueue[0];

  const handleDownloadPatientDischargePDF = () => {
    if (!selectedPatient) return;
    const dischargeData = {
      id: `DIS-${selectedPatient.token || '2026-DOC'}`,
      admissionId: `ADM-2026-${selectedPatient.token?.replace(/[^0-9]/g, '') || '801'}`,
      admissionDate: selectedPatient.registeredAt ? new Date(selectedPatient.registeredAt).toISOString().split('T')[0] : '2026-09-22',
      dischargeDate: new Date().toISOString().split('T')[0],
      diagnosis: diagnosis || selectedPatient.diagnosis || selectedPatient.symptoms || 'Outpatient Clinical Evaluation & Management',
      treatmentSummary: `Patient examined in OPD Consultation room. Symptoms evaluated: ${symptoms || selectedPatient.symptoms || 'General malaise'}. Clinical vitals reviewed: BP ${vitals.bp}, Pulse ${vitals.pulse} bpm, SpO2 ${vitals.spo2}. Prescriptions and lab diagnostic panel advised.`,
      conditionOnDischarge: 'Clinically Stable / Discharged Ambulatory',
      medicationsAdvised: (selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0)
        ? selectedPatient.prescriptions.map((rx) => `- Tab. ${rx.medicine} (${rx.dosage}, ${rx.frequency}) for ${rx.duration}`).join('\n')
        : '- Tab. Paracetamol 650mg SOS after food\n- Tab. Pantoprazole 40mg OD AC (5 days)',
      dietAdvice: 'Normal well-balanced diet, adequate hydration, return to emergency if fever recurs.',
      followUpDate: '2026-10-02',
      consultant: selectedPatient.doctor || 'Dr. Priya Nair, MD (Internal Medicine)',
      medicalSuperintendent: 'Dr. Ramesh Babu, Medical Director',
    };
    downloadDischargeSummary(dischargeData, selectedPatient, activeHospital);
    showToast(`Official Discharge Summary PDF downloaded for ${selectedPatient.name}`, 'success');
  };

  // Clinical state
  const [diagnosis, setDiagnosis] = useState(selectedPatient?.diagnosis || '');
  const [symptoms, setSymptoms] = useState(selectedPatient?.symptoms || '');
  const [vitals, setVitals] = useState({
    bp: selectedPatient?.vitals?.bp || '120/80',
    pulse: selectedPatient?.vitals?.pulse || 74,
    temp: selectedPatient?.vitals?.temp || '98.6°F',
    spo2: selectedPatient?.vitals?.spo2 || '98%',
  });

  // Lab test order builder
  const [selectedTest, setSelectedTest] = useState(COMMON_LAB_TESTS[0]);
  const [testPriority, setTestPriority] = useState('Routine');
  const [testInstructions, setTestInstructions] = useState('');

  // Decision-support selected suggestions state
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);

  // Compute symptom-based suggestions dynamically
  const currentSuggestions = useMemo(() => {
    return getSymptomSuggestions(symptoms || selectedPatient?.symptoms || '');
  }, [symptoms, selectedPatient?.symptoms]);

  const toggleSuggestion = (testName) => {
    setSelectedSuggestions((prev) =>
      prev.includes(testName) ? prev.filter((t) => t !== testName) : [...prev, testName]
    );
  };

  const handleOrderSelectedSuggestions = () => {
    if (!selectedPatient) return;
    if (selectedSuggestions.length === 0) {
      showToast('Please select at least one suggested test to order', 'error');
      return;
    }
    const orders = selectedSuggestions.map((tName) => ({
      testName: tName,
      priority: testPriority || 'Routine',
      instructions: `Decision-support order for: ${symptoms || selectedPatient.symptoms || 'symptoms'}`,
      department: selectedPatient.department || 'Diagnostic Labs',
    }));
    addLabRequest(selectedPatient.id, orders);
    setSelectedSuggestions([]);
  };

  const handleRemoveLab = (testId) => {
    if (!selectedPatient) return;
    removeLabRequest(selectedPatient.id, testId);
  };

  // Digital prescription builder
  const [rxList, setRxList] = useState([
    {
      medicine: 'Paracetamol 650mg',
      dosage: '1 Tablet',
      frequency: 'Thrice daily (TID)',
      duration: '5 days',
      instructions: 'After meals with water',
    },
  ]);

  // Update form fields when selected patient changes
  const handleSelectPatient = (pat) => {
    setSelectedPatientId(pat.id);
    setDiagnosis(pat.diagnosis || '');
    setSymptoms(pat.symptoms || '');
    setSelectedSuggestions([]);
    setVitals({
      bp: pat.vitals?.bp || '120/80',
      pulse: pat.vitals?.pulse || 74,
      temp: pat.vitals?.temp || '98.6°F',
      spo2: pat.vitals?.spo2 || '98%',
    });
  };

  const handleSaveClinicalNotes = () => {
    if (!selectedPatient) return;
    updatePatientClinical(selectedPatient.id, { diagnosis, vitals, symptoms });
    if (selectedPatient.status === 'Waiting') {
      updatePatientStatus(selectedPatient.id, 'In Consultation');
    }
  };

  const handleOrderLab = (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    addLabRequest(selectedPatient.id, {
      testName: selectedTest,
      priority: testPriority,
      instructions: testInstructions,
      department: selectedPatient.department || 'Diagnostic Labs',
    });
    setTestInstructions('');
  };

  const handleAddRxRow = () => {
    setRxList([
      ...rxList,
      {
        medicine: PRESCRIBABLE_MEDS[0],
        dosage: '1 Tablet',
        frequency: 'Twice daily (BID)',
        duration: '5 days',
        instructions: 'After meals',
      },
    ]);
  };

  const [speechLang, setSpeechLang] = useState(() => storage.getItem('announcementLang', 'en'));
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Non-blocking warning notification if voice pack is not installed on device
  useEffect(() => {
    const unsub = subscribeVoiceWarnings((msg) => {
      showToast(msg, 'info');
    });
    return unsub;
  }, [showToast]);

  const handleVoiceLangChange = (code) => {
    setSpeechLang(code);
    storage.setItem('announcementLang', code);
  };

  const handleCallNext = () => {
    const nextWaiting = doctorQueue.find((p) => p.status === 'Waiting');
    if (!nextWaiting) {
      showToast('No waiting patients in queue', 'info');
      return;
    }
    handleSelectPatient(nextWaiting);
    updatePatientStatus(nextWaiting.id, 'In Consultation', 'Doctor called next patient into consultation room');
    announceToken(nextWaiting.token, 'Consultation Room 101', speechLang);
    showToast(`Called Token #${nextWaiting.token} for consultation`, 'success');
  };

  const handleAnnounceCurrent = () => {
    if (selectedPatient) {
      announceToken(selectedPatient.token, 'Consultation Room 101', speechLang, { force: true });
      showToast(`Announced Token #${selectedPatient.token} over speaker`, 'info');
    }
  };

  const handleRemoveRxRow = (idx) => {
    setRxList(rxList.filter((_, i) => i !== idx));
  };

  const handleSavePrescription = () => {
    if (!selectedPatient) return;
    if (rxList.length === 0) {
      showToast('Add at least one medication to prescribe', 'error');
      return;
    }
    addPrescription(selectedPatient.id, rxList);
    updatePatientStatus(selectedPatient.id, 'Pharmacy');
  };

  return (
    <div className="space-y-6"
>
      <DoctorDutySelf />
      <SharedLabReportsPanel />

      <MotionStrip variant="doctor" />
      {/* Patient Medical History Modal */}
      {selectedPatient && (
        <Modal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title={`Medical History & Clinical Dossier`}
          subtitle={`${selectedPatient.name} • ${selectedPatient.uhid || selectedPatient.id} • ${selectedPatient.gender}, ${selectedPatient.age} yrs`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">UHID / Patient ID</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                  {selectedPatient.uhid || `UHID-2026-${selectedPatient.token}`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Blood Group</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedPatient.bloodGroup || 'O +ve'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Emergency Contact</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedPatient.emergencyContact || selectedPatient.mobile || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Known Allergies</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {Array.isArray(selectedPatient.allergies) && selectedPatient.allergies.length > 0
                    ? selectedPatient.allergies.join(', ')
                    : selectedPatient.allergies || 'None Recorded (NKDA)'}
                </span>
              </div>
            </div>

            {/* Medical History Log */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-teal-600" />
                Previous Consultations & Chronic Conditions
              </h4>
              <div className="space-y-2">
                {[
                  {
                    date: '2026-06-14',
                    diagnosis: 'Acute Upper Respiratory Tract Infection',
                    doctor: 'Dr. Priya Nair',
                    notes: 'Treated with Amoxicillin course; complete resolution observed.',
                  },
                  {
                    date: '2026-01-20',
                    diagnosis: 'Essential Hypertension Grade 1',
                    doctor: 'Dr. Arvind Sharma',
                    notes: 'Advised lifestyle modification, low sodium diet, and regular BP monitoring.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800"
                  >
                    <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
                      <span>{item.diagnosis}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{item.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{item.doctor} • {item.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostic Investigations */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                Diagnostic Lab & Imaging Requests
              </h4>
              {selectedPatient.labRequests && selectedPatient.labRequests.length > 0 ? (
                <div className="space-y-2">
                  {selectedPatient.labRequests.map((lab, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{lab.testName}</span>
                      <Badge variant="purple" size="sm">{lab.priority || 'Routine'}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">No lab investigations requested for this visit.</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900/90 via-slate-900 to-slate-950 p-6 text-white border border-teal-800/40 shadow-xl">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Live OPD Consultation Active
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300">
                {doctorQueue.filter((p) => p.status === 'Waiting').length} In Queue
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                <Stethoscope className="w-5 h-5" />
              </div>
              Doctor Clinical Workspace (OPD Desk)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Real-time consultation desk with speech token announcement, clinical vitals triage, diagnostics ordering, and digital e-prescriptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Voice Announcement Language Selector */}
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md p-1 rounded-xl text-[11px] border border-white/10">
              <span className="text-slate-300 px-1 font-semibold">Voice:</span>
              {[
                { code: 'en', label: '🇬🇧 EN' },
                { code: 'hi', label: '🇮🇳 HI' },
                { code: 'kn', label: '🇮🇳 KN' },
              ].map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleVoiceLangChange(l.code)}
                  className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    speechLang === l.code
                      ? 'bg-teal-500 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setBiometricModalOpen(true)}
              className="bg-white/15 hover:bg-white/25 text-white border-white/10"
              title="Camera Face Biometrics Enrolled"
            >
              <ScanFace className="w-3.5 h-3.5 mr-1 text-teal-300" />
              Face ID Verified
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleCallNext}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
            >
              <Volume2 className="w-4 h-4 mr-1.5" />
              CALL NEXT
            </Button>

            {selectedPatient && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAnnounceCurrent}
                  className="bg-white/15 hover:bg-white/25 text-white border-white/10"
                  title="Re-announce this token over speaker"
                >
                  <Volume2 className="w-3.5 h-3.5 mr-1 text-teal-300" />
                  Announce #{selectedPatient.token}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setHistoryModalOpen(true)}
                  className="bg-white/15 hover:bg-white/25 text-white border-white/10"
                >
                  <History className="w-3.5 h-3.5 mr-1 text-teal-300" />
                  History
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadPatientDischargePDF}
                  className="bg-white/15 hover:bg-white/25 text-white border-white/10"
                  title="Download official unalterable discharge summary PDF"
                >
                  <Download className="w-3.5 h-3.5 mr-1 text-teal-300" />
                  Discharge PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePatientStatus(selectedPatient.id, 'In Consultation')}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Start Consult
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => updatePatientStatus(selectedPatient.id, 'Discharged', 'Consultation finalized')}
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                >
                  Finalize
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Doctor OPD Patient Queue */}
        <Card title="Today's OPD Queue" subtitle="Assigned outpatients for consultation" noPadding>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[70vh] overflow-y-auto">
            {doctorQueue.length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center">No patients in queue.</p>
            ) : (
              doctorQueue.map((pat) => {
                const isSelected = selectedPatient?.id === pat.id;
                return (
                  <div
                    key={pat.id}
                    onClick={() => handleSelectPatient(pat)}
                    className={`p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-l-4 border-teal-600 dark:border-teal-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-teal-700 dark:text-teal-300">
                        {pat.token}
                      </span>
                      <Badge
                        variant={
                          pat.priority === 'Emergency'
                            ? 'emergency'
                            : pat.status === 'In Consultation'
                            ? 'teal'
                            : 'default'
                        }
                        size="sm"
                      >
                        {pat.status}
                      </Badge>
                    </div>

                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {pat.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {pat.age} yrs • {pat.gender} • {pat.department}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right 2 Columns: Clinical Examination, Lab Tests & Prescription */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPatient ? (
            <>
              {/* Selected Patient Banner */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {selectedPatient.name}
                    </h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold">
                      {selectedPatient.token}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPatient.age} yrs • {selectedPatient.gender} • Mobile: {selectedPatient.mobile} • Dept: {selectedPatient.department}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={selectedPatient.priority === 'Emergency' ? 'emergency' : 'teal'} size="md">
                    {selectedPatient.priority} Priority
                  </Badge>
                </div>
              </div>

              {/* Clinical Vitals & Diagnosis Section */}
              <Card title="Clinical Notes & Vitals">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <Input
                    label="Blood Pressure"
                    placeholder="120/80"
                    value={vitals.bp}
                    onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  />
                  <Input
                    label="Pulse (bpm)"
                    type="number"
                    placeholder="72"
                    value={vitals.pulse}
                    onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  />
                  <Input
                    label="Temperature"
                    placeholder="98.6°F"
                    value={vitals.temp}
                    onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  />
                  <Input
                    label="SpO2 (%)"
                    placeholder="98%"
                    value={vitals.spo2}
                    onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <Input
                    label="Presenting Symptoms & History"
                    placeholder="Symptoms described by patient"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                  <Input
                    label="Provisional Clinical Diagnosis"
                    placeholder="e.g. Acute Bronchitis, Viral Pyrexia"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <Button variant="secondary" size="sm" onClick={handleSaveClinicalNotes}>
                    Save Clinical Observations
                  </Button>
                </div>
              </Card>

              {/* Diagnostic Lab Tests Request */}
              <Card
                title="Diagnostic Investigations"
                subtitle="Request pathology and radiology tests directly for lab processing"
              >
                {/* Clinical Decision Support Recommendations */}
                {currentSuggestions.length > 0 && (
                  <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-violet-500/10 via-primary-500/10 to-transparent border border-violet-200 dark:border-violet-900/50">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        <span className="text-xs font-bold text-violet-900 dark:text-violet-300 uppercase tracking-wide">
                          Decision Support Suggestions ({currentSuggestions.length})
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Based on: &ldquo;{symptoms || selectedPatient.symptoms}&rdquo;
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedSuggestions.length === currentSuggestions.length) {
                              setSelectedSuggestions([]);
                            } else {
                              setSelectedSuggestions([...currentSuggestions]);
                            }
                          }}
                          className="text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                        >
                          {selectedSuggestions.length === currentSuggestions.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {currentSuggestions.map((testName) => {
                        const isChecked = selectedSuggestions.includes(testName);
                        return (
                          <label
                            key={testName}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/20'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSuggestion(testName)}
                              className="sr-only"
                            />
                            <span>{testName}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        icon={Sparkles}
                        disabled={selectedSuggestions.length === 0}
                        onClick={handleOrderSelectedSuggestions}
                      >
                        Order Selected ({selectedSuggestions.length})
                      </Button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleOrderLab} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      label="Select Diagnostic Test"
                      options={COMMON_LAB_TESTS}
                      value={selectedTest}
                      onChange={(e) => setSelectedTest(e.target.value)}
                    />
                    <Select
                      label="Urgency"
                      options={['Routine', 'STAT Urgent', 'Fasting Sample']}
                      value={testPriority}
                      onChange={(e) => setTestPriority(e.target.value)}
                    />
                    <Input
                      label="Specific Instructions"
                      placeholder="e.g. Send report immediately"
                      value={testInstructions}
                      onChange={(e) => setTestInstructions(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" variant="outline" size="sm" icon={Plus}>
                      Order Test
                    </Button>
                  </div>
                </form>

                {/* Ordered lab tests display with removal option */}
                {((selectedPatient.labRequests && selectedPatient.labRequests.length > 0) ||
                  (selectedPatient.testsOrdered && selectedPatient.testsOrdered.length > 0)) && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Ordered Diagnostic Tests ({((selectedPatient.labRequests || selectedPatient.testsOrdered) || []).length})
                    </h4>
                    <div className="space-y-1.5">
                      {((selectedPatient.labRequests || selectedPatient.testsOrdered) || []).map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-violet-500 shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {req.testName}
                              </span>
                              {req.instructions && (
                                <span className="ml-2 text-[10px] text-slate-400">({req.instructions})</span>
                              )}
                              {req.priority && req.priority !== 'Routine' && (
                                <span className="ml-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                  [{req.priority}]
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={req.status === 'Completed' ? 'green' : req.status === 'Processing' ? 'purple' : 'teal'} size="sm">
                              {req.status}
                            </Badge>
                            <span className="text-[10px] text-slate-400 font-mono">{req.orderedAt}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLab(req.id)}
                              title="Cancel test order"
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Digital E-Prescription Builder */}
              <Card
                title="Digital Prescription"
                subtitle="Prescribe medications transmitted instantly to the Pharmacy queue"
              >
                <div className="space-y-3">
                  {rxList.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-xs"
                    >
                      <Select
                        label="Medicine"
                        options={PRESCRIBABLE_MEDS}
                        value={row.medicine}
                        onChange={(e) => {
                          const updated = [...rxList];
                          updated[idx].medicine = e.target.value;
                          setRxList(updated);
                        }}
                      />
                      <Input
                        label="Dosage"
                        value={row.dosage}
                        onChange={(e) => {
                          const updated = [...rxList];
                          updated[idx].dosage = e.target.value;
                          setRxList(updated);
                        }}
                      />
                      <Select
                        label="Frequency"
                        options={[
                          'Once daily (OD)',
                          'Twice daily (BID)',
                          'Thrice daily (TID)',
                          'Four times daily (QID)',
                          'SOS (As needed)',
                        ]}
                        value={row.frequency}
                        onChange={(e) => {
                          const updated = [...rxList];
                          updated[idx].frequency = e.target.value;
                          setRxList(updated);
                        }}
                      />
                      <Input
                        label="Duration"
                        value={row.duration}
                        onChange={(e) => {
                          const updated = [...rxList];
                          updated[idx].duration = e.target.value;
                          setRxList(updated);
                        }}
                      />
                      <div className="flex items-center gap-2 pt-4 sm:pt-0">
                        <Input
                          label="Instructions"
                          value={row.instructions}
                          onChange={(e) => {
                            const updated = [...rxList];
                            updated[idx].instructions = e.target.value;
                            setRxList(updated);
                          }}
                        />
                        {rxList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRxRow(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1.5 mt-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleAddRxRow} icon={Plus}>
                      Add Medicine
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleSavePrescription}
                      icon={Send}
                    >
                      Transmit Prescription to Pharmacy
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="text-center py-12 text-slate-400 text-xs">
              Select a patient from the queue to start consultation.
            </Card>
          )}
        </div>
      </div>

      {/* Doctor Face Biometric Modal */}
      <BiometricFaceLoginModal
        isOpen={biometricModalOpen}
        onClose={() => setBiometricModalOpen(false)}
        initialRole="DOCTOR"
      />
    </div>
  );
}
