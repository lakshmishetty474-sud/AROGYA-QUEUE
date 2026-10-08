import React, { useState } from 'react';
import { BedDouble, Check, AlertCircle, Sparkles, User, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function BedMatrixGrid({ beds = [], onReleaseBed }) {
  const [wardFilter, setWardFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBed, setSelectedBed] = useState(null);

  const filteredBeds = beds.filter((b) => {
    const matchWard = wardFilter === 'All' || b.ward === wardFilter;
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchWard && matchStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:border-emerald-400';
      case 'Occupied':
        return 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:border-rose-400';
      case 'Reserved':
        return 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:border-amber-400';
      case 'Cleaning':
        return 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200 hover:border-sky-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Detail Modal */}
      {selectedBed && (
        <Modal
          isOpen={!!selectedBed}
          onClose={() => setSelectedBed(null)}
          title={`Bed Telemetry — ${selectedBed.bedNumber}`}
          subtitle={`${selectedBed.ward} Ward • Floor ${selectedBed.floor}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Bed Type</span>
                <span className="font-bold">{selectedBed.bedType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Current Status</span>
                <Badge
                  variant={
                    selectedBed.status === 'Available'
                      ? 'success'
                      : selectedBed.status === 'Occupied'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                >
                  {selectedBed.status}
                </Badge>
              </div>
              {selectedBed.patientName && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Occupying Patient</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {selectedBed.patientName}
                  </span>
                </div>
              )}
              {selectedBed.patientCondition && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Acuity Condition</span>
                  <span className="font-semibold text-rose-500">
                    {selectedBed.patientCondition}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {selectedBed.status === 'Occupied' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onReleaseBed(selectedBed.id, 'Cleaning');
                    setSelectedBed(null);
                  }}
                  icon={RefreshCw}
                >
                  Mark for Cleaning
                </Button>
              )}
              {selectedBed.status === 'Cleaning' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    onReleaseBed(selectedBed.id, 'Available');
                    setSelectedBed(null);
                  }}
                  icon={Check}
                >
                  Mark Available
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setSelectedBed(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Ward & Status Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'ICU', 'General', 'Emergency', 'Pediatric', 'Private', 'Isolation'].map((ward) => (
            <button
              key={ward}
              onClick={() => setWardFilter(ward)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                wardFilter === ward
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {ward}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Reserved">Reserved</option>
            <option value="Cleaning">Cleaning</option>
          </select>
        </div>
      </div>

      {/* Bed Grid Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredBeds.map((bed) => {
          return (
            <div
              key={bed.id}
              onClick={() => setSelectedBed(bed)}
              className={`p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-2xs ${getStatusColor(
                bed.status
              )}`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="font-mono font-black text-sm">{bed.bedNumber}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase bg-white/70 dark:bg-slate-900/70 border border-current">
                  {bed.status}
                </span>
              </div>

              <div className="space-y-0.5 text-[11px]">
                <p className="font-bold truncate">{bed.ward} Ward</p>
                <p className="opacity-80 text-[10px] truncate">{bed.bedType}</p>
                {bed.patientName && (
                  <p className="font-semibold text-rose-600 dark:text-rose-400 truncate pt-1 flex items-center gap-1">
                    <User className="w-3 h-3 shrink-0" />
                    {bed.patientName}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
