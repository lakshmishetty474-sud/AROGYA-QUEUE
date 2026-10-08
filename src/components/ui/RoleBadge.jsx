import React from 'react';
import { ROLES, ROLE_DETAILS } from '../../utils/roleDetector';
import {
  ShieldAlert,
  Building2,
  Stethoscope,
  HeartPulse,
  Pill,
  UserCheck,
  FlaskConical,
  Ambulance,
  User,
} from 'lucide-react';

const iconMap = {
  [ROLES.ADMIN]: ShieldAlert,
  [ROLES.HOSPITAL_ADMIN]: Building2,
  [ROLES.DOCTOR]: Stethoscope,
  [ROLES.NURSE]: HeartPulse,
  [ROLES.PHARMACIST]: Pill,
  [ROLES.RECEPTIONIST]: UserCheck,
  [ROLES.LAB_TECH]: FlaskConical,
  [ROLES.AMBULANCE]: Ambulance,
  [ROLES.PATIENT]: User,
};

export function RoleBadge({ role = ROLES.PATIENT, size = 'md', className = '' }) {
  const details = ROLE_DETAILS[role] || ROLE_DETAILS[ROLES.PATIENT];
  const Icon = iconMap[role] || User;

  const colorStyles = {
    [ROLES.ADMIN]: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    [ROLES.HOSPITAL_ADMIN]: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    [ROLES.DOCTOR]: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    [ROLES.NURSE]: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    [ROLES.PHARMACIST]: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    [ROLES.RECEPTIONIST]: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    [ROLES.LAB_TECH]: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    [ROLES.AMBULANCE]: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    [ROLES.PATIENT]: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-2xs tracking-wide uppercase ${
        colorStyles[role] || colorStyles[ROLES.PATIENT]
      } ${sizeClasses[size]} ${className}`}
    >
      <Icon className={iconSizes[size]} />
      {details.badgeLabel}
    </span>
  );
}
