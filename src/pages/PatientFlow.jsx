import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Clock,
  HeartPulse,
  Search,
  Filter,
  ArrowRight,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  Phone,
  Printer,
  Calendar,
  FlaskConical,
} from 'lucide-react';
import { MotionStrip } from '../components/motion/MotionKit';
import { useHealthcare } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { TokenModal } from '../components/modules/TokenModal';
import { PatientJourneyTimeline } from '../components/modules/PatientJourneyTimeline';
import { formatTime, maskAadhar } from '../utils/formatters';

export function PatientFlow() {
  const {
    patients,
    activeHospitalId,
    hospitals,
    appointments,
    checkInAppointment,
    calculateQueueEta,
    registerPatient,
    updatePatientStatus,
    updateLabTestStatus,
    showToast,
  } = useHealthcare();

  // Top view toggle: 'queue' | 'register' | 'appointments'
  const [activeTab, setActiveTab] = useState('queue');

  // Queue filter & search state
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [tokenModalPatient, setTokenModalPatient] = useState(null);
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);

  // Patient Intake 5-tab mode: 'single' | 'family' | 'friend' | 'neighbour' | 'others'
  const [intakeTab, setIntakeTab] = useState('single');

  // Single Registration Form State
  const [regForm, setRegForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    mobile: '',
    aadhar: '',
    abha: '',
    address: '',
    city: 'Bengaluru',
    hospitalId: activeHospitalId,
    department: 'General Medicine',
    doctor: 'Dr. Priya Nair',
    priority: 'Normal', // Normal, Urgent, Emergency
    appointmentType: 'Walk-In OPD',
    symptoms: '',
  });

  // Family Members Dynamic List
  const [familyMembers, setFamilyMembers] = useState([
    { relation: 'Spouse', name: '', mobile: '', aadhar: '', address: '' },
  ]);

  // Friend / Neighbour / Others Form State
  const [secondaryForm, setSecondaryForm] = useState({
    name: '',
    mobile: '',
    aadhar: '',
    address: '',
    department: 'General Medicine',
    doctor: 'Dr. Priya Nair',
    priority: 'Normal',
  });

  const activeHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[0];

  // Filter patients by active hospital
  const hospitalPatients = patients.filter((p) => p.hospitalId === activeHospitalId);
  const hospitalAppointments = (appointments || []).filter((a) => a.hospitalId === activeHospitalId);

  const filteredQueue = hospitalPatients.filter((p) => {
    const matchSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mobile.includes(searchTerm);

    const matchDept = deptFilter === 'All' || p.department === deptFilter;
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;

    return matchSearch && matchDept && matchStatus;
  });

  // Single Registration Handler
  const handleSingleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.name.trim() || !regForm.mobile.trim() || !regForm.age) {
      showToast('Please fill all required patient details', 'error');
      return;
    }

    const created = await registerPatient(regForm);
    setTokenModalPatient(created);
    // Reset form
    setRegForm({
      name: '',
      age: '',
      gender: 'Male',
      mobile: '',
      aadhar: '',
      abha: '',
      address: '',
      city: 'Bengaluru',
      hospitalId: activeHospitalId,
      department: 'General Medicine',
      doctor: 'Dr. Priya Nair',
      priority: 'Normal',
      appointmentType: 'Walk-In OPD',
      symptoms: '',
    });
    setActiveTab('queue');
  };

  // Family Registration Handler
  const handleFamilyRegister = async (e) => {
    e.preventDefault();
    const validMembers = familyMembers.filter((m) => m.name.trim() && m.mobile.trim());
    if (validMembers.length === 0) {
      showToast('Please fill details for at least one family member', 'error');
      return;
    }

    let lastCreated = null;
    for (const m of validMembers) {
      lastCreated = await registerPatient({
        name: m.name,
        age: 35,
        gender: 'Other',
        mobile: m.mobile,
        aadhar: m.aadhar,
        address: m.address,
        hospitalId: activeHospitalId,
        department: 'General Medicine',
        doctor: 'Dr. Priya Nair',
        priority: 'Normal',
        symptoms: `Family registration (${m.relation})`,
      });
    }

    setTokenModalPatient(lastCreated);
    showToast(`Registered ${validMembers.length} family member(s) into queue`, 'success');
    setActiveTab('queue');
  };

  // Secondary (Friend / Neighbour / Others) Handler
  const handleSecondaryRegister = async (e) => {
    e.preventDefault();
    if (!secondaryForm.name.trim() || !secondaryForm.mobile.trim()) {
      showToast('Please enter required intake information', 'error');
      return;
    }

    const created = await registerPatient({
      name: secondaryForm.name,
      age: 32,
      gender: 'Other',
      mobile: secondaryForm.mobile,
      aadhar: secondaryForm.aadhar,
      address: secondaryForm.address,
      hospitalId: activeHospitalId,
      department: secondaryForm.department,
      doctor: secondaryForm.doctor,
      priority: secondaryForm.priority,
      symptoms: `${intakeTab.toUpperCase()} referral intake`,
    });

    setTokenModalPatient(created);
    setSecondaryForm({
      name: '',
      mobile: '',
      aadhar: '',
      address: '',
      department: 'General Medicine',
      doctor: 'Dr. Priya Nair',
      priority: 'Normal',
    });
    setActiveTab('queue');
  };

  return (
    <div className="space-y-6">
      <MotionStrip variant="lab" />
      {/* Token Success Modal */}
      <TokenModal
        isOpen={!!tokenModalPatient}
        onClose={() => setTokenModalPatient(null)}
        patient={tokenModalPatient}
        hospital={activeHospital}
      />

      {/* Patient Detail Drawer / Modal */}
      {selectedPatient && (
        <Modal
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          title={`Patient Record — ${selectedPatient.token}`}
          subtitle={`${selectedPatient.name} • ${selectedPatient.department}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Top Info Grid */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Mobile</span>
                <span className="font-semibold">{selectedPatient.mobile}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Aadhar No.</span>
                <span className="font-semibold">{maskAadhar(selectedPatient.aadhar)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ABHA ID</span>
                <span className="font-semibold">{selectedPatient.abha || 'Not Linked'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Queue Status</span>
                <Badge variant={selectedPatient.priority === 'Emergency' ? 'emergency' : 'teal'} size="sm">
                  {selectedPatient.status}
                </Badge>
              </div>
            </div>

            {/* Vitals Bar */}
            {selectedPatient.vitals && (
              <div className="p-3.5 rounded-xl border border-teal-100 dark:border-teal-900 bg-teal-50/40 dark:bg-teal-950/30 flex flex-wrap gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Blood Pressure</span>
                  <span className="font-bold text-teal-700 dark:text-teal-300 font-mono">{selectedPatient.vitals.bp || '120/80'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Pulse</span>
                  <span className="font-bold text-teal-700 dark:text-teal-300 font-mono">{selectedPatient.vitals.pulse || 72} bpm</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Temperature</span>
                  <span className="font-bold text-teal-700 dark:text-teal-300 font-mono">{selectedPatient.vitals.temp || '98.6°F'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">SpO2</span>
                  <span className="font-bold text-teal-700 dark:text-teal-300 font-mono">{selectedPatient.vitals.spo2 || '99%'}</span>
                </div>
              </div>
            )}

            {/* Ordered Diagnostic Tests (if any) */}
            {(() => {
              const tests = selectedPatient.labRequests || selectedPatient.testsOrdered || [];
              if (tests.length === 0) return null;
              return (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Ordered Diagnostic Tests ({tests.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {tests.map((test, idx) => (
                      <div
                        key={test.id || idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {test.testName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Priority: {test.priority || 'Routine'} • Ordered at {test.orderedAt || 'OPD Desk'}
                          </span>
                          {test.instructions && (
                            <p className="text-[10px] text-slate-400 italic mt-0.5">Note: {test.instructions}</p>
                          )}
                        </div>
                        <Badge
                          variant={
                            test.status === 'Completed'
                              ? 'success'
                              : test.status === 'In Progress' || test.status === 'Processing'
                              ? 'teal'
                              : test.status === 'Sample Collected'
                              ? 'purple'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {test.status || 'Ordered'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Patient Journey Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Live Patient Journey Timeline
              </h4>
              <PatientJourneyTimeline
                journey={selectedPatient.journey}
                currentStatus={selectedPatient.status}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Test Order Details Modal */}
      {selectedTestDetail && (
        <Modal
          isOpen={Boolean(selectedTestDetail)}
          onClose={() => setSelectedTestDetail(null)}
          title="Diagnostic Test Order Details"
          subtitle={`${selectedTestDetail.testName} • ${selectedTestDetail.patientName} (${selectedTestDetail.patientToken})`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedTestDetail.patientName} ({selectedTestDetail.patientToken})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Test Name:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400 text-sm">
                  {selectedTestDetail.testName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Ordering Doctor:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedTestDetail.orderedBy || selectedTestDetail.doctor || 'Attending Physician'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Department:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {selectedTestDetail.department || 'General Medicine'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Ordered At:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {selectedTestDetail.orderedAt || 'Today'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Priority:</span>
                <Badge
                  variant={selectedTestDetail.priority === 'STAT Urgent' || selectedTestDetail.priority === 'STAT' ? 'emergency' : 'teal'}
                  size="sm"
                >
                  {selectedTestDetail.priority || 'Routine'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Current Status:</span>
                <Badge
                  variant={
                    selectedTestDetail.status === 'Completed'
                      ? 'success'
                      : selectedTestDetail.status === 'In Progress' || selectedTestDetail.status === 'Processing'
                      ? 'teal'
                      : selectedTestDetail.status === 'Sample Collected'
                      ? 'purple'
                      : 'warning'
                  }
                  size="sm"
                >
                  {selectedTestDetail.status || 'Ordered'}
                </Badge>
              </div>
              {selectedTestDetail.instructions && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-500 block mb-1">Clinical Instructions:</span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    {selectedTestDetail.instructions}
                  </p>
                </div>
              )}
            </div>

            {/* Test Lifecycle Status Progression (Lab Tech / Doctor / Staff) */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Advance Test Lifecycle Status:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {['Ordered', 'Scheduled', 'Sample Collected', 'Processing', 'Completed'].map((st) => {
                  const isCurrent = selectedTestDetail.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        updateLabTestStatus(selectedTestDetail.patientId, selectedTestDetail.id, st);
                        setSelectedTestDetail((prev) => ({ ...prev, status: st }));
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer text-center ${
                        isCurrent
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTestDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Top Header & View Toggle Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              Live Queue Dispatcher
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {activeHospital?.name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600 dark:text-teal-400" />
            Patient Flow & Smart OPD Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Real-time outpatient triage, token issuance, and live status progression for {activeHospital?.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800 shadow-sm self-start lg:self-auto">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-gradient-to-r from-teal-500/15 to-teal-500/5 text-teal-700 dark:text-teal-300 border border-teal-500/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Smart OPD Queue
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'queue'
                ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {filteredQueue.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-teal-500/15 to-teal-500/5 text-teal-700 dark:text-teal-300 border border-teal-500/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Register & Intake
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'appointments'
                ? 'bg-gradient-to-r from-teal-500/15 to-teal-500/5 text-teal-700 dark:text-teal-300 border border-teal-500/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Scheduled Bookings
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'appointments'
                ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {hospitalAppointments.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: SMART OPD QUEUE VIEW */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient name, token (e.g. OP-104), mobile..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 shadow-inner"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filters:</span>
              </div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer shadow-xs"
              >
                <option value="All">All Departments</option>
                {activeHospital?.departments?.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer shadow-xs"
              >
                <option value="All">All Statuses</option>
                <option value="Waiting">Waiting</option>
                <option value="In Consultation">In Consultation</option>
                <option value="Lab">Lab</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Discharged">Discharged</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* OPD Queue Table */}
          <Card noPadding className="glass-card shadow-xl overflow-hidden border border-slate-200/80 dark:border-slate-800" title="Active OPD Queue" subtitle="Click any patient to inspect timeline or advance status">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Token #</th>
                    <th className="px-4 py-3">Patient Details</th>
                    <th className="px-4 py-3">Department & Doctor</th>
                    <th className="px-4 py-3">Test Ordered</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Registered At</th>
                    <th className="px-4 py-3 text-right">Queue Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No patients matching your filter in {activeHospital?.name}.
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((patient) => {
                      const isEmergency = patient.priority === 'Emergency';
                      return (
                        <tr
                          key={patient.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => setSelectedPatient(patient)}
                              className="font-mono font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              {patient.token}
                              <Eye className="w-3 h-3 text-slate-400" />
                            </button>
                            <span className="text-[10px] text-slate-400 block font-sans">
                              Pos #{patient.queuePosition || 1}
                            </span>
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold block mt-0.5">
                              ETA: {calculateQueueEta(patient.queuePosition, patient.priority)}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              {patient.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {patient.age} yrs • {patient.gender} • {patient.mobile}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                              {patient.department}
                            </span>
                            <span className="text-[11px] text-slate-400">{patient.doctor}</span>
                          </td>

                          {/* Test Ordered Column */}
                          <td className="px-4 py-3.5">
                            {(() => {
                              const tests = patient.labRequests || patient.testsOrdered || [];
                              if (!tests || tests.length === 0) {
                                return (
                                  <span className="text-slate-400 dark:text-slate-500 text-xs italic">
                                    No Test Ordered
                                  </span>
                                );
                              }
                              return (
                                <div className="flex flex-wrap gap-1 max-w-[220px]">
                                  {tests.map((test, idx) => {
                                    const isDone = test.status === 'Completed';
                                    const isInProg = test.status === 'In Progress' || test.status === 'Processing';
                                    const isCollected = test.status === 'Sample Collected';
                                    return (
                                      <button
                                        key={test.id || idx}
                                        type="button"
                                        onClick={() =>
                                          setSelectedTestDetail({
                                            ...test,
                                            patientId: patient.id,
                                            patientName: patient.name,
                                            patientToken: patient.token,
                                            doctor: patient.doctor,
                                            department: patient.department,
                                          })
                                        }
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800/80 hover:bg-teal-100 dark:hover:bg-teal-900 cursor-pointer text-left shadow-2xs"
                                        title={`Test: ${test.testName} • Status: ${test.status || 'Ordered'} (Click for details)`}
                                      >
                                        <span className="truncate max-w-[110px]">{test.testName}</span>
                                        <span
                                          className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                                            isDone
                                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                                              : isInProg
                                              ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                                              : isCollected
                                              ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                                              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                                          }`}
                                        >
                                          {test.status || 'Ordered'}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </td>

                          <td className="px-4 py-3.5">
                            <Badge
                              variant={
                                isEmergency
                                  ? 'emergency'
                                  : patient.priority === 'Urgent'
                                  ? 'warning'
                                  : 'default'
                              }
                              size="sm"
                            >
                              {patient.priority}
                            </Badge>
                          </td>

                          <td className="px-4 py-3.5">
                            <Badge
                              variant={
                                patient.status === 'In Consultation'
                                  ? 'teal'
                                  : patient.status === 'Lab'
                                  ? 'purple'
                                  : patient.status === 'Pharmacy'
                                  ? 'warning'
                                  : patient.status === 'Discharged'
                                  ? 'success'
                                  : 'default'
                              }
                              size="sm"
                              dot
                            >
                              {patient.status}
                            </Badge>
                          </td>

                          <td className="px-4 py-3.5 font-mono text-slate-400">
                            {formatTime(patient.registeredAt)}
                          </td>

                          {/* Interactive Status Transition Action Buttons */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {patient.status === 'Waiting' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => updatePatientStatus(patient.id, 'In Consultation')}
                                >
                                  Consult
                                </Button>
                              )}
                              {patient.status === 'In Consultation' && (
                                <>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => updatePatientStatus(patient.id, 'Lab')}
                                  >
                                    Send Lab
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => updatePatientStatus(patient.id, 'Pharmacy')}
                                  >
                                    Rx
                                  </Button>
                                </>
                              )}
                              {patient.status === 'Lab' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => updatePatientStatus(patient.id, 'In Consultation', 'Lab results returned')}
                                >
                                  Review
                                </Button>
                              )}
                              {patient.status === 'Pharmacy' && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => updatePatientStatus(patient.id, 'Discharged', 'Medications dispensed')}
                                >
                                  Dispense & Exit
                                </Button>
                              )}
                              {patient.status !== 'Emergency' && patient.status !== 'Discharged' && (
                                <button
                                  onClick={() => updatePatientStatus(patient.id, 'Emergency', 'Upgraded to STAT Emergency')}
                                  title="STAT Emergency Escalation"
                                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                >
                                  <HeartPulse className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: PATIENT INTAKE & REGISTRATION */}
      {activeTab === 'register' && (
        <Card className="glass-card shadow-xl border border-slate-200/80 dark:border-slate-800" title="Patient Intake & Token Generation Desk" subtitle="Issuing immediate queue tokens connected to Hospital OS">
          {/* 5 Tabs: Single Person, Family, Friend, Neighbour, Others */}
          <div className="grid grid-cols-2 sm:grid-cols-5 p-1.5 glass-card rounded-2xl mb-6 gap-1.5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            {[
              { key: 'single', label: 'Single Person' },
              { key: 'family', label: 'Family' },
              { key: 'friend', label: 'Friend' },
              { key: 'neighbour', label: 'Neighbour' },
              { key: 'others', label: 'Others' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setIntakeTab(tab.key)}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  intakeTab === tab.key
                    ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 1. SINGLE PERSON INTAKE */}
          {intakeTab === 'single' && (
            <form onSubmit={handleSingleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Patient Full Name"
                  required
                  placeholder="e.g. Ramesh Sundaram"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                />
                <Input
                  label="Age (Years)"
                  required
                  type="number"
                  placeholder="e.g. 45"
                  value={regForm.age}
                  onChange={(e) => setRegForm({ ...regForm, age: e.target.value })}
                />
                <Select
                  label="Gender"
                  options={['Male', 'Female', 'Other']}
                  value={regForm.gender}
                  onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Mobile Number"
                  required
                  type="tel"
                  placeholder="10-digit mobile"
                  value={regForm.mobile}
                  onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                />
                <Input
                  label="Aadhar Number"
                  placeholder="XXXX XXXX 1234"
                  value={regForm.aadhar}
                  onChange={(e) => setRegForm({ ...regForm, aadhar: e.target.value })}
                />
                <Input
                  label="ABHA Health ID (Optional)"
                  placeholder="12-3456-7890-0000"
                  value={regForm.abha}
                  onChange={(e) => setRegForm({ ...regForm, abha: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Department"
                  options={activeHospital?.departments || ['General Medicine', 'Cardiology', 'Pediatrics']}
                  value={regForm.department}
                  onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                />
                <Select
                  label="Attending Doctor"
                  options={['Dr. Priya Nair', 'Dr. Arvind Sharma', 'Dr. Rajesh Rao', 'Dr. Mahesh Joshi']}
                  value={regForm.doctor}
                  onChange={(e) => setRegForm({ ...regForm, doctor: e.target.value })}
                />
                <Select
                  label="Triage Priority"
                  options={['Normal', 'Urgent', 'Emergency']}
                  value={regForm.priority}
                  onChange={(e) => setRegForm({ ...regForm, priority: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Address / Area"
                  placeholder="Locality, Landmark"
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                />
                <Input
                  label="Presenting Complaints / Symptoms"
                  placeholder="e.g. Mild fever, persistent dry cough"
                  value={regForm.symptoms}
                  onChange={(e) => setRegForm({ ...regForm, symptoms: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="md" icon={Plus}>
                  Generate OPD Token & Add to Queue
                </Button>
              </div>
            </form>
          )}

          {/* 2. FAMILY INTAKE (MULTIPLE MEMBERS) */}
          {intakeTab === 'family' && (
            <form onSubmit={handleFamilyRegister} className="space-y-4">
              <p className="text-xs text-slate-500">
                Register family members simultaneously for grouped triage in the same facility.
              </p>

              {familyMembers.map((member, index) => (
                <div
                  key={index}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      Family Member #{index + 1}
                    </span>
                    {familyMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFamilyMembers(familyMembers.filter((_, i) => i !== index))}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Select
                      label="Relation"
                      options={['Spouse', 'Child', 'Parent', 'Sibling', 'Other']}
                      value={member.relation}
                      onChange={(e) => {
                        const updated = [...familyMembers];
                        updated[index].relation = e.target.value;
                        setFamilyMembers(updated);
                      }}
                    />
                    <Input
                      label="Full Name"
                      required
                      placeholder="Name"
                      value={member.name}
                      onChange={(e) => {
                        const updated = [...familyMembers];
                        updated[index].name = e.target.value;
                        setFamilyMembers(updated);
                      }}
                    />
                    <Input
                      label="Mobile Number"
                      required
                      placeholder="Mobile"
                      value={member.mobile}
                      onChange={(e) => {
                        const updated = [...familyMembers];
                        updated[index].mobile = e.target.value;
                        setFamilyMembers(updated);
                      }}
                    />
                    <Input
                      label="Aadhar Number"
                      placeholder="Aadhar"
                      value={member.aadhar}
                      onChange={(e) => {
                        const updated = [...familyMembers];
                        updated[index].aadhar = e.target.value;
                        setFamilyMembers(updated);
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFamilyMembers([
                      ...familyMembers,
                      { relation: 'Child', name: '', mobile: '', aadhar: '', address: '' },
                    ])
                  }
                  icon={Plus}
                >
                  Add Another Member
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Register All Family Members
                </Button>
              </div>
            </form>
          )}

          {/* 3. FRIEND / NEIGHBOUR / OTHERS INTAKE */}
          {(intakeTab === 'friend' || intakeTab === 'neighbour' || intakeTab === 'others') && (
            <form onSubmit={handleSecondaryRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Contact Person Name"
                  required
                  placeholder="Full Name"
                  value={secondaryForm.name}
                  onChange={(e) => setSecondaryForm({ ...secondaryForm, name: e.target.value })}
                />
                <Input
                  label="Mobile Number"
                  required
                  type="tel"
                  placeholder="10-digit mobile"
                  value={secondaryForm.mobile}
                  onChange={(e) => setSecondaryForm({ ...secondaryForm, mobile: e.target.value })}
                />
                <Input
                  label="Aadhar Number"
                  placeholder="Aadhar Number"
                  value={secondaryForm.aadhar}
                  onChange={(e) => setSecondaryForm({ ...secondaryForm, aadhar: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Address / Area"
                  placeholder="Address or Locality"
                  value={secondaryForm.address}
                  onChange={(e) => setSecondaryForm({ ...secondaryForm, address: e.target.value })}
                />
                <Select
                  label="Department"
                  options={activeHospital?.departments || ['General Medicine', 'Cardiology']}
                  value={secondaryForm.department}
                  onChange={(e) => setSecondaryForm({ ...secondaryForm, department: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="md">
                  Register {intakeTab.charAt(0).toUpperCase() + intakeTab.slice(1)} Entry
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* TAB 3: SCHEDULED APPOINTMENTS VIEW */}
      {activeTab === 'appointments' && (
        <Card
          title="Scheduled Outpatient Appointments"
          subtitle="Pre-booked specialist consultations. Click 'Check In & Issue Token' when the patient arrives at the desk."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Appointment ID</th>
                  <th className="px-4 py-3">Patient Details</th>
                  <th className="px-4 py-3">Department & Doctor</th>
                  <th className="px-4 py-3">Scheduled Slot</th>
                  <th className="px-4 py-3">Chief Symptoms</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {hospitalAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No scheduled appointments booked for {activeHospital?.name}.
                    </td>
                  </tr>
                ) : (
                  hospitalAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {apt.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{apt.patientName}</span>
                        <span className="text-[11px] text-slate-400">{apt.age} yrs • {apt.gender} • {apt.mobile}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">{apt.department}</span>
                        <span className="text-[11px] text-slate-400">{apt.doctor}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        <span className="block font-semibold text-slate-800 dark:text-slate-200">{apt.date}</span>
                        <span className="text-[11px] text-teal-600">{apt.timeSlot}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {apt.symptoms || 'General consultation'}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            apt.status === 'Confirmed'
                              ? 'teal'
                              : apt.status === 'Checked In'
                              ? 'blue'
                              : 'slate'
                          }
                          size="sm"
                        >
                          {apt.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {apt.status === 'Confirmed' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={async () => {
                              const created = await checkInAppointment(apt.id);
                              if (created) {
                                setTokenModalPatient(created);
                                setActiveTab('queue');
                              }
                            }}
                          >
                            Check In & Issue Token
                          </Button>
                        ) : apt.status === 'Checked In' ? (
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> In Queue
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Cancelled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
