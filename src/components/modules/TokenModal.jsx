import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Printer, Copy, Check, CheckCircle2, QrCode } from 'lucide-react';
import { maskAadhar } from '../../utils/formatters';

export function TokenModal({ isOpen, onClose, patient, hospital }) {
  const [copied, setCopied] = useState(false);

  if (!patient) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(patient.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Patient Registration Confirmed" maxWidth="max-w-md">
      <div className="printable-card space-y-4 text-slate-800 dark:text-slate-200">
        {/* Token Card */}
        <div className="rounded-2xl border-2 border-dashed border-teal-500/50 bg-teal-50/50 dark:bg-teal-950/40 p-5 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-widest mb-1">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            Official OPD Queue Token
          </div>

          <div className="text-3xl sm:text-4xl font-black text-teal-700 dark:text-teal-300 font-mono tracking-tight my-2">
            {patient.token}
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-teal-600 text-white text-xs font-bold shadow-xs">
            Queue Position: #{patient.queuePosition || 1}
          </div>

          <div className="mt-4 pt-3 border-t border-teal-200/80 dark:border-teal-900/80 grid grid-cols-2 gap-2 text-left text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Patient Name</span>
              <span className="font-bold">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Age / Gender</span>
              <span className="font-semibold">{patient.age} yrs / {patient.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Department</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">{patient.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Consulting Doctor</span>
              <span className="font-semibold">{patient.doctor}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Hospital Facility</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{hospital?.name || 'Arogya Medical Node'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Room / Counter</span>
              <span className="font-bold font-mono">OPD Room 104</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="no-print flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleCopy} icon={copied ? Check : Copy}>
            {copied ? 'Copied' : 'Copy Token'}
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrint} icon={Printer}>
            Print Token
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done & View Queue
          </Button>
        </div>
      </div>
    </Modal>
  );
}
