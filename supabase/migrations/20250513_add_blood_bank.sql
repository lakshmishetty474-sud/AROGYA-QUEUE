-- ==============================================================================
-- AROGYA QUEUE: BLOOD BANK MODULE
-- Adds the four blood_* tables required by src/services/supabaseService.js
--
-- Column names/shape were derived from the actual application code, NOT from a
-- generic template. Two deliberate deviations are called out below.
--
-- 1) id is TEXT, not UUID.
--    Seed data and runtime inserts use human-readable keys such as
--    'DNR-1001', 'STK-01-AP', 'REQ-B-501', 'CAMP-301'. The app also calls
--    .upsert(payload, { onConflict: 'id' }), so id must be a TEXT primary key
--    to match public.hospitals (which is also TEXT). A uuid column would make
--    every insert fail with "invalid input syntax for type uuid".
--
-- 2) Hospital references are TEXT codes ('HOSP-01'), not uuid.
--
-- 3) Each table carries BOTH camelCase application columns and a snake_case
--    created_at. fetchBloodDonors() and fetchBloodRequests() call
--    .order('created_at', { ascending: false }) while the upsert payloads write
--    "createdAt". Without a real created_at column those two reads fail with
--    "column blood_donors.created_at does not exist", so created_at is kept as
--    the server-side sort column and defaults to now().
--
-- NOTE: the module reads a `blood_camps` table (fetchBloodCamps orders by
-- "date"). There is no `blood_banks` table in the codebase.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TABLE: blood_donors
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- TABLE: blood_inventory
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- TABLE: blood_requests
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- TABLE: blood_camps
-- ------------------------------------------------------------------------------
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

-- ==============================================================================
-- INDEXES (support the filters used on the Blood Bank dashboard)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_blood_donors_group ON public.blood_donors ("bloodGroup");
CREATE INDEX IF NOT EXISTS idx_blood_donors_hospital ON public.blood_donors ("registeredHospitalId");
CREATE INDEX IF NOT EXISTS idx_blood_donors_created ON public.blood_donors (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blood_inventory_hospital ON public.blood_inventory ("hospitalId");

CREATE INDEX IF NOT EXISTS idx_blood_requests_hospital ON public.blood_requests ("hospitalId");
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON public.blood_requests (status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_created ON public.blood_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blood_camps_hospital ON public.blood_camps ("hospitalId");
CREATE INDEX IF NOT EXISTS idx_blood_camps_date ON public.blood_camps ("date");

-- ==============================================================================
-- ROW LEVEL SECURITY
-- Dev-only permissive policy, matching the rest of supabase_schema.sql.
-- Replace with authenticated, role-scoped policies before production.
-- ==============================================================================
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
