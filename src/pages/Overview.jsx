import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  HeartPulse,
  BedDouble,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  FlaskConical,
} from 'lucide-react';
import { MotionStrip } from '../components/motion/MotionKit';
import { useHealthcare } from '../context/AppContext';
import { HospitalSelector } from '../components/layout/HospitalSelector';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { formatTime } from '../utils/formatters';
import { DutyRosterPanel, OnDutyCountTile } from '../components/duty/DutyViews';

export function Overview() {
  const {
    activeHospitalId,
    getHospitalMetrics,
    hospitals,
    patients,
    emergencyMode,
  } = useHealthcare();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamically derived metrics for the selected hospital
  const metrics = getHospitalMetrics(activeHospitalId);
  const currentHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[0];

  // Diagnostic laboratory and investigation telemetry for current hospital
  const hospitalPatients = patients.filter((p) => p.hospitalId === activeHospitalId);
  const totalTestsOrdered = hospitalPatients.reduce((acc, p) => {
    const tests = p.labRequests || p.testsOrdered || [];
    return acc + tests.length;
  }, 0);
  const testsCompleted = hospitalPatients.reduce((acc, p) => {
    const tests = p.labRequests || p.testsOrdered || [];
    return acc + tests.filter((t) => t.status === 'Completed').length;
  }, 0);
  const testsPending = totalTestsOrdered - testsCompleted;

  // Recent activity logs derived from hospital's patients
  const recentActivities = hospitalPatients
    .slice(0, 5)
    .map((p) => {
      const latestJourney = p.journey && p.journey.length > 0 ? p.journey[p.journey.length - 1] : null;
      return {
        id: p.id,
        patientName: p.name,
        token: p.token,
        action: latestJourney?.stage || p.status,
        note: latestJourney?.note || `Queue position #${p.queuePosition}`,
        time: latestJourney?.time || formatTime(p.registeredAt),
        priority: p.priority,
      };
    });

  return (
    <div className="space-y-6"
>
      <DutyRosterPanel />
      <MotionStrip variant="nurse" />
      {/* Command Center Top Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950/80 to-slate-950 p-6 sm:p-8 text-white shadow-2xl overflow-hidden border border-teal-500/30 glass-card">
        {/* Glow backdrop decorative elements */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 backdrop-blur-md shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Live Command Center Telemetry
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Real-time Sync Active
              </span>
              {emergencyMode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600/90 text-white border border-red-400">
                  <HeartPulse className="w-3.5 h-3.5" /> City Emergency Mode
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                {currentHospital?.name}
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono font-medium">
                  {currentHospital?.id}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300/90 mt-1.5 max-w-2xl leading-relaxed">
                Autonomous orchestrator monitoring outpatient smart queues, emergency triage velocity, ICU bed matrix telemetry, and inter-facility healthcare network.
              </p>
            </div>

            {/* Quick Action Navigation Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/patient-flow')}
                icon={Users}
                className="shadow-lg shadow-teal-500/20"
              >
                Smart OPD Flow
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/doctor-desk')}
                icon={Sparkles}
                className="bg-white/15 hover:bg-white/25 text-white border-white/20"
              >
                Doctor Desk
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/hospital-os')}
                icon={BedDouble}
                className="bg-white/15 hover:bg-white/25 text-white border-white/20"
              >
                Bed Matrix
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/city-grid')}
                icon={ArrowUpRight}
                className="text-teal-300 hover:text-white hover:bg-white/10"
              >
                City Grid
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center gap-3 bg-white/10 dark:bg-black/30 backdrop-blur-xl p-4 rounded-2xl border border-white/15 shadow-xl shrink-0">
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-200">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white">
                  {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <HospitalSelector className="text-slate-900 dark:text-slate-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Key Performance Indicators (Dynamic according to selected hospital) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Patients Today"
          value={metrics.patientsToday}
          subtitle={`${metrics.registeredPatients} in active flow`}
          icon={Users}
          variant="teal"
          trend={{ value: '+14%', isPositive: true }}
          onClick={() => navigate('/patient-flow')}
        />

        <StatCard
          title="Waiting OPD"
          value={metrics.waitingPatients}
          subtitle={`Avg wait ~${metrics.averageWait} mins`}
          icon={Clock}
          variant="amber"
          onClick={() => navigate('/patient-flow')}
        />

        <StatCard
          title="Emergency Cases"
          value={metrics.emergencyPatients}
          subtitle="STAT priority triage"
          icon={HeartPulse}
          variant="rose"
          onClick={() => navigate('/patient-flow')}
        />

        <StatCard
          title="Available Beds"
          value={`${metrics.availableBeds} / ${metrics.totalBeds}`}
          subtitle={`ICU Occupancy ${metrics.icuOccupancy}%`}
          icon={BedDouble}
          variant="blue"
          onClick={() => navigate('/hospital-os')}
        />
      </div>

      {/* Diagnostic & Lab Operations Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-2xl glass-card border border-violet-500/20 dark:border-violet-500/30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Diagnostic & Lab Investigation Flow
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                Live Queue Synced
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Integrated real-time tracking across OPD Doctor Desk, Pathology, and Radiology
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/50">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Total:</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-100">{totalTestsOrdered}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Processing:</span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400">{testsPending}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Completed:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{testsCompleted}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/patient-flow')}
            className="text-violet-600 hover:text-violet-700 dark:text-violet-400 text-xs font-bold"
          >
            View Active Queue &rarr;
          </Button>
        </div>
      </div>

      {/* Middle Row: Patient Flow Chart & Bed Occupancy Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Flow Interactive Chart */}
        <Card
          className="lg:col-span-2 glass-card"
          title="OPD Patient Inflow Telemetry"
          subtitle="Real-time hourly arrivals vs consultations completed"
          headerAction={
            <Button variant="ghost" size="sm" onClick={() => navigate('/patient-flow')}>
              View Queue
            </Button>
          }
        >
          {/* Stylized SVG Hourly Inflow Chart */}
          <div className="pt-2">
            <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6">
              {[
                { time: '08 AM', inflow: 12, completed: 8 },
                { time: '09 AM', inflow: 28, completed: 18 },
                { time: '10 AM', inflow: 45, completed: 32 },
                { time: '11 AM', inflow: 52, completed: 41 },
                { time: '12 PM', inflow: 38, completed: 35 },
                { time: '01 PM', inflow: 22, completed: 26 },
                { time: '02 PM', inflow: 34, completed: 28 },
                { time: '03 PM', inflow: metrics.waitingPatients * 4 + 10, completed: 24 },
              ].map((bar, idx) => {
                const maxVal = 60;
                const inflowH = (bar.inflow / maxVal) * 100;
                const completedH = (bar.completed / maxVal) * 100;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100">
                      {bar.inflow}
                    </div>
                    <div className="w-full flex items-end justify-center gap-1.5 h-36">
                      <div
                        style={{ height: `${inflowH}%` }}
                        className="w-3 sm:w-4 rounded-t-lg bg-gradient-to-t from-teal-600 to-teal-400 group-hover:from-teal-500 group-hover:to-teal-300 shadow-sm"
                        title={`Arrivals: ${bar.inflow}`}
                      />
                      <div
                        style={{ height: `${completedH}%` }}
                        className="w-3 sm:w-4 rounded-t-lg bg-gradient-to-t from-sky-600/70 to-sky-400/80 group-hover:from-sky-500 group-hover:to-sky-300 shadow-sm"
                        title={`Completed: ${bar.completed}`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold tracking-tight">
                      {bar.time}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-gradient-to-r from-teal-500 to-teal-400 shadow-xs" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Patient Arrivals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-gradient-to-r from-sky-500 to-sky-400 shadow-xs" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Consultations Finalized</span>
              </div>
            </div>
          </div>
        </Card>

        {/* ICU & Critical Care Matrix */}
        <Card
          className="glass-card"
          title="Bed Capacity Telemetry"
          subtitle={`Total capacity: ${metrics.totalBeds} licensed beds`}
          headerAction={
            <Button variant="ghost" size="sm" onClick={() => navigate('/hospital-os')}>
              Bed Matrix
            </Button>
          }
        >
          <div className="space-y-4 pt-1">
            <ProgressBar
              label="Intensive Care Unit (ICU)"
              value={metrics.icuOccupancy}
              max={100}
              showPercentage
              color={metrics.icuOccupancy > 80 ? 'rose' : 'amber'}
            />

            <ProgressBar
              label="Emergency & Trauma Beds"
              value={Math.round((metrics.emergencyPatients / currentHospital.emergencyCapacity) * 100)}
              max={100}
              showPercentage
              color="rose"
            />

            <ProgressBar
              label="General & Inpatient Wards"
              value={Math.round(((metrics.totalBeds - metrics.availableBeds) / metrics.totalBeds) * 100)}
              max={100}
              showPercentage
              color="teal"
            />

            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-2.5 mt-4 backdrop-blur-xs">
              <div className="flex justify-between items-center font-medium">
                <span className="text-slate-500 dark:text-slate-400">Available ICU Ventilators</span>
                <span className="font-bold text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800">
                  {Math.max(1, Math.round(metrics.icuBeds * (1 - metrics.icuOccupancy / 100)))} Units Active
                </span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span className="text-slate-500 dark:text-slate-400">Facility Operational Status</span>
                <Badge variant={currentHospital.status === 'Busy' ? 'warning' : 'success'} size="sm">
                  {currentHospital.status}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Recent Live Queue Activity & AI Assistant Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patient Activity */}
        <Card
          className="lg:col-span-2 glass-card"
          title="Live Queue Transitions"
          subtitle="Recent patient milestone events across OPD, Lab, and Pharmacy"
          headerAction={
            <Button variant="ghost" size="sm" onClick={() => navigate('/patient-flow')}>
              Open Smart Queue
            </Button>
          }
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent queue events.</p>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-xl">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-mono font-extrabold text-[12px] shrink-0 border border-teal-500/30 shadow-xs">
                      {act.token}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {act.patientName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{act.note}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant={
                        act.action === 'Doctor Consultation' ? 'teal' :
                        act.action === 'Lab Investigation' ? 'purple' :
                        act.action === 'Discharge' ? 'success' :
                        act.priority === 'Emergency' ? 'emergency' : 'default'
                      }
                      size="sm"
                    >
                      {act.action}
                    </Badge>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono font-medium">{act.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* AI Operational Insights Quick Card */}
        <Card
          className="glass-card glow-border-teal"
          title="AI Operational Intelligence"
          subtitle="Autonomous heuristic facility forecasting"
          headerAction={
            <Button variant="ghost" size="sm" onClick={() => navigate('/ai')}>
              Full Analysis
            </Button>
          }
        >
          <div className="space-y-3 pt-1 text-xs">
            <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-300 mb-1.5">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>OPD Load Surge Expected</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300/90 leading-relaxed text-[11px]">
                Waiting queue is expected to peak between 11:30 AM and 01:00 PM based on registration velocity and doctor turnover rates.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>ICU Capacity Approaching 80%</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300/90 leading-relaxed text-[11px]">
                Recommendation: Stage step-down recovery beds in General Medicine ward to release emergency ventilator slots.
              </p>
            </div>

            <div className="p-3 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium">
              ✨ AI-assisted operational intelligence • Non-diagnostic advisory
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
