import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { useHealthcare } from '../../context/AppContext';

export function HospitalSelector({ className = '' }) {
  const { hospitals, activeHospitalId, setActiveHospitalId, showToast } = useHealthcare();

  const activeHospital = hospitals.find((h) => h.id === activeHospitalId) || hospitals[0];

  const handleSelect = (e) => {
    const selectedId = e.target.value;
    setActiveHospitalId(selectedId);
    const targetHosp = hospitals.find((h) => h.id === selectedId);
    showToast(`Switched hospital view to ${targetHosp?.name}`, 'info');
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs text-xs font-medium shadow-2xs hover:border-teal-500/40">
        <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
        <select
          value={activeHospitalId}
          onChange={handleSelect}
          className="appearance-none bg-transparent pr-6 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
        >
          {hospitals.map((hosp) => (
            <option key={hosp.id} value={hosp.id} className="dark:bg-slate-900 dark:text-slate-100">
              {hosp.name} ({hosp.code})
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5" />
      </div>

      {activeHospital?.status && (
        <span
          className={`hidden md:inline-flex ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            activeHospital.status === 'Critical' || activeHospital.status === 'Emergency'
              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
              : activeHospital.status === 'Busy'
              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
              : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {activeHospital.status}
        </span>
      )}
    </div>
  );
}
