import React, { useState, useMemo } from 'react';
import {
  Droplet,
  Users,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  HeartPulse,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Download,
  Share2,
  ShieldCheck,
  Building,
  Award,
  ArrowRight,
  TrendingUp,
  Activity,
  Printer,
  Sparkles,
  RefreshCw,
  BellRing,
  Info,
} from 'lucide-react';
import { useHealthcare } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { StatCard } from '../components/ui/StatCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { HospitalSelector } from '../components/layout/HospitalSelector';
import {
  BLOOD_GROUPS,
  BLOOD_COMPONENTS,
  COMPATIBILITY_MATRIX,
} from '../data/initialBloodBank';
import { formatDate, formatTime } from '../utils/formatters';

export function BloodBank() {
  const {
    activeHospitalId,
    hospitals,
    patients,
    bloodInventory,
    bloodDonors,
    bloodRequests,
    bloodCamps,
    registerBloodDonor,
    updateBloodDonor,
    deleteBloodDonor,
    recordDonation,
    updateBloodStock,
    createBloodRequest,
    fulfillBloodRequest,
    updateBloodRequestStatus,
    registerBloodCamp,
    showToast,
  } = useHealthcare();

  const currentHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[0];

  // Active submodule tabs: 'inventory' | 'donors' | 'requests' | 'sos' | 'camps'
  const [activeTab, setActiveTab] = useState('inventory');

  // Filter & Search states
  const [donorSearch, setDonorSearch] = useState('');
  const [donorGroupFilter, setDonorGroupFilter] = useState('All');
  const [donorEligibilityFilter, setDonorEligibilityFilter] = useState('All');

  const [reqFilterPriority, setReqFilterPriority] = useState('All');
  const [reqFilterStatus, setReqFilterStatus] = useState('All');

  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [campModalOpen, setCampModalOpen] = useState(false);
  const [adjustStockModal, setAdjustStockModal] = useState(null); // { bloodGroup, hospitalId }
  const [certificateDonor, setCertificateDonor] = useState(null);
  const [recordDonationModal, setRecordDonationModal] = useState(null); // donor object

  // SOS Emergency State
  const [sosBloodGroup, setSosBloodGroup] = useState('O-');
  const [sosUnitsNeeded, setSosUnitsNeeded] = useState(2);

  // Forms
  const [newDonorForm, setNewDonorForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    mobile: '',
    email: '',
    city: 'Bengaluru',
    address: '',
    weight: '65',
    hemoglobin: '14.0',
    bloodPressure: '120/80',
    isEmergencyVolunteer: true,
    medicalNotes: '',
  });

  const [newReqForm, setNewReqForm] = useState({
    patientId: '',
    patientName: '',
    bloodGroup: 'O+',
    component: 'Whole Blood',
    unitsNeeded: 1,
    priority: 'Routine Elective',
    department: 'Emergency & Trauma',
    doctorName: 'Dr. Priya Nair',
    clinicalIndication: '',
  });

  const [newCampForm, setNewCampForm] = useState({
    title: '',
    organizer: '',
    venue: '',
    date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    time: '09:00 AM - 04:30 PM',
    targetUnits: 150,
    contactPerson: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    component: 'Whole Blood',
    delta: 1,
    reason: 'Voluntary intake',
  });

  // Current Hospital Data Slices
  const hospitalInventory = useMemo(() => {
    return bloodInventory.filter((item) => item.hospitalId === activeHospitalId);
  }, [bloodInventory, activeHospitalId]);

  const hospitalRequests = useMemo(() => {
    return bloodRequests.filter((req) => req.hospitalId === activeHospitalId);
  }, [bloodRequests, activeHospitalId]);

  const hospitalDonors = useMemo(() => {
    return bloodDonors.filter(
      (d) => d.registeredHospitalId === activeHospitalId || !d.registeredHospitalId
    );
  }, [bloodDonors, activeHospitalId]);

  const hospitalCamps = useMemo(() => {
    return bloodCamps.filter((c) => c.hospitalId === activeHospitalId || !c.hospitalId);
  }, [bloodCamps, activeHospitalId]);

  // Aggregate Metrics
  const totalUnitsInStock = hospitalInventory.reduce((acc, curr) => acc + (curr.totalUnits || 0), 0);
  const criticalStockCount = hospitalInventory.filter((item) => item.status === 'Critical' || (item.totalUnits || 0) <= 3).length;
  const pendingRequestsCount = hospitalRequests.filter((r) => r.status === 'Pending').length;
  const statEmergencyRequests = hospitalRequests.filter((r) => r.priority === 'STAT Emergency' && r.status !== 'Fulfilled').length;
  const eligibleDonorsCount = bloodDonors.filter((d) => d.eligibilityStatus === 'Eligible').length;

  // Filtered Donors List
  const filteredDonors = useMemo(() => {
    return bloodDonors.filter((d) => {
      const matchSearch =
        !donorSearch ||
        d.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
        d.mobile.includes(donorSearch) ||
        d.city.toLowerCase().includes(donorSearch.toLowerCase()) ||
        d.id.toLowerCase().includes(donorSearch.toLowerCase());

      const matchGroup = donorGroupFilter === 'All' || d.bloodGroup === donorGroupFilter;
      const matchElig =
        donorEligibilityFilter === 'All' ||
        (donorEligibilityFilter === 'Eligible' && d.eligibilityStatus === 'Eligible') ||
        (donorEligibilityFilter === 'Cooling' && d.eligibilityStatus === 'Cooling Period') ||
        (donorEligibilityFilter === 'Volunteer' && d.isEmergencyVolunteer);

      return matchSearch && matchGroup && matchElig;
    });
  }, [bloodDonors, donorSearch, donorGroupFilter, donorEligibilityFilter]);

  // Filtered Requisitions
  const filteredRequests = useMemo(() => {
    return hospitalRequests.filter((r) => {
      const matchPriority = reqFilterPriority === 'All' || r.priority === reqFilterPriority;
      const matchStatus = reqFilterStatus === 'All' || r.status === reqFilterStatus;
      return matchPriority && matchStatus;
    });
  }, [hospitalRequests, reqFilterPriority, reqFilterStatus]);

  // SOS Matching Donors
  const sosMatchingDonors = useMemo(() => {
    const compat = COMPATIBILITY_MATRIX[sosBloodGroup];
    const allowedDonorGroups = compat ? compat.canReceiveFrom : [sosBloodGroup];
    return bloodDonors.filter(
      (d) => allowedDonorGroups.includes(d.bloodGroup) && d.eligibilityStatus === 'Eligible'
    );
  }, [bloodDonors, sosBloodGroup]);

  // Handlers
  const handleRegisterDonorSubmit = async (e) => {
    e.preventDefault();
    if (!newDonorForm.name.trim() || !newDonorForm.mobile.trim() || !newDonorForm.age) {
      showToast('Please fill all required donor fields', 'error');
      return;
    }

    const ageNum = Number(newDonorForm.age);
    if (ageNum < 18 || ageNum > 65) {
      showToast('Donor must be between 18 and 65 years of age', 'error');
      return;
    }

    const weightNum = Number(newDonorForm.weight);
    if (weightNum < 45) {
      showToast('Minimum donor weight required is 45 kg', 'error');
      return;
    }

    const hbNum = Number(newDonorForm.hemoglobin);
    if (hbNum < 12.5) {
      showToast('Minimum hemoglobin requirement is 12.5 g/dL', 'error');
      return;
    }

    await registerBloodDonor({
      ...newDonorForm,
      registeredHospitalId: activeHospitalId,
      eligibilityStatus: 'Eligible',
    });

    setRegisterModalOpen(false);
    setNewDonorForm({
      name: '',
      age: '',
      gender: 'Male',
      bloodGroup: 'O+',
      mobile: '',
      email: '',
      city: 'Bengaluru',
      address: '',
      weight: '65',
      hemoglobin: '14.0',
      bloodPressure: '120/80',
      isEmergencyVolunteer: true,
      medicalNotes: '',
    });
  };

  const handleCreateRequestSubmit = async (e) => {
    e.preventDefault();
    if (!newReqForm.patientName.trim()) {
      showToast('Patient name is required for blood requisition', 'error');
      return;
    }

    await createBloodRequest({
      ...newReqForm,
      hospitalId: activeHospitalId,
    });

    setRequestModalOpen(false);
    setNewReqForm({
      patientId: '',
      patientName: '',
      bloodGroup: 'O+',
      component: 'Whole Blood',
      unitsNeeded: 1,
      priority: 'Routine Elective',
      department: 'Emergency & Trauma',
      doctorName: 'Dr. Priya Nair',
      clinicalIndication: '',
    });
  };

  const handleCampSubmit = async (e) => {
    e.preventDefault();
    if (!newCampForm.title.trim() || !newCampForm.venue.trim()) {
      showToast('Please provide drive title and venue', 'error');
      return;
    }

    await registerBloodCamp({
      ...newCampForm,
      hospitalId: activeHospitalId,
    });

    setCampModalOpen(false);
    setNewCampForm({
      title: '',
      organizer: '',
      venue: '',
      date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      time: '09:00 AM - 04:30 PM',
      targetUnits: 150,
      contactPerson: '',
    });
  };

  const handleRecordDonationSubmit = async (e) => {
    e.preventDefault();
    if (!recordDonationModal) return;

    await recordDonation(recordDonationModal.id, {
      units: 1,
      component: adjustForm.component,
      notes: adjustForm.reason,
    });

    setRecordDonationModal(null);
  };

  const handleAdjustStockSubmit = async (e) => {
    e.preventDefault();
    if (!adjustStockModal) return;

    await updateBloodStock(
      adjustStockModal.hospitalId,
      adjustStockModal.bloodGroup,
      adjustForm.component,
      adjustForm.delta
    );

    setAdjustStockModal(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. COMMAND HERO BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950/80 to-slate-950 p-6 sm:p-8 text-white shadow-2xl overflow-hidden border border-rose-500/30 glass-card">
        {/* Glow backdrop decorative elements */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-80 h-80 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md shadow-xs">
                <Droplet className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                Blood Bank & Transfusion Medicine Unit
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Licensed Blood Component Facility
              </span>
              {statEmergencyRequests > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600/90 text-white border border-red-400">
                  <HeartPulse className="w-3.5 h-3.5" />
                  {statEmergencyRequests} STAT Requisition(s) Active
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                {currentHospital?.name} Blood Bank
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-medium">
                  ISO-15189 Certified
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300/90 mt-1.5 max-w-2xl leading-relaxed">
                Centralized blood inventory management, component separation, voluntary donor registry, cross-match verification, and municipal emergency transfusion dispatch.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setRegisterModalOpen(true)}
                icon={Plus}
                className="shadow-lg shadow-rose-500/20"
              >
                Register New Donor
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setRequestModalOpen(true)}
                icon={Droplet}
                className="shadow-lg shadow-teal-500/20"
              >
                Request Blood Unit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setActiveTab('sos');
                  setSosBloodGroup('O-');
                }}
                icon={HeartPulse}
                className="bg-white/15 hover:bg-white/25 text-white border-white/20"
              >
                🚨 Emergency SOS Matcher
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCampModalOpen(true)}
                icon={Calendar}
                className="text-rose-300 hover:text-white hover:bg-white/10"
              >
                + Schedule Drive
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
            <HospitalSelector className="text-slate-900 dark:text-slate-100" />
            <div className="flex items-center gap-3 bg-white/10 dark:bg-black/30 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/15 text-xs text-slate-200">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Cold Storage Vitals</div>
                <div className="font-mono font-bold text-emerald-400">2.4°C • Monitored</div>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. STAT CARDS TELEMETRY ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Blood Stock"
          value={`${totalUnitsInStock} Units`}
          subtitle="All components stored"
          icon={Droplet}
          variant="rose"
          onClick={() => setActiveTab('inventory')}
        />
        <StatCard
          title="Critical Shortages"
          value={`${criticalStockCount} Groups`}
          subtitle={criticalStockCount > 0 ? 'Urgent restocking needed' : 'All groups safe'}
          icon={AlertTriangle}
          variant={criticalStockCount > 0 ? 'rose' : 'emerald'}
          onClick={() => setActiveTab('inventory')}
        />
        <StatCard
          title="Active Requisitions"
          value={`${pendingRequestsCount} Pending`}
          subtitle={`${statEmergencyRequests} STAT emergency priority`}
          icon={Clock}
          variant={statEmergencyRequests > 0 ? 'amber' : 'blue'}
          onClick={() => setActiveTab('requests')}
        />
        <StatCard
          title="Registered Donors"
          value={`${bloodDonors.length} Donors`}
          subtitle={`${eligibleDonorsCount} ready for immediate call`}
          icon={Users}
          variant="teal"
          onClick={() => setActiveTab('donors')}
        />
      </div>

      {/* 3. SUBMODULE NAVIGATION PILLS */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800 shadow-sm self-start">
        {[
          { key: 'inventory', label: 'Blood Inventory & Components', icon: Droplet, count: totalUnitsInStock },
          { key: 'donors', label: 'Donor Directory & Logs', icon: Users, count: bloodDonors.length },
          { key: 'requests', label: 'Requisitions & Transfusions', icon: Activity, count: pendingRequestsCount },
          { key: 'sos', label: 'Emergency SOS Matcher', icon: HeartPulse, count: null },
          { key: 'camps', label: 'Donation Drives & Camps', icon: Calendar, count: hospitalCamps.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-rose-500/20 to-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-rose-600 text-white dark:bg-rose-500 dark:text-slate-950'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENT: INVENTORY & STOCK */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* 8-Group Matrix Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BLOOD_GROUPS.map((group) => {
              const stock = hospitalInventory.find((item) => item.bloodGroup === group);
              const units = stock?.totalUnits || 0;
              const isCritical = units <= 3;
              const isLow = units > 3 && units < (stock?.minThreshold || 10);
              const isUniversal = group === 'O-' || group === 'AB+';

              return (
                <Card
                  key={group}
                  className={`relative overflow-hidden transition-all hover:shadow-xl ${
                    isCritical
                      ? 'border-red-400/80 dark:border-red-500/80 bg-red-500/5'
                      : isLow
                      ? 'border-amber-400/80 dark:border-amber-500/80 bg-amber-500/5'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                          {group}
                        </span>
                        {isUniversal && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {group === 'O-' ? 'Universal Donor' : 'Universal Recipient'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Min Safety Reserve: {stock?.minThreshold || 10} units
                      </span>
                    </div>

                    <Badge
                      variant={isCritical ? 'emergency' : isLow ? 'warning' : 'success'}
                      size="sm"
                    >
                      {isCritical ? 'Critical Shortage' : isLow ? 'Low Stock' : 'Safe Stock'}
                    </Badge>
                  </div>

                  <div className="my-4 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
                      {units}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Units Available</span>
                  </div>

                  {/* Components Breakdown Pills */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Whole:</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{stock?.wholeBlood || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PRBC:</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{stock?.prbc || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Platelets:</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{stock?.platelets || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">FFP:</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{stock?.ffp || 0}</span>
                    </div>
                  </div>

                  {/* Card footer actions */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <button
                      onClick={() => {
                        setAdjustStockModal({ bloodGroup: group, hospitalId: activeHospitalId });
                        setAdjustForm({ component: 'Whole Blood', delta: 1, reason: 'Batch addition' });
                      }}
                      className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adjust Units
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('sos');
                        setSosBloodGroup(group);
                      }}
                      className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Match Donors &rarr;
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Blood Compatibility Guide */}
          <Card
            className="glass-card"
            title="Clinical Blood Transfusion Compatibility Matrix"
            subtitle="Authoritative biological guide for red blood cells compatibility across donor and recipient phenotypes"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-bold">Blood Group</th>
                    <th className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">Can Safely Donate To</th>
                    <th className="px-4 py-3 font-bold text-teal-600 dark:text-teal-400">Can Safely Receive From</th>
                    <th className="px-4 py-3 font-bold">Clinical Significance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {BLOOD_GROUPS.map((bg) => {
                    const info = COMPATIBILITY_MATRIX[bg];
                    return (
                      <tr key={bg} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                          {bg}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {info.canDonateTo.map((target) => (
                              <span
                                key={target}
                                className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-mono font-bold text-[11px] border border-rose-200 dark:border-rose-900"
                              >
                                {target}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {info.canReceiveFrom.map((src) => (
                              <span
                                key={src}
                                className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-mono font-bold text-[11px] border border-teal-200 dark:border-teal-900"
                              >
                                {src}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {bg === 'O-'
                            ? 'Universal Red Cell Donor: Emergency STAT trauma first-line reserve.'
                            : bg === 'AB+'
                            ? 'Universal Plasma Donor / Recipient: Can receive any red blood cell type.'
                            : bg.includes('-')
                            ? 'Rh-Negative rare sub-type: High demand during obstetric emergencies.'
                            : 'Standard ABO positive: Common population distribution.'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 5. TAB CONTENT: DONOR DIRECTORY & MANAGEMENT */}
      {activeTab === 'donors' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={donorSearch}
                onChange={(e) => setDonorSearch(e.target.value)}
                placeholder="Search donor name, phone, city, or donor ID..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 shadow-inner"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filter:</span>
              </div>

              <select
                value={donorGroupFilter}
                onChange={(e) => setDonorGroupFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All">All Blood Groups</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>

              <select
                value={donorEligibilityFilter}
                onChange={(e) => setDonorEligibilityFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All">All Eligibility</option>
                <option value="Eligible">Eligible (&gt; 90 Days)</option>
                <option value="Cooling">Cooling Period (&lt; 90 Days)</option>
                <option value="Volunteer">Emergency Volunteers Only</option>
              </select>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setRegisterModalOpen(true)}
                icon={Plus}
              >
                New Donor
              </Button>
            </div>
          </div>

          {/* Donors Table */}
          <Card
            noPadding
            className="glass-card shadow-xl overflow-hidden border border-slate-200/80 dark:border-slate-800"
            title={`Registered Voluntary Donors (${filteredDonors.length})`}
            subtitle="Confidential medical directory maintained by Arogya Health Authority"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Donor ID & Group</th>
                    <th className="px-4 py-3">Donor Name & Contact</th>
                    <th className="px-4 py-3">Vitals (Weight / Hb / BP)</th>
                    <th className="px-4 py-3">Last Donated</th>
                    <th className="px-4 py-3">Total Units</th>
                    <th className="px-4 py-3">Eligibility Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDonors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No donors found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredDonors.map((donor) => {
                      const isEligible = donor.eligibilityStatus === 'Eligible';
                      return (
                        <tr
                          key={donor.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white font-mono font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                                {donor.bloodGroup}
                              </span>
                              <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                                  {donor.id}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {donor.age} yrs • {donor.gender}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {donor.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <Phone className="w-3 h-3 text-teal-500" />
                              <a href={`tel:${donor.mobile}`} className="hover:underline font-mono">
                                {donor.mobile}
                              </a>
                              {donor.city && (
                                <span className="text-slate-400">• {donor.city}</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                            <div>
                              <span className="font-semibold">{donor.weight} kg</span> • Hb:{' '}
                              <span className="font-bold text-rose-600 dark:text-rose-400">
                                {donor.hemoglobin} g/dL
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              BP: {donor.bloodPressure}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                            {donor.lastDonationDate
                              ? formatDate(donor.lastDonationDate)
                              : 'First-time Donor'}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 dark:text-slate-100 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                              <Award className="w-3 h-3 text-amber-500" />
                              {donor.totalDonations || 0}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <Badge
                              variant={isEligible ? 'success' : 'warning'}
                              size="sm"
                              dot
                            >
                              {donor.eligibilityStatus}
                            </Badge>
                            {donor.isEmergencyVolunteer && (
                              <span className="block text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                                ★ SOS Volunteer
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isEligible && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    setRecordDonationModal(donor);
                                    setAdjustForm({
                                      component: 'Whole Blood',
                                      delta: 1,
                                      reason: 'Voluntary hospital donation',
                                    });
                                  }}
                                  icon={Droplet}
                                >
                                  Donate
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCertificateDonor(donor)}
                                icon={Award}
                                title="Issue Donor ID & Certificate"
                              >
                                Card
                              </Button>
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

      {/* 6. TAB CONTENT: REQUISITIONS & TRANSFUSIONS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Patient Blood Requisitions & Transfusion Queue
              </h3>
              <p className="text-xs text-slate-500">
                Departmental requests linked with electronic patient health records
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={reqFilterPriority}
                onChange={(e) => setReqFilterPriority(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="All">All Priorities</option>
                <option value="STAT Emergency">STAT Emergency</option>
                <option value="Urgent">Urgent</option>
                <option value="Routine Elective">Routine Elective</option>
              </select>

              <select
                value={reqFilterStatus}
                onChange={(e) => setReqFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Fulfilled">Fulfilled</option>
              </select>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setRequestModalOpen(true)}
                icon={Plus}
              >
                + Create Requisition
              </Button>
            </div>
          </div>

          <Card noPadding className="glass-card shadow-xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Req ID & Priority</th>
                    <th className="px-4 py-3">Patient & Department</th>
                    <th className="px-4 py-3">Group & Component</th>
                    <th className="px-4 py-3">Units Needed</th>
                    <th className="px-4 py-3">Cross-Match Verification</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No requisitions matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isStat = req.priority === 'STAT Emergency';
                      const isFulfilled = req.status === 'Fulfilled';

                      return (
                        <tr
                          key={req.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isStat && !isFulfilled ? 'bg-red-500/5 dark:bg-red-500/10' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5">
                            <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {req.id}
                            </div>
                            <Badge
                              variant={isStat ? 'emergency' : req.priority === 'Urgent' ? 'warning' : 'default'}
                              size="sm"
                              dot={isStat}
                            >
                              {req.priority}
                            </Badge>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {req.patientName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {req.department} • Dr: {req.doctorName}
                            </div>
                            {req.clinicalIndication && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">
                                {req.clinicalIndication}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-mono font-black text-sm flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
                                {req.bloodGroup}
                              </span>
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                  {req.component}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-slate-100">
                              {req.unitsNeeded} Unit(s)
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {req.crossMatchStatus || 'Pending'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <Badge
                              variant={isFulfilled ? 'success' : req.status === 'Approved' ? 'teal' : 'warning'}
                              size="sm"
                            >
                              {req.status}
                            </Badge>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            {!isFulfilled ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => fulfillBloodRequest(req.id)}
                                icon={CheckCircle2}
                              >
                                Dispatch & Fulfill
                              </Button>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
                              </span>
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
        </div>
      )}

      {/* 7. TAB CONTENT: EMERGENCY SOS MATCHER */}
      {activeTab === 'sos' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-2 border-red-400">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <HeartPulse className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white text-red-700 inline-block mb-1">
                  CRISIS RESPONSE SYSTEM
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Emergency Blood SOS & Rapid Volunteer Dispatch
                </h2>
                <p className="text-xs sm:text-sm text-red-100 max-w-xl mt-0.5">
                  Select blood group needed for trauma or surgical shock to instantly match certified eligible donors across Bengaluru.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 self-start md:self-auto">
              <div>
                <label className="text-[10px] uppercase font-bold text-red-100 block mb-1">
                  Required Group:
                </label>
                <select
                  value={sosBloodGroup}
                  onChange={(e) => setSosBloodGroup(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-black text-sm cursor-pointer focus:outline-none"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-red-100 block mb-1">
                  Units Needed:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={sosUnitsNeeded}
                  onChange={(e) => setSosUnitsNeeded(Number(e.target.value) || 1)}
                  className="w-16 px-2.5 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-sm text-center focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Compatible Donors Call List */}
          <Card
            className="glass-card"
            title={`Eligible Compatible Donors for ${sosBloodGroup} (${sosMatchingDonors.length} Verified Donors Available)`}
            subtitle={`Biological compatibility allows red cell intake from: ${COMPATIBILITY_MATRIX[sosBloodGroup]?.canReceiveFrom.join(', ') || sosBloodGroup}`}
          >
            {sosMatchingDonors.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  No registered active donors found for {sosBloodGroup} in this cooling window.
                </p>
                <p className="text-xs mt-1">
                  Please initiate City Grid inter-facility referral to request blood from Bengaluru Central or City Care Hospital.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {sosMatchingDonors.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-2xl glass-card border border-rose-200/80 dark:border-rose-900/60 flex flex-col justify-between gap-3 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-rose-600 text-white font-mono font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                          {d.bloodGroup}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {d.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {d.city || 'Bengaluru'}
                          </div>
                        </div>
                      </div>

                      <Badge variant="success" size="sm">
                        Ready
                      </Badge>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hemoglobin:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">{d.hemoglobin} g/dL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Past Donations:</span>
                        <span className="font-semibold">{d.totalDonations} units</span>
                      </div>
                      {d.medicalNotes && (
                        <div className="text-[10px] text-slate-400 italic truncate">
                          {d.medicalNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${d.mobile}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Donor
                      </a>

                      <button
                        onClick={() => {
                          const message = encodeURIComponent(
                            `URGENT AROGYA SOS: ${currentHospital.name} requires ${sosUnitsNeeded} unit(s) of ${sosBloodGroup} blood immediately. As a registered voluntary donor, please confirm if you can donate today. Contact: ${currentHospital.contact}`
                          );
                          window.open(`https://wa.me/91${d.mobile}?text=${message}`, '_blank');
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                        title="Send SOS WhatsApp Alert"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 8. TAB CONTENT: DONATION DRIVES & CAMPS */}
      {activeTab === 'camps' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Community Blood Drives & Corporate Donation Camps
              </h3>
              <p className="text-xs text-slate-500">
                Outreach mobile blood donation buses scheduled across Bengaluru tech parks and campuses
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCampModalOpen(true)}
              icon={Plus}
            >
              Schedule New Camp
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hospitalCamps.map((camp) => {
              const progress = Math.min(100, Math.round((camp.registeredDonors / camp.targetUnits) * 100));
              return (
                <Card key={camp.id} className="glass-card space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                        {camp.id} • {camp.organizer}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                        {camp.title}
                      </h4>
                    </div>
                    <Badge
                      variant={camp.status === 'Completed' ? 'success' : camp.status === 'Active' ? 'emergency' : 'teal'}
                      size="sm"
                    >
                      {camp.status}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      <span>{camp.date} ({camp.time})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-teal-500" />
                      <span className="truncate">{camp.venue}</span>
                    </div>
                    {camp.contactPerson && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Phone className="w-3 h-3" />
                        <span>{camp.contactPerson}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <ProgressBar
                      label={`Registration Progress (${camp.registeredDonors} / ${camp.targetUnits} Units)`}
                      value={progress}
                      max={100}
                      showPercentage
                      color="rose"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-400">Arogya Mobile Van #03</span>
                    <button
                      onClick={() => showToast(`Registered volunteer for ${camp.title}`, 'success')}
                      className="font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      + Volunteer
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTER NEW DONOR */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Voluntary Blood Donor Registration"
        subtitle="Enrolling new donor into Arogya Blood Network with clinical screening"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleRegisterDonorSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Rahul Sharma"
              value={newDonorForm.name}
              onChange={(e) => setNewDonorForm({ ...newDonorForm, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Age (Years)"
                type="number"
                min="18"
                max="65"
                required
                value={newDonorForm.age}
                onChange={(e) => setNewDonorForm({ ...newDonorForm, age: e.target.value })}
              />
              <Select
                label="Gender"
                options={['Male', 'Female', 'Other']}
                value={newDonorForm.gender}
                onChange={(e) => setNewDonorForm({ ...newDonorForm, gender: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Blood Group"
              options={BLOOD_GROUPS}
              value={newDonorForm.bloodGroup}
              onChange={(e) => setNewDonorForm({ ...newDonorForm, bloodGroup: e.target.value })}
            />
            <Input
              label="Mobile Number"
              required
              type="tel"
              placeholder="10-digit mobile"
              value={newDonorForm.mobile}
              onChange={(e) => setNewDonorForm({ ...newDonorForm, mobile: e.target.value })}
            />
            <Input
              label="Email (Optional)"
              type="email"
              placeholder="name@email.com"
              value={newDonorForm.email}
              onChange={(e) => setNewDonorForm({ ...newDonorForm, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Weight (kg, min 45kg)"
              type="number"
              value={newDonorForm.weight}
              onChange={(e) => setNewDonorForm({ ...newDonorForm, weight: e.target.value })}
            />
            <Input
              label="Hemoglobin (g/dL, min 12.5)"
              type="number"
              step="0.1"
              value={newDonorForm.hemoglobin}
              onChange={(e) => setNewDonorForm({ ...newDonorForm, hemoglobin: e.target.value })}
            />
            <Input
              label="Blood Pressure (mmHg)"
              placeholder="120/80"
              value={newDonorForm.bloodPressure}
              onChange={(e) => setNewDonorForm({ ...newDonorForm, bloodPressure: e.target.value })}
            />
          </div>

          <Input
            label="Residential Address / Area"
            placeholder="e.g. Indiranagar, Bengaluru"
            value={newDonorForm.address}
            onChange={(e) => setNewDonorForm({ ...newDonorForm, address: e.target.value })}
          />

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="emergencyVolunteer"
              checked={newDonorForm.isEmergencyVolunteer}
              onChange={(e) => setNewDonorForm({ ...newDonorForm, isEmergencyVolunteer: e.target.checked })}
              className="w-4 h-4 text-rose-600 rounded cursor-pointer"
            />
            <label htmlFor="emergencyVolunteer" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              Register as 24x7 Emergency SOS Volunteer for trauma & acute calls
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" icon={Plus}>
              Register Donor
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: REQUEST BLOOD UNIT */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Create Patient Blood Requisition"
        subtitle="Issue high-priority request to Blood Bank with automated cross-match"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateRequestSubmit} className="space-y-3.5 text-xs">
          <Input
            label="Patient Name"
            required
            placeholder="e.g. Ramesh Sundaram"
            value={newReqForm.patientName}
            onChange={(e) => setNewReqForm({ ...newReqForm, patientName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Blood Group Required"
              options={BLOOD_GROUPS}
              value={newReqForm.bloodGroup}
              onChange={(e) => setNewReqForm({ ...newReqForm, bloodGroup: e.target.value })}
            />
            <Select
              label="Component Required"
              options={BLOOD_COMPONENTS}
              value={newReqForm.component}
              onChange={(e) => setNewReqForm({ ...newReqForm, component: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Units Needed"
              type="number"
              min="1"
              max="10"
              value={newReqForm.unitsNeeded}
              onChange={(e) => setNewReqForm({ ...newReqForm, unitsNeeded: e.target.value })}
            />
            <Select
              label="Clinical Priority"
              options={['STAT Emergency', 'Urgent', 'Routine Elective']}
              value={newReqForm.priority}
              onChange={(e) => setNewReqForm({ ...newReqForm, priority: e.target.value })}
            />
            <Select
              label="Department"
              options={['Emergency & Trauma', 'ICU', 'Cardiology / OT', 'Orthopedics', 'General Surgery']}
              value={newReqForm.department}
              onChange={(e) => setNewReqForm({ ...newReqForm, department: e.target.value })}
            />
          </div>

          <Input
            label="Clinical Indication / Diagnosis"
            placeholder="e.g. Acute hemorrhagic shock, scheduled joint replacement"
            value={newReqForm.clinicalIndication}
            onChange={(e) => setNewReqForm({ ...newReqForm, clinicalIndication: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" icon={Droplet}>
              Dispatch Requisition
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: RECORD DONATION */}
      {recordDonationModal && (
        <Modal
          isOpen={Boolean(recordDonationModal)}
          onClose={() => setRecordDonationModal(null)}
          title={`Record Blood Donation — ${recordDonationModal.name}`}
          subtitle={`Blood Group: ${recordDonationModal.bloodGroup} • Lifetime Donations: ${recordDonationModal.totalDonations}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRecordDonationSubmit} className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex justify-between font-bold">
                <span>Donor ID:</span>
                <span className="font-mono text-teal-600 dark:text-teal-400">{recordDonationModal.id}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Target Credit Inventory:</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">{recordDonationModal.bloodGroup}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Hemoglobin Level:</span>
                <span>{recordDonationModal.hemoglobin} g/dL (Normal)</span>
              </div>
            </div>

            <Select
              label="Component Separated & Collected"
              options={BLOOD_COMPONENTS}
              value={adjustForm.component}
              onChange={(e) => setAdjustForm({ ...adjustForm, component: e.target.value })}
            />

            <Input
              label="Collection Notes / Phlebotomist ID"
              placeholder="e.g. Standard 350ml whole blood bag collection"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setRecordDonationModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" icon={CheckCircle2}>
                Confirm Intake & Credit Unit
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: ADJUST INVENTORY */}
      {adjustStockModal && (
        <Modal
          isOpen={Boolean(adjustStockModal)}
          onClose={() => setAdjustStockModal(null)}
          title={`Adjust Inventory — ${adjustStockModal.bloodGroup}`}
          subtitle={`Facility: ${currentHospital.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAdjustStockSubmit} className="space-y-3.5 text-xs">
            <Select
              label="Blood Component"
              options={BLOOD_COMPONENTS}
              value={adjustForm.component}
              onChange={(e) => setAdjustForm({ ...adjustForm, component: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Units Delta (+/-)"
                type="number"
                value={adjustForm.delta}
                onChange={(e) => setAdjustForm({ ...adjustForm, delta: Number(e.target.value) || 0 })}
              />
              <Input
                label="Reason"
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setAdjustStockModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Apply Adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 5: SCHEDULE DONATION DRIVE */}
      <Modal
        isOpen={campModalOpen}
        onClose={() => setCampModalOpen(false)}
        title="Schedule Community Blood Donation Camp"
        subtitle="Deploy mobile blood bus and phlebotomy team"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCampSubmit} className="space-y-3.5 text-xs">
          <Input
            label="Drive Title"
            required
            placeholder="e.g. IT Corridor Corporate Blood Camp"
            value={newCampForm.title}
            onChange={(e) => setNewCampForm({ ...newCampForm, title: e.target.value })}
          />

          <Input
            label="Organizer Organization / Trust"
            required
            placeholder="e.g. Rotary Club Bengaluru Central"
            value={newCampForm.organizer}
            onChange={(e) => setNewCampForm({ ...newCampForm, organizer: e.target.value })}
          />

          <Input
            label="Venue / Campus Address"
            required
            placeholder="e.g. Bagmane Tech Park, CV Raman Nagar"
            value={newCampForm.venue}
            onChange={(e) => setNewCampForm({ ...newCampForm, venue: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              required
              value={newCampForm.date}
              onChange={(e) => setNewCampForm({ ...newCampForm, date: e.target.value })}
            />
            <Input
              label="Target Units"
              type="number"
              value={newCampForm.targetUnits}
              onChange={(e) => setNewCampForm({ ...newCampForm, targetUnits: e.target.value })}
            />
          </div>

          <Input
            label="Contact Person / Phone"
            placeholder="e.g. Mr. K. Sharma (+91 9845012345)"
            value={newCampForm.contactPerson}
            onChange={(e) => setNewCampForm({ ...newCampForm, contactPerson: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setCampModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" icon={Calendar}>
              Publish Camp
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: ISSUE DONOR CERTIFICATE & CARD */}
      {certificateDonor && (
        <Modal
          isOpen={Boolean(certificateDonor)}
          onClose={() => setCertificateDonor(null)}
          title="Official Blood Donor Recognition Card"
          subtitle="Arogya Queue National Health Mission Verified Donor Identity"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            {/* Themed Printable Certificate Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white shadow-2xl border-2 border-rose-500/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-rose-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-bold text-white shadow-xs">
                    <Droplet className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs tracking-tight uppercase">AROGYA HEALTH NETWORK</h3>
                    <p className="text-[9px] text-rose-300 font-mono">VOLUNTARY BLOOD DONOR CARD</p>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-slate-300 border border-white/20">
                  {certificateDonor.id}
                </div>
              </div>

              <div className="my-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Donor Name</div>
                  <div className="text-lg font-extrabold text-white">{certificateDonor.name}</div>
                  <div className="text-[11px] text-rose-300 font-mono mt-0.5">
                    {certificateDonor.age} yrs • {certificateDonor.gender} • {certificateDonor.city}
                  </div>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-rose-600/90 border-2 border-rose-400 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-[9px] font-bold text-rose-200">GROUP</span>
                  <span className="text-2xl font-black font-mono leading-none text-white">
                    {certificateDonor.bloodGroup}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md p-3 rounded-2xl text-[10px] border border-white/10 font-mono">
                <div>
                  <span className="text-slate-400 block text-[8px]">TOTAL DONATIONS</span>
                  <span className="font-bold text-white text-xs">{certificateDonor.totalDonations || 1} Units</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px]">HEMOGLOBIN</span>
                  <span className="font-bold text-emerald-400 text-xs">{certificateDonor.hemoglobin} g/dL</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px]">FACILITY</span>
                  <span className="font-bold text-slate-200 text-xs truncate">BCH Central</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-center justify-between text-[9px] text-slate-400">
                <span>Certified by Medical Superintendent</span>
                <span className="font-mono text-emerald-400">✓ Digitally Verified</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setCertificateDonor(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.print();
                }}
                icon={Printer}
              >
                Print / Save Card
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default BloodBank;
