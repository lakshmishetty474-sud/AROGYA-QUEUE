-- ==============================================================================
-- AROGYA QUEUE: HOSPITAL OS + CITY HEALTH CARE
-- COMPLETE SUPABASE POSTGRESQL DATABASE SCHEMA
-- Matches React / Vite Application Code Exactly (Preserves CamelCase Keys)
-- ==============================================================================

-- 1. Enable UUID Extension (Optional utility)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLE 1: hospitals
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    location TEXT NOT NULL,
    contact TEXT,
    "totalBeds" INTEGER DEFAULT 150,
    "icuBeds" INTEGER DEFAULT 25,
    "emergencyCapacity" INTEGER DEFAULT 20,
    departments JSONB DEFAULT '["General Medicine", "Emergency & Trauma"]'::jsonb,
    status TEXT DEFAULT 'Normal',
    coordinates JSONB DEFAULT '{"lat": 12.9716, "lng": 77.5946}'::jsonb,
    established INTEGER DEFAULT 2026,
    rating NUMERIC DEFAULT 4.8,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE 2: patients
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT DEFAULT 'Male',
    mobile TEXT NOT NULL,
    aadhar TEXT,
    abha TEXT,
    address TEXT,
    city TEXT DEFAULT 'Bengaluru',
    "hospitalId" TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
    department TEXT DEFAULT 'General Medicine',
    doctor TEXT,
    priority TEXT DEFAULT 'Normal',
    status TEXT DEFAULT 'Waiting',
    "queuePosition" INTEGER DEFAULT 1,
    symptoms TEXT,
    vitals JSONB DEFAULT '{}'::jsonb,
    diagnosis TEXT,
    journey JSONB DEFAULT '[]'::jsonb,
    "labRequests" JSONB DEFAULT '[]'::jsonb,
    "prescriptions" JSONB DEFAULT '[]'::jsonb,
    "registeredAt" TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE 3: beds
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.beds (
    id TEXT PRIMARY KEY,
    "hospitalId" TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    "bedNumber" TEXT NOT NULL,
    ward TEXT NOT NULL,
    floor INTEGER DEFAULT 1,
    "bedType" TEXT DEFAULT 'Standard',
    status TEXT DEFAULT 'Available',
    "patientId" TEXT,
    "patientName" TEXT,
    "patientCondition" TEXT,
    "assignedAt" TEXT,
    -- snake_case aliases for direct RPC/update compatibility
    patient_id TEXT,
    patient_name TEXT,
    patient_condition TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE 4: medicines
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medicines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "dosageForm" TEXT,
    category TEXT,
    batch TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    "minStock" INTEGER DEFAULT 100,
    expiry TEXT,
    "hospitalId" TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    "unitPrice" NUMERIC DEFAULT 10.0,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE 5: admissions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admissions (
    id TEXT PRIMARY KEY,
    "patientId" TEXT REFERENCES public.patients(id) ON DELETE SET NULL,
    "patientName" TEXT NOT NULL,
    "hospitalId" TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    "admissionDate" TEXT,
    department TEXT,
    doctor TEXT,
    diagnosis TEXT,
    ward TEXT,
    "bedNumber" TEXT,
    "attendantName" TEXT,
    "attendantContact" TEXT,
    "emergencyStatus" TEXT DEFAULT 'Normal',
    notes TEXT,
    status TEXT DEFAULT 'Admitted',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE 6: discharges
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.discharges (
    id TEXT PRIMARY KEY,
    "admissionId" TEXT,
    "patientId" TEXT,
    "patientName" TEXT NOT NULL,
    "hospitalId" TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    doctor TEXT,
    department TEXT,
    diagnosis TEXT,
    "treatmentSummary" TEXT,
    medicines TEXT,
    "labResults" TEXT,
    "dischargeCondition" TEXT,
    "followUpDate" TEXT,
    "followUpInstructions" TEXT,
    "finalBill" NUMERIC DEFAULT 0,
    "paymentStatus" TEXT DEFAULT 'Paid',
    "dischargeDate" TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE 7: payments
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    "billNumber" TEXT NOT NULL UNIQUE,
    "patientId" TEXT,
    "patientName" TEXT NOT NULL,
    "hospitalId" TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    "consultationFee" NUMERIC DEFAULT 500,
    "labFee" NUMERIC DEFAULT 0,
    "medicineFee" NUMERIC DEFAULT 0,
    "bedCharges" NUMERIC DEFAULT 0,
    "otherCharges" NUMERIC DEFAULT 50,
    "totalAmount" NUMERIC NOT NULL,
    "paymentStatus" TEXT DEFAULT 'Paid',
    method TEXT DEFAULT 'UPI',
    "transactionId" TEXT,
    "createdAt" TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE 8: referrals
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.referrals (
    id TEXT PRIMARY KEY,
    "patientId" TEXT,
    "patientName" TEXT NOT NULL,
    "fromHospital" TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    "fromHospitalName" TEXT,
    "toHospital" TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    "toHospitalName" TEXT,
    reason TEXT,
    department TEXT,
    doctor TEXT,
    urgency TEXT DEFAULT 'Urgent',
    status TEXT DEFAULT 'Requested',
    timeline JSONB DEFAULT '[]'::jsonb,
    "requestedAt" TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE 9: users_directory
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users_directory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "assignedRole" TEXT NOT NULL,
    "hospitalNode" TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    "createdDate" TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- TABLE 10: ambulances (Supplementary Fleet Telemetry)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ambulances (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    driver TEXT NOT NULL,
    contact TEXT,
    "hospitalId" TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Available',
    priority TEXT DEFAULT 'Normal',
    "currentLocation" TEXT,
    coordinates JSONB DEFAULT '{"lat": 12.9716, "lng": 77.5946}'::jsonb,
    destination TEXT,
    "assignedPatient" TEXT,
    eta TEXT,
    "speedKmH" NUMERIC DEFAULT 0,
    "fuelLevel" TEXT DEFAULT '90%',
    equipment JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_patients_hospital ON public.patients("hospitalId");
CREATE INDEX IF NOT EXISTS idx_patients_status ON public.patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_priority ON public.patients(priority);
CREATE INDEX IF NOT EXISTS idx_beds_hospital ON public.beds("hospitalId");
CREATE INDEX IF NOT EXISTS idx_beds_status ON public.beds(status);
CREATE INDEX IF NOT EXISTS idx_medicines_hospital ON public.medicines("hospitalId");
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users_directory(email);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;

-- Allow anonymous / authenticated read and write operations for the web portal
DROP POLICY IF EXISTS "Public access for hospitals" ON public.hospitals;
CREATE POLICY "Public access for hospitals" ON public.hospitals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for patients" ON public.patients;
CREATE POLICY "Public access for patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for beds" ON public.beds;
CREATE POLICY "Public access for beds" ON public.beds FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for medicines" ON public.medicines;
CREATE POLICY "Public access for medicines" ON public.medicines FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for admissions" ON public.admissions;
CREATE POLICY "Public access for admissions" ON public.admissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for discharges" ON public.discharges;
CREATE POLICY "Public access for discharges" ON public.discharges FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for payments" ON public.payments;
CREATE POLICY "Public access for payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for referrals" ON public.referrals;
CREATE POLICY "Public access for referrals" ON public.referrals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for users_directory" ON public.users_directory;
CREATE POLICY "Public access for users_directory" ON public.users_directory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for ambulances" ON public.ambulances;
CREATE POLICY "Public access for ambulances" ON public.ambulances FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- SEED INITIAL HOSPITALS (Ensures Foreign Keys work immediately)
-- ==============================================================================
INSERT INTO public.hospitals (id, name, code, location, contact, "totalBeds", "icuBeds", "emergencyCapacity", departments, status)
VALUES
    ('HOSP-01', 'Bengaluru Central Hospital', 'BCH-MAIN', 'Victoria Road, Central Bengaluru', '+91 80 2297 8000', 250, 40, 30, '["General Medicine", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Emergency & Trauma"]'::jsonb, 'Busy'),
    ('HOSP-02', 'Arogya Medical Centre', 'AMC-NORTH', 'Hebbal Ring Road, North Bengaluru', '+91 80 4321 9000', 180, 28, 20, '["General Medicine", "Pulmonology", "Oncology", "Gastroenterology", "General Surgery"]'::jsonb, 'Normal'),
    ('HOSP-03', 'City Care Hospital', 'CCH-EAST', 'Whitefield Main Road, East Bengaluru', '+91 80 6789 1111', 210, 35, 25, '["General Medicine", "Cardiology", "Nephrology", "Dermatology", "Emergency & Trauma"]'::jsonb, 'Normal'),
    ('HOSP-04', 'Green Valley Hospital', 'GVH-SOUTH', 'Jayanagar 4th Block, South Bengaluru', '+91 80 2654 3322', 160, 22, 18, '["General Medicine", "Pediatrics", "Gynecology", "ENT", "Ophthalmology"]'::jsonb, 'Normal'),
    ('HOSP-05', 'Metro Health Hospital', 'MHH-WEST', 'Rajajinagar Industrial Area, West Bengaluru', '+91 80 2315 4400', 190, 30, 22, '["General Medicine", "Trauma Care", "Cardiology", "Neurology", "Urology"]'::jsonb, 'Busy')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- BLOOD BANK MODULE
-- Mirrors supabase/migrations/20250513_add_blood_bank.sql
-- id is TEXT (not uuid) because the app upserts human-readable keys
-- ('DNR-1001', 'STK-01-AP', 'REQ-B-501', 'CAMP-301') with onConflict: 'id'.
-- Each table also carries a snake_case created_at because
-- fetchBloodDonors() / fetchBloodRequests() sort on it.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.blood_donors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER DEFAULT 25,
    gender TEXT DEFAULT 'Male',
    "bloodGroup" TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    city TEXT DEFAULT 'Bengaluru',
    address TEXT,
    weight INTEGER DEFAULT 60,
    hemoglobin NUMERIC DEFAULT 13.5,
    "bloodPressure" TEXT DEFAULT '120/80',
    "lastDonationDate" TIMESTAMPTZ,
    "totalDonations" INTEGER DEFAULT 0,
    "eligibilityStatus" TEXT DEFAULT 'Eligible',
    "registeredHospitalId" TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
    "isEmergencyVolunteer" BOOLEAN DEFAULT false,
    "medicalNotes" TEXT,
    "createdAt" TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.blood_inventory (
    id TEXT PRIMARY KEY,
    "hospitalId" TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
    "bloodGroup" TEXT NOT NULL,
    "wholeBlood" INTEGER DEFAULT 0,
    prbc INTEGER DEFAULT 0,
    platelets INTEGER DEFAULT 0,
    ffp INTEGER DEFAULT 0,
    "totalUnits" INTEGER DEFAULT 0,
    "minThreshold" INTEGER DEFAULT 10,
    status TEXT DEFAULT 'Adequate',
    "lastRestocked" TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.blood_requests (
    id TEXT PRIMARY KEY,
    "patientId" TEXT,
    "patientName" TEXT NOT NULL,
    "hospitalId" TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
    "bloodGroup" TEXT NOT NULL,
    component TEXT DEFAULT 'Whole Blood',
    "unitsNeeded" INTEGER DEFAULT 1,
    "unitsDispatched" INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'Routine Elective',
    department TEXT DEFAULT 'General Medicine',
    "doctorName" TEXT DEFAULT 'Attending Physician',
    "clinicalIndication" TEXT,
    "crossMatchStatus" TEXT DEFAULT 'Pending',
    status TEXT DEFAULT 'Pending',
    "requestedAt" TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.blood_camps (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    organizer TEXT,
    venue TEXT,
    "date" DATE,
    "time" TEXT,
    "targetUnits" INTEGER DEFAULT 100,
    "registeredDonors" INTEGER DEFAULT 0,
    "hospitalId" TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Upcoming',
    "contactPerson" TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_blood_donors_group ON public.blood_donors ("bloodGroup");
CREATE INDEX IF NOT EXISTS idx_blood_donors_hospital ON public.blood_donors ("registeredHospitalId");
CREATE INDEX IF NOT EXISTS idx_blood_donors_created ON public.blood_donors (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_hospital ON public.blood_inventory ("hospitalId");
CREATE INDEX IF NOT EXISTS idx_blood_requests_hospital ON public.blood_requests ("hospitalId");
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON public.blood_requests (status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_created ON public.blood_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_camps_hospital ON public.blood_camps ("hospitalId");
CREATE INDEX IF NOT EXISTS idx_blood_camps_date ON public.blood_camps ("date");

ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_camps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_allow_all" ON public.blood_donors;
CREATE POLICY "dev_allow_all" ON public.blood_donors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_allow_all" ON public.blood_inventory;
CREATE POLICY "dev_allow_all" ON public.blood_inventory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_allow_all" ON public.blood_requests;
CREATE POLICY "dev_allow_all" ON public.blood_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_allow_all" ON public.blood_camps;
CREATE POLICY "dev_allow_all" ON public.blood_camps FOR ALL USING (true) WITH CHECK (true);
