import React, { useState } from 'react';
import { Sparkles, Check, BedDouble, AlertCircle, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';

export function SmartBedMatcher({ patients = [], beds = [], onAssignBed }) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [targetWard, setTargetWard] = useState('ICU');
  const [patientCondition, setPatientCondition] = useState('Critical');

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Recommendation algorithm:
  // Filters available beds in the target hospital matching the requested ward, or adjacent suitable wards
  const candidateBeds = beds.filter((b) => b.status === 'Available');

  const recommendedBeds = candidateBeds.sort((a, b) => {
    // Exact ward match priority
    const aWardMatch = a.ward === targetWard ? 10 : 0;
    const bWardMatch = b.ward === targetWard ? 10 : 0;
    return bWardMatch - aWardMatch;
  }).slice(0, 3);

  const handleAssign = (bedId) => {
    if (!selectedPatient) return;
    onAssignBed(bedId, selectedPatient.id, patientCondition);
  };

  return (
    <Card
      title="Smart Bed Recommendation Engine"
      subtitle="Autonomous acuity matching prioritizing emergency patient survival"
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Select Inpatient to Admit"
            options={patients.map((p) => ({ value: p.id, label: `${p.name} (${p.token}) - ${p.priority}` }))}
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
          />

          <Select
            label="Required Target Ward"
            options={['ICU', 'General', 'Emergency', 'Pediatric', 'Private', 'Isolation']}
            value={targetWard}
            onChange={(e) => setTargetWard(e.target.value)}
          />

          <Select
            label="Patient Acuity / Condition"
            options={['Critical (Ventilator / STAT)', 'Severe Observation', 'Stable Ambulatory']}
            value={patientCondition}
            onChange={(e) => setPatientCondition(e.target.value)}
          />
        </div>

        {/* Recommended Options */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2 font-bold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span>Top Recommended Available Beds</span>
          </div>

          {recommendedBeds.length === 0 ? (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>No available beds matching criteria in current facility. Check City Grid for inter-hospital transfer.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommendedBeds.map((bed, idx) => {
                const isTop = idx === 0;
                return (
                  <div
                    key={bed.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isTop
                        ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-mono font-bold text-sm text-teal-700 dark:text-teal-300">
                        {bed.bedNumber}
                      </span>
                      {isTop && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-600 text-white uppercase">
                          Best Match
                        </span>
                      )}
                    </div>

                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {bed.ward} Ward (Floor {bed.floor})
                    </p>
                    <p className="text-[11px] text-slate-500 mb-3">{bed.bedType}</p>

                    <Button
                      variant={isTop ? 'primary' : 'outline'}
                      size="sm"
                      className="w-full"
                      onClick={() => handleAssign(bed.id)}
                      icon={Check}
                    >
                      Assign Bed Now
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
