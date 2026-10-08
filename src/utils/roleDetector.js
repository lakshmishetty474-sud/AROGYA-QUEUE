/**
 * Role detection based on email pattern according to specifications
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  DOCTOR: 'DOCTOR',
  SURGEON: 'SURGEON',
  HEAD_NURSE: 'HEAD_NURSE',
  NURSE: 'NURSE',
  PHARMACIST: 'PHARMACIST',
  LAB_TECH: 'LAB_TECH',
  RADIOLOGIST: 'RADIOLOGIST',
  RECEPTIONIST: 'RECEPTIONIST',
  CLEANING_STAFF: 'CLEANING_STAFF',
  SUPPORTING_STAFF: 'SUPPORTING_STAFF',
  SECURITY: 'SECURITY',
  AMBULANCE: 'AMBULANCE',
  PATIENT: 'PATIENT',
};

export const ROLE_DETAILS = {
  [ROLES.SUPER_ADMIN]: {
    title: 'SUPER ADMIN PORTAL',
    badgeLabel: 'SUPER ADMIN',
    description: 'Supreme Network Authority, Payroll Access, Facility Governance & Core Security',
    accentColor: 'indigo',
    icon: 'ShieldAlert',
    accessLevel: 'Level 0 — Complete System Authority & Confidential Payroll Clearance',
    defaultRoute: '/admin',
    modules: ['overview', 'patient-flow', 'hospital-os', 'blood-bank', 'pharmacy', 'city-grid', 'ai', 'administration'],
  },
  [ROLES.ADMIN]: {
    title: 'ADMIN PORTAL',
    badgeLabel: 'SYSTEM ADMIN',
    description: 'City-wide Command Center, Hospital Node management, and System Governance',
    accentColor: 'indigo',
    icon: 'ShieldAlert',
    accessLevel: 'Level 1 — Full Network & System Governance Access',
    defaultRoute: '/admin',
    modules: ['overview', 'patient-flow', 'hospital-os', 'blood-bank', 'pharmacy', 'city-grid', 'ai', 'administration'],
  },
  [ROLES.HOSPITAL_ADMIN]: {
    title: 'HOSPITAL ADMIN PORTAL',
    badgeLabel: 'HOSPITAL ADMIN',
    description: 'Hospital Operational Command, Bed Matrix, Staff Workflows & Facility Metrics',
    accentColor: 'blue',
    icon: 'Building2',
    accessLevel: 'Level 2 — Facility Operations & Departmental Administration',
    defaultRoute: '/hospital',
    modules: ['overview', 'patient-flow', 'hospital-os', 'blood-bank', 'pharmacy', 'city-grid', 'ai', 'administration'],
  },
  [ROLES.DOCTOR]: {
    title: 'DOCTOR PORTAL',
    badgeLabel: 'DOCTOR',
    description: 'OPD Clinical Desk, Patient Queue, Diagnostics Ordering & Digital Prescriptions',
    accentColor: 'teal',
    icon: 'Stethoscope',
    accessLevel: 'Level 3 — Clinical Consultations, Lab Orders & Prescription Authority',
    defaultRoute: '/doctor',
    modules: ['doctor-desk', 'patient-flow', 'blood-bank', 'city-grid', 'ai', 'administration'],
  },
  [ROLES.SURGEON]: {
    title: 'SURGEON PORTAL',
    badgeLabel: 'SURGEON',
    description: 'Surgical Operations, OT Scheduling, Inpatient Admissions & Clinical Procedures',
    accentColor: 'rose',
    icon: 'Activity',
    accessLevel: 'Level 3 — Surgical Theatre & Specialized Clinical Care',
    defaultRoute: '/doctor',
    modules: ['doctor-desk', 'patient-flow', 'hospital-os', 'blood-bank', 'city-grid', 'ai', 'administration'],
  },
  [ROLES.HEAD_NURSE]: {
    title: 'HEAD NURSE PORTAL',
    badgeLabel: 'HEAD NURSE',
    description: 'Ward Supervision, Nursing Staff Schedules, Bed Matrix & Triage Management',
    accentColor: 'emerald',
    icon: 'HeartPulse',
    accessLevel: 'Level 3 — Ward Administration & Senior Nursing Oversight',
    defaultRoute: '/nurse',
    modules: ['overview', 'patient-flow', 'hospital-os', 'pharmacy', 'city-grid', 'ai', 'administration'],
  },
  [ROLES.NURSE]: {
    title: 'NURSE PORTAL',
    badgeLabel: 'NURSE',
    description: 'Patient Triage, Vitals Recording, Ward Monitoring & Bed Management',
    accentColor: 'emerald',
    icon: 'HeartPulse',
    accessLevel: 'Level 3 — Triage, Inpatient Vitals & Ward Status',
    defaultRoute: '/nurse',
    modules: ['overview', 'patient-flow', 'hospital-os', 'pharmacy', 'city-grid', 'ai', 'administration'],
  },
  [ROLES.PHARMACIST]: {
    title: 'PHARMACIST PORTAL',
    badgeLabel: 'PHARMACIST',
    description: 'Pharmacy Inventory, Active Prescriptions Dispensing & Inter-Hospital Stock Transfers',
    accentColor: 'amber',
    icon: 'Pill',
    accessLevel: 'Level 4 — Pharmaceutical Dispensing & Inventory Redistribution',
    defaultRoute: '/pharmacy',
    modules: ['pharmacy', 'administration'],
  },
  [ROLES.RECEPTIONIST]: {
    title: 'RECEPTIONIST PORTAL',
    badgeLabel: 'RECEPTIONIST',
    description: 'OPD Patient Intake, Token Generation, Smart Queue & Bed Admission Desk',
    accentColor: 'cyan',
    icon: 'UserCheck',
    accessLevel: 'Level 4 — Patient Intake, Token Generation & Appointment Scheduling',
    defaultRoute: '/receptionist',
    modules: ['patient-flow', 'hospital-os', 'blood-bank', 'administration'],
  },
  [ROLES.LAB_TECH]: {
    title: 'LAB TECHNICIAN PORTAL',
    badgeLabel: 'LAB TECHNICIAN',
    description: 'Diagnostic Test Requests, Pathology Workflows & Sample Reports',
    accentColor: 'violet',
    icon: 'FlaskConical',
    accessLevel: 'Level 4 — Diagnostic Investigations, Test Results & Lab Reports',
    defaultRoute: '/labtech',
    modules: ['patient-flow', 'ai', 'administration'],
  },
  [ROLES.RADIOLOGIST]: {
    title: 'RADIOLOGIST PORTAL',
    badgeLabel: 'RADIOLOGIST',
    description: 'Medical Imaging Diagnostics (X-Ray, CT, MRI, Ultrasound) & Digital Radiology Reports',
    accentColor: 'purple',
    icon: 'Sparkles',
    accessLevel: 'Level 4 — Diagnostic Imaging Investigations & Digital PACS',
    defaultRoute: '/labtech',
    modules: ['patient-flow', 'ai', 'administration'],
  },
  [ROLES.CLEANING_STAFF]: {
    title: 'FACILITY & SANITATION PORTAL',
    badgeLabel: 'SANITATION',
    description: 'Bed Sanitization, Ward Cleanliness Logs & Infection Control Protocol',
    accentColor: 'teal',
    icon: 'Sparkles',
    accessLevel: 'Level 5 — Ward Cleanliness, Bed Sanitization & Maintenance Logs',
    defaultRoute: '/hospital',
    modules: ['hospital-os', 'overview'],
  },
  [ROLES.SUPPORTING_STAFF]: {
    title: 'SUPPORTING STAFF PORTAL',
    badgeLabel: 'SUPPORT STAFF',
    description: 'Patient Escort, Ward Logistics & Facility Assistance',
    accentColor: 'slate',
    icon: 'Users',
    accessLevel: 'Level 5 — General Facility Logistics & Patient Assistance',
    defaultRoute: '/overview',
    modules: ['overview', 'hospital-os'],
  },
  [ROLES.SECURITY]: {
    title: 'SECURITY & ACCESS PORTAL',
    badgeLabel: 'SECURITY',
    description: 'Hospital Entry Checkpoints, Emergency Lockdown & Campus Safety Logs',
    accentColor: 'zinc',
    icon: 'ShieldAlert',
    accessLevel: 'Level 5 — Campus Physical Security & Perimeter Control',
    defaultRoute: '/overview',
    modules: ['overview', 'city-grid'],
  },
  [ROLES.AMBULANCE]: {
    title: 'AMBULANCE PORTAL',
    badgeLabel: 'AMBULANCE',
    description: 'Emergency Fleet Logistics, Live Tracking, Patient En Route & Hospital Handoff',
    accentColor: 'rose',
    icon: 'Ambulance',
    accessLevel: 'Level 4 — Emergency Dispatch, Live Location & Driver Directory',
    defaultRoute: '/ambulance',
    modules: ['ambulance', 'tracking', 'employees', 'administration'],
  },
  [ROLES.PATIENT]: {
    title: 'PATIENT PORTAL',
    badgeLabel: 'PATIENT',
    description: 'Live OPD Queue Token, Journey Status, Doctor Prescription & AI Health Guide',
    accentColor: 'sky',
    icon: 'User',
    accessLevel: 'Level 5 — Personal Healthcare Records, Live Token & Care Guidance',
    defaultRoute: '/patient',
    modules: ['patient-flow', 'ai', 'administration'],
  },
};

export function detectUserRole(email = '') {
  if (!email || typeof email !== 'string') {
    return ROLES.PATIENT;
  }

  const normalized = email.trim().toLowerCase();

  if (normalized.includes('admin.admin') || normalized.startsWith('admin@')) {
    return ROLES.ADMIN;
  }
  if (normalized.includes('hospital.admin') || normalized.includes('hospadmin')) {
    return ROLES.HOSPITAL_ADMIN;
  }
  if (normalized.includes('doctor') || normalized.includes('dr.')) {
    return ROLES.DOCTOR;
  }
  if (normalized.includes('nurse')) {
    return ROLES.NURSE;
  }
  if (normalized.includes('pharmacist') || normalized.includes('pharmacy')) {
    return ROLES.PHARMACIST;
  }
  if (normalized.includes('receptionist') || normalized.includes('reception')) {
    return ROLES.RECEPTIONIST;
  }
  if (normalized.includes('labtech') || normalized.includes('lab')) {
    return ROLES.LAB_TECH;
  }
  if (normalized.includes('ambulance') || normalized.includes('driver')) {
    return ROLES.AMBULANCE;
  }

  return ROLES.PATIENT;
}
