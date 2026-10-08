import React from 'react';
import {
  Cpu,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  HeartPulse,
  Users,
  BedDouble,
  Pill,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useHealthcare } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { ProgressBar } from '../components/ui/ProgressBar';

export function AdvancedAI() {
  const {
    patients,
    beds,
    medicines,
    activeHospitalId,
    hospitals,
    getHospitalMetrics,
  } = useHealthcare();

  const metrics = getHospitalMetrics(activeHospitalId);
  const currentHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[0];

  // Dynamic Heuristic AI Analytics based on actual application state:
  const isHighWaiting = metrics.waitingPatients > 2;
  const isIcuStrained = metrics.icuOccupancy >= 75;
  const lowMeds = medicines.filter((m) => m.hospitalId === activeHospitalId && m.quantity < m.minStock);

  return (
    <div className="space-y-6">
      {/* AI Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950/80 to-slate-950 p-6 sm:p-8 text-white shadow-2xl overflow-hidden border border-teal-500/30 glass-card">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 backdrop-blur-md shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                Autonomous Heuristic Engine
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Live Telemetry Ingestion
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              AI Operational Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/90 max-w-2xl leading-relaxed">
              Predictive healthcare intelligence analyzing OPD queue surge velocity, ICU bed saturation probabilities, pharmaceutical stock depletion, and automated facility balancing.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/15 text-xs space-y-1 shrink-0">
            <div className="text-[11px] font-bold text-teal-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Operational Heuristic Model Active
            </div>
            <div className="text-[10px] text-slate-300">
              Advisory Decision Support System (ADSS)
            </div>
          </div>
        </div>
      </div>

      {/* Primary Forecast Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Predicted OPD Surge"
          value={isHighWaiting ? '+35%' : '+12%'}
          subtitle="Estimated between 11:30 AM - 1:30 PM"
          icon={TrendingUp}
          variant="teal"
        />
        <StatCard
          title="ICU Saturation Risk"
          value={metrics.icuOccupancy > 70 ? 'High' : 'Moderate'}
          subtitle={`Current occupancy: ${metrics.icuOccupancy}%`}
          icon={HeartPulse}
          variant={metrics.icuOccupancy > 70 ? 'rose' : 'amber'}
        />
        <StatCard
          title="Supply Reorder Signals"
          value={`${lowMeds.length} Items`}
          subtitle="Formulary below safety threshold"
          icon={Pill}
          variant={lowMeds.length > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Expected Discharge"
          value="4 Patients"
          subtitle="Potential bed release before 4 PM"
          icon={BedDouble}
          variant="blue"
        />
      </div>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: OPD Demand Forecasting */}
        <Card
          className="glass-card glow-border-teal"
          title="Smart OPD Queue Traffic Prediction"
          subtitle="Dynamic queue arrival forecasting based on regional registration speed"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700 dark:text-slate-300">Queue Velocity Index</span>
                <span className="text-teal-600 font-mono">
                  {metrics.waitingPatients * 1.8 + 4.2} pts / hour
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isHighWaiting
                  ? 'OPD patient arrival rate currently exceeds single-room consultation turnover. Recommend assigning second consultation desk to General Medicine.'
                  : 'Outpatient queue movement is currently within expected normal operational parameters (~12 mins avg consultation).'}
              </p>
            </div>

            <ProgressBar
              label="Consultation Desk Capacity Utilization"
              value={Math.min(100, metrics.waitingPatients * 22)}
              max={100}
              showPercentage
              color={isHighWaiting ? 'amber' : 'teal'}
            />
          </div>
        </Card>

        {/* Section 2: Bed Demand & ICU Stress Prediction */}
        <Card
          className="glass-card"
          title="Bed Availability & Critical Care Forecast"
          subtitle="Inpatient bed turnover prediction for next 12 hours"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex justify-between font-bold">
                <span className="text-slate-700 dark:text-slate-300">Projected ICU Influx</span>
                <span className={isIcuStrained ? 'text-rose-500 font-mono' : 'text-emerald-500 font-mono'}>
                  {isIcuStrained ? 'High Strain Expected' : 'Optimal Capacity'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isIcuStrained
                  ? 'Critical alert: ICU occupancy is approaching saturation threshold. Consider staging step-down transfer to General ward or initiate City Grid referral protocol.'
                  : 'Adequate ICU bed margins available. Standby ventilator bays operational.'}
              </p>
            </div>

            <ProgressBar
              label="ICU Bed Saturation Index"
              value={metrics.icuOccupancy}
              max={100}
              showPercentage
              color={isIcuStrained ? 'rose' : 'blue'}
            />
          </div>
        </Card>

        {/* Section 3: Pharmacy Stock & Supply Predictions */}
        <Card
          className="glass-card"
          title="Pharmacy Formulary Depletion Forecasting"
          subtitle="Automated detection of impending pharmaceutical shortages"
        >
          <div className="space-y-3 text-xs">
            {lowMeds.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                All medications are currently above minimum safety reserve levels.
              </div>
            ) : (
              lowMeds.map((med) => (
                <div
                  key={med.id}
                  className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {med.name} ({med.dosageForm})
                    </span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400">
                      Current stock: {med.quantity} units (Threshold: {med.minStock})
                    </span>
                  </div>
                  <Badge variant="danger" size="sm">
                    Reorder Recommended
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Section 4: Operational Recommendations */}
        <Card
          className="glass-card glow-border-cyan"
          title="Autonomous Facility Recommendations"
          subtitle="System generated action items for hospital management"
        >
          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Synchronize Pharmacy Dispense Counter
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pre-pack common analgesics and antipyretics to reduce outpatient checkout times.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Verify Standby Ambulance Fuel & Oxygen
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Confirm KA-01-GA-8822 standby readiness for potential inter-facility referral handoffs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  City Grid Emergency Routing Active
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Municipal health mesh communication latency is under 40ms.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
