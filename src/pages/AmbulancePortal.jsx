import React, { useState, useEffect } from 'react';
import {
  Ambulance,
  Users,
  MapPin,
  Phone,
  Navigation,
  Fuel,
  Gauge,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Key,
  Plus,
} from 'lucide-react';
import { MotionStrip } from '../components/motion/MotionKit';
import { useHealthcare } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { StatCard } from '../components/ui/StatCard';
import { InteractiveMap } from '../components/modules/InteractiveMap';

export function AmbulancePortal() {
  const {
    ambulances,
    ambulanceEmployees,
    hospitals,
    activeHospitalId,
    addAmbulance,
    showToast,
    ambulanceRequests,
    acceptAmbulanceRequest,
    updateAmbulanceRequestStatus,
    cancelAmbulanceRequest,
  } = useHealthcare();

  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'requests' | 'employees' | 'tracking'
  const [selectedAmbulance, setSelectedAmbulance] = useState(ambulances[0] || null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState('All');
  const [selectedAssignAmbId, setSelectedAssignAmbId] = useState('');
  const [ambForm, setAmbForm] = useState({
    code: '',
    driver: '',
    contact: '',
    hospitalId: activeHospitalId || 'HOSP-01',
    status: 'Available',
    priority: 'Normal',
    currentLocation: 'Emergency Wing Base',
  });

  const pendingRequestsCount = ambulanceRequests?.filter((r) => r.status === 'Pending').length || 0;
  const filteredRequests = (ambulanceRequests || []).filter((req) => {
    if (requestStatusFilter === 'All') return true;
    if (requestStatusFilter === 'Pending') return req.status === 'Pending';
    if (requestStatusFilter === 'Active') return req.status !== 'Pending' && req.status !== 'Completed' && req.status !== 'Cancelled';
    if (requestStatusFilter === 'Completed') return req.status === 'Completed';
    return true;
  });

  // Simulated live countdown / movement
  const [liveSeconds, setLiveSeconds] = useState(360);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveSeconds((prev) => (prev > 10 ? prev - 1 : 360));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatEta = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleRegisterAmbSubmit = async (e) => {
    e.preventDefault();
    if (!ambForm.code.trim() || !ambForm.driver.trim()) {
      showToast('Please provide ambulance registration code and driver name', 'error');
      return;
    }
    await addAmbulance(ambForm);
    setRegisterModalOpen(false);
    setAmbForm({
      code: '',
      driver: '',
      contact: '',
      hospitalId: activeHospitalId || 'HOSP-01',
      status: 'Available',
      priority: 'Normal',
      currentLocation: 'Emergency Wing Base',
    });
  };

  const activeCount = ambulances.filter((a) => a.status === 'On Duty' || a.status === 'On Call').length;
  const availableCount = ambulances.filter((a) => a.status === 'Available').length;

  return (
    <div className="space-y-6">
      <MotionStrip variant="ambulance" />
      {/* Register Ambulance Modal */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Register New Ambulance Unit"
        subtitle="Enlist emergency vehicle into City Health telemetry"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRegisterAmbSubmit} className="space-y-3 text-xs">
          <Input
            label="Vehicle Registration Code *"
            placeholder="e.g. KA-01-EQ-9988"
            value={ambForm.code}
            onChange={(e) => setAmbForm({ ...ambForm, code: e.target.value })}
            required
          />
          <Input
            label="Primary Driver Name *"
            placeholder="e.g. Raghavan K."
            value={ambForm.driver}
            onChange={(e) => setAmbForm({ ...ambForm, driver: e.target.value })}
            required
          />
          <Input
            label="Driver Contact Mobile *"
            placeholder="e.g. +91 98450 12345"
            value={ambForm.contact}
            onChange={(e) => setAmbForm({ ...ambForm, contact: e.target.value })}
          />
          <Select
            label="Assigned Hospital Base"
            options={hospitals.map((h) => ({ value: h.id, label: h.name }))}
            value={ambForm.hospitalId}
            onChange={(e) => setAmbForm({ ...ambForm, hospitalId: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Fleet Status"
              options={[
                { value: 'Available', label: 'Available' },
                { value: 'On Duty', label: 'On Duty' },
                { value: 'Maintenance', label: 'Maintenance' },
              ]}
              value={ambForm.status}
              onChange={(e) => setAmbForm({ ...ambForm, status: e.target.value })}
            />
            <Select
              label="Priority Level"
              options={[
                { value: 'Normal', label: 'Normal' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' },
              ]}
              value={ambForm.priority}
              onChange={(e) => setAmbForm({ ...ambForm, priority: e.target.value })}
            />
          </div>
          <Input
            label="Current Location / Post"
            placeholder="e.g. South Corridor Outpost"
            value={ambForm.currentLocation}
            onChange={(e) => setAmbForm({ ...ambForm, currentLocation: e.target.value })}
          />
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Plus}>
              Save to Supabase
            </Button>
          </div>
        </form>
      </Modal>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Ambulance className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            Emergency Ambulance Fleet Network
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time emergency dispatch telemetry, crew directory, and rapid route navigation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRegisterModalOpen(true)}
            icon={Plus}
          >
            Register Ambulance
          </Button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800 self-start">
          {[
            { key: 'fleet', label: 'Fleet Status', icon: Ambulance },
            {
              key: 'requests',
              label: `Ambulance Requests (${pendingRequestsCount})`,
              icon: ShieldAlert,
            },
            { key: 'tracking', label: 'Live GPS Tracking', icon: Navigation },
            { key: 'employees', label: 'Crew Directory', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Fleet"
          value={ambulances.length}
          subtitle="Advanced Cardiac Life Support"
          icon={Ambulance}
          variant="teal"
        />
        <StatCard
          title="Active On Duty"
          value={activeCount}
          subtitle="En route with patients"
          icon={Navigation}
          variant="rose"
        />
        <StatCard
          title="Station Standby"
          value={availableCount}
          subtitle="Immediate dispatch ready"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Average Response"
          value="6.8 mins"
          subtitle="Urban corridor average"
          icon={Clock}
          variant="amber"
        />
      </div>

      {/* TAB 1: FLEET STATUS & DETAIL */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ambulance Units List */}
          <Card className="lg:col-span-2" noPadding title="Emergency Fleet Units" subtitle="Click any vehicle to inspect telemetry">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {ambulances.map((amb) => {
                const isSelected = selectedAmbulance?.id === amb.id;
                const isOnDuty = amb.status === 'On Duty';
                return (
                  <div
                    key={amb.id}
                    onClick={() => setSelectedAmbulance(amb)}
                    className={`p-4 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-teal-50/60 dark:bg-teal-950/40 border-l-4 border-teal-600 dark:border-teal-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl text-white shrink-0 ${
                          isOnDuty ? 'bg-rose-600 animate-pulse' : 'bg-slate-700'
                        }`}
                      >
                        <Ambulance className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {amb.code}
                          </span>
                          <Badge
                            variant={
                              amb.status === 'On Duty'
                                ? 'danger'
                                : amb.status === 'Available'
                                ? 'success'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {amb.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Driver: <span className="font-semibold text-slate-700 dark:text-slate-300">{amb.driver}</span> • Contact: {amb.contact}
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:text-right text-xs">
                      {amb.assignedPatient ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold block truncate max-w-xs">
                          {amb.assignedPatient}
                        </span>
                      ) : (
                        <span className="text-slate-400 block">No Active Patient</span>
                      )}
                      <span className="text-[11px] text-slate-500 font-mono">
                        ETA: {amb.status === 'On Duty' ? formatEta(liveSeconds) : amb.eta}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Selected Vehicle Telemetry */}
          {selectedAmbulance ? (
            <Card title="Vehicle Telemetry" subtitle={selectedAmbulance.code}>
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Position</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAmbulance.currentLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination Bay</span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">{selectedAmbulance.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transit Speed</span>
                    <span className="font-mono font-bold">{selectedAmbulance.speedKmH} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fuel Level</span>
                    <span className="font-mono font-bold text-emerald-600">{selectedAmbulance.fuelLevel}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Onboard Emergency Equipment
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAmbulance.equipment?.map((eq, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10px] font-semibold border border-teal-200 dark:border-teal-800"
                      >
                        ✓ {eq}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveTab('tracking')}
                    icon={Navigation}
                  >
                    Track on Live GPS Map
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="text-center py-12 text-slate-400 text-xs">
              Select an ambulance to inspect equipment and live route.
            </Card>
          )}
        </div>
      )}

      {/* TAB: AMBULANCE REQUESTS (DRIVER DASHBOARD) */}
      {activeTab === 'requests' && (
        <Card
          title="Emergency Ambulance Dispatch Queue"
          subtitle="Real-time incoming emergency requests from patients and hospital triage coordinators"
          headerAction={
            <div className="flex items-center gap-2">
              <select
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="All">All Requests</option>
                <option value="Pending">Pending Only</option>
                <option value="Active">Active / In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          }
        >
          {filteredRequests.length === 0 ? (
            <div className="p-10 text-center text-slate-400 space-y-2">
              <ShieldAlert className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs">No emergency ambulance requests found.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {filteredRequests.map((req) => {
                const isPending = req.status === 'Pending';
                const isAccepted = req.status === 'Accepted';
                const isDriverEnRoute = req.status === 'Driver En Route';
                const isArrivedPickup = req.status === 'Arrived at Pickup';
                const isPatientPickedUp = req.status === 'Patient Picked Up';
                const isEnRouteHosp = req.status === 'En Route to Hospital';
                const isArrivedHosp = req.status === 'Arrived at Hospital';
                const isCompleted = req.status === 'Completed';

                return (
                  <div
                    key={req.requestId}
                    className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                      isPending
                        ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-400'
                        : isCompleted
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        : 'bg-teal-50/50 dark:bg-teal-950/30 border-teal-500/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl text-white ${isPending ? 'bg-rose-600 animate-pulse' : 'bg-slate-800'}`}>
                          <Ambulance className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                              {req.requestId}
                            </span>
                            <Badge variant={isPending ? 'danger' : 'amber'} size="sm">
                              {req.emergencyType}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Requested: {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Patient: <strong>{req.patientName}</strong> ({req.mobile})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Badge
                          variant={
                            isCompleted
                              ? 'success'
                              : isPending
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {req.status}
                        </Badge>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Navigation}
                          onClick={() => setActiveTab('tracking')}
                        >
                          View Map
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px]">PICKUP LOCATION</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          {req.pickupLocation}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">DESTINATION FACILITY</span>
                        <span className="font-bold text-teal-600 dark:text-teal-400 mt-0.5 block">
                          {req.destination}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ASSIGNED VEHICLE & CREW</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 mt-0.5 block">
                          {req.ambulanceCode ? `${req.ambulanceCode} (${req.driverName})` : 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                        Notes: {req.notes}
                      </p>
                    )}

                    {/* Driver Status Progression Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="text-[11px] text-slate-500 font-mono">
                        ETA: <strong className="text-slate-800 dark:text-slate-200">{req.eta}</strong>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isPending && (
                          <>
                            <select
                              value={selectedAssignAmbId}
                              onChange={(e) => setSelectedAssignAmbId(e.target.value)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
                            >
                              <option value="">Auto-Assign Available Unit</option>
                              {ambulances.filter((a) => a.status === 'Available').map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.code} — {a.driver}
                                </option>
                              ))}
                            </select>
                            <Button
                              variant="primary"
                              size="sm"
                              className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                              onClick={() => acceptAmbulanceRequest(req.requestId, selectedAssignAmbId || null)}
                            >
                              Accept Request
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                              onClick={() => cancelAmbulanceRequest(req.requestId)}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {isAccepted && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => updateAmbulanceRequestStatus(req.requestId, 'Driver En Route')}
                          >
                            Start Trip: Driver En Route
                          </Button>
                        )}

                        {isDriverEnRoute && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-sky-600 hover:bg-sky-700 text-white"
                            onClick={() => updateAmbulanceRequestStatus(req.requestId, 'Arrived at Pickup')}
                          >
                            Arrived at Pickup Location
                          </Button>
                        )}

                        {isArrivedPickup && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => updateAmbulanceRequestStatus(req.requestId, 'Patient Picked Up')}
                          >
                            Mark Patient Picked Up
                          </Button>
                        )}

                        {isPatientPickedUp && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => updateAmbulanceRequestStatus(req.requestId, 'En Route to Hospital')}
                          >
                            En Route to Hospital
                          </Button>
                        )}

                        {isEnRouteHosp && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => updateAmbulanceRequestStatus(req.requestId, 'Arrived at Hospital')}
                          >
                            Arrived at Hospital
                          </Button>
                        )}

                        {isArrivedHosp && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            onClick={() => updateAmbulanceRequestStatus(req.requestId, 'Completed')}
                          >
                            Complete Emergency Mission
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: LIVE TRACKING MAP */}
      {activeTab === 'tracking' && (
        <div className="space-y-4">
          {/* Google Maps API configuration notice */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Key className="w-4 h-4 text-teal-500" />
              <span>
                <strong>Google Maps Ready:</strong> To enable real-world satellite tiles, provide `VITE_GOOGLE_MAPS_KEY` in environment variables.
              </span>
            </div>
            <span className="text-[10px] font-bold text-teal-600 px-2 py-1 rounded-md bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800">
              Simulation Active
            </span>
          </div>

          <Card title="Live Ambulance Corridor Tracking" subtitle="High-frequency positioning across metropolitan expressways">
            <InteractiveMap hospitals={hospitals} ambulances={ambulances} />
          </Card>
        </div>
      )}

      {/* TAB 3: EMPLOYEE DIRECTORY */}
      {activeTab === 'employees' && (
        <Card noPadding title="Emergency Ambulance Staff Directory" subtitle="Roster of drivers and paramedic technicians">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Crew Member Name</th>
                  <th className="px-4 py-3">Designation & Role</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Assigned Vehicle</th>
                  <th className="px-4 py-3">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ambulanceEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                      {emp.employeeId}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {emp.name}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {emp.role}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-500">
                      {emp.contact}
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                      {emp.assignedAmbulance}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          emp.currentStatus === 'On Duty'
                            ? 'danger'
                            : emp.currentStatus === 'Available'
                            ? 'success'
                            : 'default'
                        }
                        size="sm"
                        dot
                      >
                        {emp.currentStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
