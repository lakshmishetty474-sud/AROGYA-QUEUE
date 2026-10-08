import React, { useState } from 'react';
import {
  Network,
  Building2,
  Ambulance,
  HeartPulse,
  AlertTriangle,
  ArrowRight,
  Plus,
  CheckCircle2,
  XCircle,
  Share2,
  Clock,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { useHealthcare } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { StatCard } from '../components/ui/StatCard';
import { InteractiveMap } from '../components/modules/InteractiveMap';
import { formatTime, formatDate } from '../utils/formatters';

export function CityGrid() {
  const {
    cityMetrics,
    hospitals,
    ambulances,
    referrals,
    patients,
    createReferral,
    updateReferralStatus,
    emergencyMode,
    setEmergencyMode,
    showToast,
  } = useHealthcare();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'map' | 'referrals'
  const [emergencyConfirmModal, setEmergencyConfirmModal] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);

  // New Referral Form
  const [newRef, setNewRef] = useState({
    patientId: patients[0]?.id || '',
    fromHospital: hospitals[0]?.id || '',
    toHospital: hospitals[1]?.id || '',
    reason: 'Specialized Cath Lab intervention and ICU ventilator standby',
    department: 'Cardiology',
    doctor: 'Dr. Arvind Sharma',
    urgency: 'Critical',
  });

  const handleCreateReferral = (e) => {
    e.preventDefault();
    if (newRef.fromHospital === newRef.toHospital) {
      showToast('Source and destination hospital cannot be identical', 'error');
      return;
    }
    createReferral(newRef);
    setReferralModalOpen(false);
  };

  const toggleEmergencyModeConfirmed = () => {
    const nextState = !emergencyMode;
    setEmergencyMode(nextState);
    setEmergencyConfirmModal(false);
    showToast(
      nextState
        ? 'CITY EMERGENCY PROTOCOL ACTIVATED: ICU Beds pooled & Ambulances routed'
        : 'City Emergency Protocol Deactivated. Returned to standard operations.',
      nextState ? 'emergency' : 'info'
    );
  };

  return (
    <div className="space-y-6">
      {/* City Emergency Confirmation Modal */}
      <Modal
        isOpen={emergencyConfirmModal}
        onClose={() => setEmergencyConfirmModal(false)}
        title={emergencyMode ? 'Deactivate City Emergency Mode?' : 'CONFIRM CITY EMERGENCY ACTIVATION'}
        subtitle="Requires Municipal Health Authority Authorization"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Critical Health Grid Alert Protocol</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              {emergencyMode
                ? 'Deactivating will restore routine hospital triage and local scheduling.'
                : 'Activating will pool all citywide ICU beds, reassign standby ambulances, prioritize emergency triage across all nodes, and enforce fast-track referrals.'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setEmergencyConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              variant={emergencyMode ? 'secondary' : 'danger'}
              size="sm"
              onClick={toggleEmergencyModeConfirmed}
            >
              {emergencyMode ? 'Deactivate Protocol' : 'Confirm Emergency Mode'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Referral Modal */}
      <Modal
        isOpen={referralModalOpen}
        onClose={() => setReferralModalOpen(false)}
        title="Initiate Inter-Hospital Digital Referral"
        subtitle="Establish secure clinical handoff protocol between medical centers"
      >
        <form onSubmit={handleCreateReferral} className="space-y-3 text-xs">
          <Select
            label="Patient"
            options={patients.map((p) => ({ value: p.id, label: `${p.name} (${p.token}) - ${p.priority}` }))}
            value={newRef.patientId}
            onChange={(e) => setNewRef({ ...newRef, patientId: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Referring Hospital (From)"
              options={hospitals.map((h) => ({ value: h.id, label: h.name }))}
              value={newRef.fromHospital}
              onChange={(e) => setNewRef({ ...newRef, fromHospital: e.target.value })}
            />
            <Select
              label="Destination Hospital (To)"
              options={hospitals.map((h) => ({ value: h.id, label: h.name }))}
              value={newRef.toHospital}
              onChange={(e) => setNewRef({ ...newRef, toHospital: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department Needed"
              options={['Cardiology', 'Neurology', 'Trauma & Emergency', 'Pulmonology', 'Pediatrics']}
              value={newRef.department}
              onChange={(e) => setNewRef({ ...newRef, department: e.target.value })}
            />
            <Select
              label="Clinical Urgency"
              options={['Critical (STAT)', 'Urgent', 'Routine Specialized']}
              value={newRef.urgency}
              onChange={(e) => setNewRef({ ...newRef, urgency: e.target.value })}
            />
          </div>

          <Input
            label="Clinical Referral Justification"
            placeholder="Reason for transfer and necessary intervention"
            value={newRef.reason}
            onChange={(e) => setNewRef({ ...newRef, reason: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setReferralModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Share2}>
              Dispatch Referral
            </Button>
          </div>
        </form>
      </Modal>

      {/* Emergency Mode Prominent Banner */}
      {emergencyMode && (
        <div className="rounded-3xl bg-red-600 text-white p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-2 border-red-400">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl shrink-0">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                CITY EMERGENCY MODE ACTIVE
              </h2>
              <p className="text-xs sm:text-sm text-red-100 mt-0.5">
                All hospital ICU beds pooled. High-priority corridor established for ambulance transfers.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEmergencyConfirmModal(true)}
            className="self-start md:self-auto bg-white text-red-700 hover:bg-red-50 font-bold"
          >
            Deactivate Emergency Mode
          </Button>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              Regional Health Network Grid
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Bengaluru Municipal Sector
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Network className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600 dark:text-teal-400" />
            Arogya City Healthcare Grid
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Regional healthcare load monitoring, inter-hospital referrals, and municipal crisis control.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!emergencyMode && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setEmergencyConfirmModal(true)}
              icon={HeartPulse}
              className="shadow-md shadow-red-500/20"
            >
              Activate Emergency Mode
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setReferralModalOpen(true)}
            icon={Plus}
            className="shadow-md shadow-teal-500/20"
          >
            Create Referral
          </Button>
        </div>
      </div>

      {/* Submodule tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800 shadow-sm self-start">
        {[
          { key: 'dashboard', label: 'City Telemetry' },
          { key: 'map', label: 'Hospital Network Map' },
          { key: 'referrals', label: `Digital Referrals (${referrals.length})` },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500/15 to-teal-500/5 text-teal-700 dark:text-teal-300 border border-teal-500/30 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CITY TELEMETRY DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Hospital Nodes"
              value={cityMetrics.totalHospitals}
              subtitle="All connected & online"
              icon={Building2}
              variant="teal"
            />
            <StatCard
              title="Citywide Patients"
              value={cityMetrics.totalPatients}
              subtitle={`${cityMetrics.emergencyCases} emergency cases`}
              icon={HeartPulse}
              variant="rose"
            />
            <StatCard
              title="Available ICU Beds"
              value={cityMetrics.icuBedsAvailable}
              subtitle={`Out of ${cityMetrics.totalBeds} total beds`}
              icon={Building2}
              variant="blue"
            />
            <StatCard
              title="Active Ambulances"
              value={cityMetrics.ambulancesActive}
              subtitle="On-duty rapid transit"
              icon={Ambulance}
              variant="amber"
            />
          </div>

          {/* Hospital Nodes Status Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hospitals.map((hosp) => (
              <Card
                key={hosp.id}
                title={hosp.name}
                subtitle={`${hosp.location} • Est. ${hosp.established}`}
                headerAction={
                  <Badge
                    variant={
                      hosp.status === 'Critical' || hosp.status === 'Emergency'
                        ? 'danger'
                        : hosp.status === 'Busy'
                        ? 'warning'
                        : 'success'
                    }
                    size="sm"
                  >
                    {hosp.status}
                  </Badge>
                }
              >
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Beds</span>
                      <span className="font-bold text-sm">{hosp.totalBeds}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ICU Capacity</span>
                      <span className="font-bold text-sm">{hosp.icuBeds} Units</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Emergency Bays: {hosp.emergencyCapacity}</span>
                    <span className="font-mono">Contact: {hosp.contact}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: NETWORK MAP */}
      {activeTab === 'map' && (
        <Card
          title="Interactive Regional Healthcare Map"
          subtitle="Real-time geo-spatial tracking of hospital node load and active ambulance units"
        >
          <InteractiveMap hospitals={hospitals} ambulances={ambulances} />
        </Card>
      )}

      {/* TAB 3: DIGITAL REFERRALS */}
      {activeTab === 'referrals' && (
        <Card
          noPadding
          title="Inter-Hospital Patient Referrals"
          subtitle="Managed transfer pipelines between municipal medical centers"
          headerAction={
            <Button variant="primary" size="sm" onClick={() => setReferralModalOpen(true)} icon={Plus}>
              Initiate Referral
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Referral ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Transfer Route (From → To)</th>
                  <th className="px-4 py-3">Department & Reason</th>
                  <th className="px-4 py-3">Urgency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No active referrals in the city network.
                    </td>
                  </tr>
                ) : (
                  referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {ref.id}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {ref.patientName}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {ref.fromHospitalName}
                        </span>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 flex items-center gap-1">
                          → {ref.toHospitalName}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold block">{ref.department}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-xs block">{ref.reason}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant={ref.urgency === 'Critical' ? 'emergency' : 'warning'} size="sm">
                          {ref.urgency}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            ref.status === 'Accepted'
                              ? 'success'
                              : ref.status === 'In Transit'
                              ? 'teal'
                              : ref.status === 'Completed'
                              ? 'default'
                              : 'warning'
                          }
                          size="sm"
                          dot
                        >
                          {ref.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {ref.status === 'Requested' && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => updateReferralStatus(ref.id, 'Accepted')}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateReferralStatus(ref.id, 'Rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {ref.status === 'Accepted' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => updateReferralStatus(ref.id, 'In Transit', 'Ambulance dispatched')}
                            >
                              Dispatch
                            </Button>
                          )}
                          {ref.status === 'In Transit' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => updateReferralStatus(ref.id, 'Completed', 'Patient admitted at destination')}
                            >
                              Admit
                            </Button>
                          )}
                        </div>
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
