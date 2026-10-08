export const INITIAL_BEDS = [
  // ==========================================
  // 1. Bengaluru Central Hospital (HOSP-01)
  // Target: ICU: 4 available, General: 12 available, Emergency: 3 available, Private: 5 available
  // ==========================================
  // ICU WARD (4 Available, 2 Occupied/Reserved)
  { id: 'BED-01-101', hospitalId: 'HOSP-01', bedNumber: 'ICU-01', ward: 'ICU', floor: 2, bedType: 'Ventilator Equipped', status: 'Occupied', patientId: 'PAT-001', patientName: 'Ramesh Sundaram', patientCondition: 'Critical', assignedAt: '2026-09-04T09:50:00Z' },
  { id: 'BED-01-102', hospitalId: 'HOSP-01', bedNumber: 'ICU-02', ward: 'ICU', floor: 2, bedType: 'Ventilator Equipped', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-103', hospitalId: 'HOSP-01', bedNumber: 'ICU-03', ward: 'ICU', floor: 2, bedType: 'Motorized Critical', status: 'Occupied', patientId: 'PAT-DEMO-01', patientName: 'Anil Gupta', patientCondition: 'Critical', assignedAt: '2026-09-03T18:00:00Z' },
  { id: 'BED-01-104', hospitalId: 'HOSP-01', bedNumber: 'ICU-04', ward: 'ICU', floor: 2, bedType: 'Motorized Critical', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-105', hospitalId: 'HOSP-01', bedNumber: 'ICU-05', ward: 'ICU', floor: 2, bedType: 'Cardiac Monitor Suite', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-106', hospitalId: 'HOSP-01', bedNumber: 'ICU-06', ward: 'ICU', floor: 2, bedType: 'Ventilator Equipped', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },

  // EMERGENCY WARD (3 Available, 1 Occupied)
  { id: 'BED-01-301', hospitalId: 'HOSP-01', bedNumber: 'EMG-01', ward: 'Emergency', floor: 1, bedType: 'Crash Cart Ready', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-302', hospitalId: 'HOSP-01', bedNumber: 'EMG-02', ward: 'Emergency', floor: 1, bedType: 'Oxygen Supported', status: 'Occupied', patientId: 'PAT-DEMO-03', patientName: 'Suresh Babu', patientCondition: 'Under Observation', assignedAt: '2026-09-04T07:15:00Z' },
  { id: 'BED-01-303', hospitalId: 'HOSP-01', bedNumber: 'EMG-03', ward: 'Emergency', floor: 1, bedType: 'Crash Cart Ready', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-304', hospitalId: 'HOSP-01', bedNumber: 'EMG-04', ward: 'Emergency', floor: 1, bedType: 'Trauma Bay High Flow', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },

  // GENERAL WARD (12 Available, 2 Occupied/Cleaning)
  { id: 'BED-01-201', hospitalId: 'HOSP-01', bedNumber: 'GEN-101', ward: 'General', floor: 1, bedType: 'Oxygen Supported', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-202', hospitalId: 'HOSP-01', bedNumber: 'GEN-102', ward: 'General', floor: 1, bedType: 'Standard', status: 'Occupied', patientId: 'PAT-DEMO-02', patientName: 'Vasanth Kumar', patientCondition: 'Stable', assignedAt: '2026-09-03T14:30:00Z' },
  { id: 'BED-01-203', hospitalId: 'HOSP-01', bedNumber: 'GEN-103', ward: 'General', floor: 1, bedType: 'Standard', status: 'Cleaning', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-204', hospitalId: 'HOSP-01', bedNumber: 'GEN-104', ward: 'General', floor: 1, bedType: 'Standard', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-205', hospitalId: 'HOSP-01', bedNumber: 'GEN-105', ward: 'General', floor: 1, bedType: 'Standard', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-206', hospitalId: 'HOSP-01', bedNumber: 'GEN-106', ward: 'General', floor: 1, bedType: 'Standard', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-207', hospitalId: 'HOSP-01', bedNumber: 'GEN-107', ward: 'General', floor: 1, bedType: 'Standard', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-208', hospitalId: 'HOSP-01', bedNumber: 'GEN-108', ward: 'General', floor: 1, bedType: 'Standard', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-209', hospitalId: 'HOSP-01', bedNumber: 'GEN-109', ward: 'General', floor: 1, bedType: 'Standard', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-210', hospitalId: 'HOSP-01', bedNumber: 'GEN-110', ward: 'General', floor: 1, bedType: 'Standard', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-211', hospitalId: 'HOSP-01', bedNumber: 'GEN-111', ward: 'General', floor: 1, bedType: 'Standard', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-212', hospitalId: 'HOSP-01', bedNumber: 'GEN-112', ward: 'General', floor: 1, bedType: 'Standard', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-213', hospitalId: 'HOSP-01', bedNumber: 'GEN-113', ward: 'General', floor: 1, bedType: 'Oxygen Supported', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-214', hospitalId: 'HOSP-01', bedNumber: 'GEN-114', ward: 'General', floor: 1, bedType: 'Standard', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },

  // PRIVATE WARD (5 Available)
  { id: 'BED-01-501', hospitalId: 'HOSP-01', bedNumber: 'PRV-301', ward: 'Private', floor: 3, bedType: 'Deluxe Suite', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-502', hospitalId: 'HOSP-01', bedNumber: 'PRV-302', ward: 'Private', floor: 3, bedType: 'Deluxe Suite', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-503', hospitalId: 'HOSP-01', bedNumber: 'PRV-303', ward: 'Private', floor: 3, bedType: 'Super Deluxe', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-504', hospitalId: 'HOSP-01', bedNumber: 'PRV-304', ward: 'Private', floor: 3, bedType: 'Single Executive', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-505', hospitalId: 'HOSP-01', bedNumber: 'PRV-305', ward: 'Private', floor: 3, bedType: 'Single Executive', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },

  // PEDIATRIC & ISOLATION
  { id: 'BED-01-401', hospitalId: 'HOSP-01', bedNumber: 'PED-01', ward: 'Pediatric', floor: 3, bedType: 'Pediatric Care Unit', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-402', hospitalId: 'HOSP-01', bedNumber: 'PED-02', ward: 'Pediatric', floor: 3, bedType: 'Pediatric Care Unit', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-01-601', hospitalId: 'HOSP-01', bedNumber: 'ISO-01', ward: 'Isolation', floor: 4, bedType: 'Negative Pressure', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },

  // ==========================================
  // 2. Arogya Medical Centre (HOSP-02)
  // Target: ICU: 3 available, General: 14 available, Emergency: 4 available, Private: 6 available
  // ==========================================
  { id: 'BED-02-101', hospitalId: 'HOSP-02', bedNumber: 'ICU-A1', ward: 'ICU', floor: 2, bedType: 'Ventilator Equipped', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-02-102', hospitalId: 'HOSP-02', bedNumber: 'ICU-A2', ward: 'ICU', floor: 2, bedType: 'Ventilator Equipped', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-02-103', hospitalId: 'HOSP-02', bedNumber: 'ICU-A3', ward: 'ICU', floor: 2, bedType: 'Cardiac Monitor Unit', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-02-104', hospitalId: 'HOSP-02', bedNumber: 'ICU-A4', ward: 'ICU', floor: 2, bedType: 'Ventilator Equipped', status: 'Occupied', patientId: 'PAT-DEMO-05', patientName: 'Shankar Rao', patientCondition: 'Critical', assignedAt: '2026-09-04T05:00:00Z' },

  { id: 'BED-02-301', hospitalId: 'HOSP-02', bedNumber: 'EMG-A1', ward: 'Emergency', floor: 1, bedType: 'Crash Cart Ready', status: 'Occupied', patientId: 'PAT-006', patientName: 'Mohammed Farhan', patientCondition: 'Under Observation', assignedAt: '2026-09-04T10:10:00Z' },
  { id: 'BED-02-302', hospitalId: 'HOSP-02', bedNumber: 'EMG-A2', ward: 'Emergency', floor: 1, bedType: 'Crash Cart Ready', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-02-303', hospitalId: 'HOSP-02', bedNumber: 'EMG-A3', ward: 'Emergency', floor: 1, bedType: 'Oxygen Supported', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-02-304', hospitalId: 'HOSP-02', bedNumber: 'EMG-A4', ward: 'Emergency', floor: 1, bedType: 'Triage Monitor', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-02-305', hospitalId: 'HOSP-02', bedNumber: 'EMG-A5', ward: 'Emergency', floor: 1, bedType: 'Crash Cart Ready', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },

  // General Beds HOSP-02 (14 Available)
  ...Array.from({ length: 14 }, (_, i) => ({
    id: `BED-02-2${String(i + 1).padStart(2, '0')}`,
    hospitalId: 'HOSP-02',
    bedNumber: `GEN-A${i + 1}`,
    ward: 'General',
    floor: 1,
    bedType: i % 2 === 0 ? 'Oxygen Supported' : 'Standard',
    status: 'Available',
    patientId: null,
    patientName: null,
    patientCondition: null,
    assignedAt: null,
  })),

  // Private Beds HOSP-02 (6 Available)
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `BED-02-5${String(i + 1).padStart(2, '0')}`,
    hospitalId: 'HOSP-02',
    bedNumber: `PRV-A${i + 1}`,
    ward: 'Private',
    floor: 3,
    bedType: 'Single Deluxe Suite',
    status: 'Available',
    patientId: null,
    patientName: null,
    patientCondition: null,
    assignedAt: null,
  })),

  // ==========================================
  // 3. City Care Hospital (HOSP-03)
  // Target from prompt: ICU: 2 available, General: 18 available, Emergency: 5 available, Private: 7 available
  // ==========================================
  { id: 'BED-03-101', hospitalId: 'HOSP-03', bedNumber: 'ICU-C1', ward: 'ICU', floor: 2, bedType: 'Ventilator Equipped', status: 'Occupied', patientId: 'PAT-DEMO-04', patientName: 'Devaki Menon', patientCondition: 'Critical', assignedAt: '2026-09-03T22:00:00Z' },
  { id: 'BED-03-102', hospitalId: 'HOSP-03', bedNumber: 'ICU-C2', ward: 'ICU', floor: 2, bedType: 'Ventilator Equipped', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-03-103', hospitalId: 'HOSP-03', bedNumber: 'ICU-C3', ward: 'ICU', floor: 2, bedType: 'Neuro Critical Unit', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },

  // Emergency (5 Available)
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `BED-03-3${String(i + 1).padStart(2, '0')}`,
    hospitalId: 'HOSP-03',
    bedNumber: `EMG-C${i + 1}`,
    ward: 'Emergency',
    floor: 1,
    bedType: 'Crash Cart Ready',
    status: 'Available',
    patientId: null,
    patientName: null,
    patientCondition: null,
    assignedAt: null,
  })),

  // General (18 Available)
  ...Array.from({ length: 18 }, (_, i) => ({
    id: `BED-03-2${String(i + 1).padStart(2, '0')}`,
    hospitalId: 'HOSP-03',
    bedNumber: `GEN-C${i + 1}`,
    ward: 'General',
    floor: 1,
    bedType: i % 3 === 0 ? 'Oxygen Supported' : 'Standard',
    status: 'Available',
    patientId: null,
    patientName: null,
    patientCondition: null,
    assignedAt: null,
  })),

  // Private (7 Available)
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `BED-03-5${String(i + 1).padStart(2, '0')}`,
    hospitalId: 'HOSP-03',
    bedNumber: `PRV-C${i + 1}`,
    ward: 'Private',
    floor: 3,
    bedType: 'Executive Room',
    status: 'Available',
    patientId: null,
    patientName: null,
    patientCondition: null,
    assignedAt: null,
  })),

  // ==========================================
  // 4. Green Valley Hospital (HOSP-04)
  // Target from prompt: ICU: 3 available, General: 10 available, Emergency: 2 available
  // ==========================================
  { id: 'BED-04-101', hospitalId: 'HOSP-04', bedNumber: 'ICU-G1', ward: 'ICU', floor: 2, bedType: 'Ventilator Equipped', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-04-102', hospitalId: 'HOSP-04', bedNumber: 'ICU-G2', ward: 'ICU', floor: 2, bedType: 'Ventilator Equipped', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-04-103', hospitalId: 'HOSP-04', bedNumber: 'ICU-G3', ward: 'ICU', floor: 2, bedType: 'Ventilator Equipped', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-04-104', hospitalId: 'HOSP-04', bedNumber: 'ICU-G4', ward: 'ICU', floor: 2, bedType: 'Motorized Critical', status: 'Occupied', patientId: 'PAT-DEMO-06', patientName: 'Jayant Kulkarni', patientCondition: 'Critical', assignedAt: '2026-09-04T08:30:00Z' },

  { id: 'BED-04-301', hospitalId: 'HOSP-04', bedNumber: 'EMG-G1', ward: 'Emergency', floor: 1, bedType: 'Crash Cart Ready', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-04-302', hospitalId: 'HOSP-04', bedNumber: 'EMG-G2', ward: 'Emergency', floor: 1, bedType: 'Oxygen Supported', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },

  // General (10 Available)
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `BED-04-2${String(i + 1).padStart(2, '0')}`,
    hospitalId: 'HOSP-04',
    bedNumber: `GEN-G${i + 1}`,
    ward: 'General',
    floor: 1,
    bedType: 'Standard',
    status: 'Available',
    patientId: null,
    patientName: null,
    patientCondition: null,
    assignedAt: null,
  })),

  // Private (4 Available)
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `BED-04-5${String(i + 1).padStart(2, '0')}`,
    hospitalId: 'HOSP-04',
    bedNumber: `PRV-G${i + 1}`,
    ward: 'Private',
    floor: 3,
    bedType: 'Garden Deluxe Suite',
    status: 'Available',
    patientId: null,
    patientName: null,
    patientCondition: null,
    assignedAt: null,
  })),

  // Pediatric (2 Available)
  { id: 'BED-04-401', hospitalId: 'HOSP-04', bedNumber: 'PED-G1', ward: 'Pediatric', floor: 2, bedType: 'Pediatric Care Unit', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-04-402', hospitalId: 'HOSP-04', bedNumber: 'PED-G2', ward: 'Pediatric', floor: 2, bedType: 'Pediatric Care Unit', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },

  // ==========================================
  // 5. Metro Health Hospital (HOSP-05)
  // Target: ICU: 4 available, General: 15 available, Emergency: 3 available, Private: 5 available, Isolation: 2 available
  // ==========================================
  // ICU (4 Available)
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `BED-05-1${String(i + 1).padStart(2, '0')}`,
    hospitalId: 'HOSP-05',
    bedNumber: `ICU-M${i + 1}`,
    ward: 'ICU',
    floor: 2,
    bedType: 'Ventilator Equipped',
    status: 'Available',
    patientId: null,
    patientName: null,
    patientCondition: null,
    assignedAt: null,
  })),

  // Emergency (3 Available)
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `BED-05-3${String(i + 1).padStart(2, '0')}`,
    hospitalId: 'HOSP-05',
    bedNumber: `EMG-M${i + 1}`,
    ward: 'Emergency',
    floor: 1,
    bedType: 'Crash Cart Ready',
    status: 'Available',
    patientId: null,
    patientName: null,
    patientCondition: null,
    assignedAt: null,
  })),

  // General (15 Available)
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `BED-05-2${String(i + 1).padStart(2, '0')}`,
    hospitalId: 'HOSP-05',
    bedNumber: `GEN-M${i + 1}`,
    ward: 'General',
    floor: 1,
    bedType: 'Standard Care',
    status: 'Available',
    patientId: null,
    patientName: null,
    patientCondition: null,
    assignedAt: null,
  })),

  // Private (5 Available)
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `BED-05-5${String(i + 1).padStart(2, '0')}`,
    hospitalId: 'HOSP-05',
    bedNumber: `PRV-M${i + 1}`,
    ward: 'Private',
    floor: 3,
    bedType: 'Metro Suite',
    status: 'Available',
    patientId: null,
    patientName: null,
    patientCondition: null,
    assignedAt: null,
  })),

  // Isolation (2 Available)
  { id: 'BED-05-601', hospitalId: 'HOSP-05', bedNumber: 'ISO-M1', ward: 'Isolation', floor: 4, bedType: 'Negative Pressure', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
  { id: 'BED-05-602', hospitalId: 'HOSP-05', bedNumber: 'ISO-M2', ward: 'Isolation', floor: 4, bedType: 'Negative Pressure', status: 'Available', patientId: null, patientName: null, patientCondition: null, assignedAt: null },
];
