import React, { useState } from 'react';
import { User, Mail, Phone, Building2, ShieldCheck, Check } from 'lucide-react';
import { useHealthcare } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { RoleBadge } from '../components/ui/RoleBadge';

export function Profile() {
  const { currentUser, hospitals, showToast } = useHealthcare();

  const [name, setName] = useState(currentUser?.name || 'Healthcare Operator');
  const [mobile, setMobile] = useState(currentUser?.mobile || '9876543210');
  const [address, setAddress] = useState('Indiranagar, Bengaluru');
  const [emergencyContact, setEmergencyContact] = useState('9845012390');

  const hospital = hospitals.find((h) => h.id === currentUser?.hospitalId) || hospitals[0];

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Profile information updated successfully', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          User Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal credentials, contact details, and facility designation.
        </p>
      </div>

      {/* Header Profile Badge Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-teal-500/20">
            {currentUser?.name ? currentUser.name[0] : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {currentUser?.name}
            </h2>
            <p className="text-xs text-slate-500">{currentUser?.email}</p>
            <div className="mt-2">
              <RoleBadge role={currentUser?.role} size="sm" />
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right text-xs text-slate-500">
          <span className="text-[10px] uppercase tracking-wider block font-bold text-slate-400">
            Assigned Facility
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block mt-0.5">
            {hospital?.name}
          </span>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-mono">
            Node: {hospital?.code || 'BCH-MAIN'}
          </span>
        </div>
      </div>

      {/* Editable details form */}
      <Card title="Personal Information" subtitle="Update your contact and operational details">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
            />
            <Input
              label="Official Email"
              disabled
              value={currentUser?.email || ''}
              icon={Mail}
              helperText="Determines access level and portal permissions."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary Mobile Number"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              icon={Phone}
            />
            <Input
              label="Emergency Duty Contact"
              type="tel"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              icon={Phone}
            />
          </div>

          <Input
            label="Residential / Station Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="md" icon={Check}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
