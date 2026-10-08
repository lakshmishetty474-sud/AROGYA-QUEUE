import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Building2, Pill, Ambulance, FileText, X, ArrowRight } from 'lucide-react';
import { useHealthcare } from '../../context/AppContext';

export function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const { patients, hospitals, medicines, ambulances, referrals } = useHealthcare();
  const navigate = useNavigate();

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Handled by parent or toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return null;
    const q = query.toLowerCase();

    const matchedPatients = patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.token.toLowerCase().includes(q) ||
          p.mobile.includes(q) ||
          p.department.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedHospitals = hospitals
      .filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.code.toLowerCase().includes(q) ||
          h.location.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedMedicines = medicines
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.batch.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedAmbulances = ambulances
      .filter(
        (a) =>
          a.code.toLowerCase().includes(q) ||
          a.driver.toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedReferrals = referrals
      .filter(
        (r) =>
          r.patientName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
      )
      .slice(0, 3);

    return {
      patients: matchedPatients,
      hospitals: matchedHospitals,
      medicines: matchedMedicines,
      ambulances: matchedAmbulances,
      referrals: matchedReferrals,
      hasResults:
        matchedPatients.length > 0 ||
        matchedHospitals.length > 0 ||
        matchedMedicines.length > 0 ||
        matchedAmbulances.length > 0 ||
        matchedReferrals.length > 0,
    };
  }, [query, patients, hospitals, medicines, ambulances, referrals]);

  if (!isOpen) return null;

  const handleSelect = (path) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:p-6 sm:pt-20">
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
          {/* Input field */}
          <div className="relative flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients, tokens, hospitals, medicines, ambulances... (Esc to close)"
              className="w-full bg-transparent pl-3 pr-8 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results container */}
          <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800/60">
            {!searchResults ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Type at least 2 characters to search across Arogya Queue Network.
              </div>
            ) : !searchResults.hasResults ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No healthcare records found matching "{query}".
              </div>
            ) : (
              <>
                {/* Patients */}
                {searchResults.patients.length > 0 && (
                  <div className="py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                      Patients & Tokens
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.patients.map((pat) => (
                        <div
                          key={pat.id}
                          onClick={() => handleSelect('/patient-flow')}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {pat.name} ({pat.token})
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {pat.department} • Status: {pat.status}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hospitals */}
                {searchResults.hospitals.length > 0 && (
                  <div className="py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                      Hospital Nodes
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.hospitals.map((hosp) => (
                        <div
                          key={hosp.id}
                          onClick={() => handleSelect('/overview')}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {hosp.name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {hosp.location} • Beds: {hosp.totalBeds}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medicines */}
                {searchResults.medicines.length > 0 && (
                  <div className="py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                      Pharmacy Supplies
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.medicines.map((med) => (
                        <div
                          key={med.id}
                          onClick={() => handleSelect('/pharmacy')}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                              <Pill className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {med.name} ({med.dosageForm})
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Qty: {med.quantity} • Batch: {med.batch}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ambulances */}
                {searchResults.ambulances.length > 0 && (
                  <div className="py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                      Ambulance Fleet
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.ambulances.map((amb) => (
                        <div
                          key={amb.id}
                          onClick={() => handleSelect('/ambulance')}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                              <Ambulance className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {amb.code} — {amb.driver}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Status: {amb.status} • ETA: {amb.eta}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
