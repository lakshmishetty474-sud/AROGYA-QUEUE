import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { storage } from '../utils/storage';
import { ROLES } from '../utils/roleDetector';
import { INITIAL_HOSPITALS } from '../data/initialHospitals';
import { INITIAL_PATIENTS } from '../data/initialPatients';
import { INITIAL_BEDS } from '../data/initialBeds';
import { INITIAL_MEDICINES } from '../data/initialMedicines';
import { INITIAL_AMBULANCES, INITIAL_AMBULANCE_EMPLOYEES } from '../data/initialAmbulances';
import { INITIAL_REFERRALS } from '../data/initialReferrals';
import { INITIAL_ADMISSIONS, INITIAL_DISCHARGES } from '../data/initialAdmissions';
import { INITIAL_PAYMENTS } from '../data/initialPayments';
import { INITIAL_NOTIFICATIONS } from '../data/initialNotifications';
import { INITIAL_APPOINTMENTS } from '../data/initialAppointments';
import { INITIAL_FEEDBACKS } from '../data/initialFeedbacks';
import {
  INITIAL_BLOOD_INVENTORY,
  INITIAL_BLOOD_DONORS,
  INITIAL_BLOOD_REQUESTS,
  INITIAL_BLOOD_CAMPS,
} from '../data/initialBloodBank';
import { generateToken, formatTime } from '../utils/formatters';
import { supabaseService } from '../services/supabaseService';
import { submitRequest } from '../services/approvalService';
import { authService } from '../services/authService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Theme State
  const [theme, setTheme] = useState(() => storage.getItem('theme', 'light'));

  useEffect(() => {
    storage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    return storage.getItem('currentUser', null);
  });

  // Hospitals State
  const [hospitals, setHospitals] = useState(() => {
    return storage.getItem('hospitals', INITIAL_HOSPITALS);
  });

  const [activeHospitalId, setActiveHospitalId] = useState(() => {
    return storage.getItem('activeHospitalId', 'HOSP-01');
  });

  // Keep storage in sync for hospitals
  useEffect(() => {
    storage.setItem('hospitals', hospitals);
  }, [hospitals]);

  useEffect(() => {
    storage.setItem('activeHospitalId', activeHospitalId);
  }, [activeHospitalId]);

  // Patients State
  const [patients, setPatients] = useState(() => {
    return storage.getItem('patients', INITIAL_PATIENTS);
  });

  useEffect(() => {
    storage.setItem('patients', patients);
  }, [patients]);

  // Beds State
  const [beds, setBeds] = useState(() => {
    const stored = storage.getItem('beds', null);
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      return INITIAL_BEDS;
    }
    // Safely append beds for any hospitals in INITIAL_BEDS without overwriting existing records
    const existingIds = new Set(stored.map((b) => b.id));
    const missingBeds = INITIAL_BEDS.filter((b) => !existingIds.has(b.id));
    return missingBeds.length > 0 ? [...stored, ...missingBeds] : stored;
  });

  useEffect(() => {
    storage.setItem('beds', beds);
  }, [beds]);

  // Medicines State
  const [medicines, setMedicines] = useState(() => {
    return storage.getItem('medicines', INITIAL_MEDICINES);
  });

  useEffect(() => {
    storage.setItem('medicines', medicines);
  }, [medicines]);

  // Ambulances State
  const [ambulances, setAmbulances] = useState(() => {
    return storage.getItem('ambulances', INITIAL_AMBULANCES);
  });

  useEffect(() => {
    storage.setItem('ambulances', ambulances);
  }, [ambulances]);

  const [ambulanceEmployees, setAmbulanceEmployees] = useState(() => {
    return storage.getItem('ambulanceEmployees', INITIAL_AMBULANCE_EMPLOYEES);
  });

  useEffect(() => {
    storage.setItem('ambulanceEmployees', ambulanceEmployees);
  }, [ambulanceEmployees]);

  // Referrals State
  const [referrals, setReferrals] = useState(() => {
    return storage.getItem('referrals', INITIAL_REFERRALS);
  });

  useEffect(() => {
    storage.setItem('referrals', referrals);
  }, [referrals]);

  // Admissions & Discharges
  const [admissions, setAdmissions] = useState(() => {
    return storage.getItem('admissions', INITIAL_ADMISSIONS);
  });

  useEffect(() => {
    storage.setItem('admissions', admissions);
  }, [admissions]);

  const [discharges, setDischarges] = useState(() => {
    return storage.getItem('discharges', INITIAL_DISCHARGES);
  });

  useEffect(() => {
    storage.setItem('discharges', discharges);
  }, [discharges]);

  // Payments
  const [payments, setPayments] = useState(() => {
    return storage.getItem('payments', INITIAL_PAYMENTS);
  });

  useEffect(() => {
    storage.setItem('payments', payments);
  }, [payments]);

  // Notifications
  const [notifications, setNotifications] = useState(() => {
    return storage.getItem('notifications', INITIAL_NOTIFICATIONS);
  });

  useEffect(() => {
    storage.setItem('notifications', notifications);
  }, [notifications]);

  // Appointments State
  const [appointments, setAppointments] = useState(() => {
    return storage.getItem('appointments', INITIAL_APPOINTMENTS);
  });

  useEffect(() => {
    storage.setItem('appointments', appointments);
  }, [appointments]);

  // Feedbacks & Ratings State
  const [feedbacks, setFeedbacks] = useState(() => {
    return storage.getItem('feedbacks', INITIAL_FEEDBACKS);
  });

  useEffect(() => {
    storage.setItem('feedbacks', feedbacks);
  }, [feedbacks]);

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState(() => {
    return storage.getItem('supportTickets', [
      {
        id: 'TCK-801',
        patientName: 'Kavita Sundaram',
        mobile: '9845123456',
        category: 'Billing Query',
        subject: 'UPI Payment receipt deduction confirmation',
        status: 'Open',
        createdAt: '2026-09-06T10:30:00Z',
      },
    ]);
  });

  useEffect(() => {
    storage.setItem('supportTickets', supportTickets);
  }, [supportTickets]);

  // Emergency Mode City-wide
  const [emergencyMode, setEmergencyMode] = useState(() => {
    return storage.getItem('emergencyMode', false);
  });

  useEffect(() => {
    storage.setItem('emergencyMode', emergencyMode);
  }, [emergencyMode]);

  // Administration Users Directory
  // MUST start empty if not saved by user! Demo accounts are kept separate.
  const [users, setUsers] = useState(() => {
    return authService.getUsers();
  });

  useEffect(() => {
    authService.saveUsers(users);
  }, [users]);

  // Bed Reservations State
  const [bedReservations, setBedReservations] = useState(() => {
    return storage.getItem('bedReservations', []);
  });

  useEffect(() => {
    storage.setItem('bedReservations', bedReservations);
  }, [bedReservations]);

  // Ambulance Requests State
  const [ambulanceRequests, setAmbulanceRequests] = useState(() => {
    return storage.getItem('ambulanceRequests', []);
  });

  useEffect(() => {
    storage.setItem('ambulanceRequests', ambulanceRequests);
  }, [ambulanceRequests]);

  // Blood Bank & Donors State
  const [bloodInventory, setBloodInventory] = useState(() => {
    return storage.getItem('bloodInventory', INITIAL_BLOOD_INVENTORY);
  });

  useEffect(() => {
    storage.setItem('bloodInventory', bloodInventory);
  }, [bloodInventory]);

  const [bloodDonors, setBloodDonors] = useState(() => {
    return storage.getItem('bloodDonors', INITIAL_BLOOD_DONORS);
  });

  useEffect(() => {
    storage.setItem('bloodDonors', bloodDonors);
  }, [bloodDonors]);

  const [bloodRequests, setBloodRequests] = useState(() => {
    return storage.getItem('bloodRequests', INITIAL_BLOOD_REQUESTS);
  });

  useEffect(() => {
    storage.setItem('bloodRequests', bloodRequests);
  }, [bloodRequests]);

  const [bloodCamps, setBloodCamps] = useState(() => {
    return storage.getItem('bloodCamps', INITIAL_BLOOD_CAMPS);
  });

  useEffect(() => {
    storage.setItem('bloodCamps', bloodCamps);
  }, [bloodCamps]);

  // Initial Sync from Supabase if tables exist
  useEffect(() => {
    async function initSupabaseData() {
      try {
        const [
          hospitalsRes,
          patientsRes,
          bedsRes,
          medicinesRes,
          ambulancesRes,
          admissionsRes,
          dischargesRes,
          paymentsRes,
          referralsRes,
          usersRes,
          bloodInventoryRes,
          bloodDonorsRes,
          bloodRequestsRes,
          bloodCampsRes
        ] = await Promise.all([
          supabaseService.fetchHospitals(),
          supabaseService.fetchPatients(),
          supabaseService.fetchBeds(),
          supabaseService.fetchMedicines(),
          supabaseService.fetchAmbulances(),
          supabaseService.fetchAdmissions(),
          supabaseService.fetchDischarges(),
          supabaseService.fetchPayments(),
          supabaseService.fetchReferrals(),
          supabaseService.fetchUsers(),
          supabaseService.fetchBloodInventory(),
          supabaseService.fetchBloodDonors(),
          supabaseService.fetchBloodRequests(),
          supabaseService.fetchBloodCamps()
        ]);

        if (hospitalsRes?.data && hospitalsRes.data.length > 0) {
          setHospitals(hospitalsRes.data);
        }
        if (patientsRes?.data && patientsRes.data.length > 0) {
          setPatients(patientsRes.data);
        }
        if (bedsRes?.data && bedsRes.data.length > 0) {
          setBeds(bedsRes.data);
        }
        if (medicinesRes?.data && medicinesRes.data.length > 0) {
          setMedicines(medicinesRes.data);
        }
        if (ambulancesRes?.data && ambulancesRes.data.length > 0) {
          setAmbulances(ambulancesRes.data);
        }
        if (admissionsRes?.data && admissionsRes.data.length > 0) {
          setAdmissions(admissionsRes.data);
        }
        if (dischargesRes?.data && dischargesRes.data.length > 0) {
          setDischarges(dischargesRes.data);
        }
        if (paymentsRes?.data && paymentsRes.data.length > 0) {
          setPayments(paymentsRes.data);
        }
        if (referralsRes?.data && referralsRes.data.length > 0) {
          setReferrals(referralsRes.data);
        }
        if (usersRes?.data && usersRes.data.length > 0) {
          setUsers((prev) => {
            const existingIds = new Set(prev.map((u) => u.id));
            const combined = [...prev];
            usersRes.data.forEach((ru) => {
              if (!existingIds.has(ru.id)) {
                combined.push(ru);
              }
            });
            return combined;
          });
        }
        if (bloodInventoryRes?.data && bloodInventoryRes.data.length > 0) {
          setBloodInventory(bloodInventoryRes.data);
        }
        if (bloodDonorsRes?.data && bloodDonorsRes.data.length > 0) {
          setBloodDonors(bloodDonorsRes.data);
        }
        if (bloodRequestsRes?.data && bloodRequestsRes.data.length > 0) {
          setBloodRequests(bloodRequestsRes.data);
        }
        if (bloodCampsRes?.data && bloodCampsRes.data.length > 0) {
          setBloodCamps(bloodCampsRes.data);
        }
      } catch (err) {
        console.warn('Initial Supabase sync check:', err);
      }
    }
    initSupabaseData();
  }, []);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Login handler with Supabase as single source of truth
  const login = useCallback(async (email, password = 'arogya2026') => {
    const authResult = await authService.authenticateUser(email, password, users);
    if (!authResult.success) {
      if (authResult.deactivated) {
        showToast(authResult.error, 'error');
        return { success: false, deactivated: true, error: authResult.error };
      }
      if (authResult.notFound) {
        showToast(authResult.error, 'error');
        return { success: false, notFound: true, error: authResult.error };
      }
      showToast(authResult.error || 'Authentication failed', 'error');
      return { success: false, error: authResult.error };
    }

    const matchedHosp = hospitals.find((h) => h.name === authResult.user.hospitalNode);
    const sessionUser = {
      ...authResult.user,
      hospitalId: matchedHosp?.id || authResult.user.hospitalId || activeHospitalId || 'HOSP-01',
    };

    setCurrentUser(sessionUser);
    authService.saveSession(sessionUser);
    showToast(`Welcome to ${sessionUser.role} Portal`, 'success');
    return { ...sessionUser, success: true };
  }, [users, hospitals, activeHospitalId, showToast]);

  // Register New Staff User in Supabase Auth & users_directory
  const registerUser = useCallback(async (userData) => {
    const res = await authService.createUser(userData);
    if (!res.success) {
      showToast(res.error, 'error');
      return res;
    }
    setUsers((prev) => [res.user, ...prev.filter((u) => u.id !== res.user.id)]);
    showToast(`Account created for ${res.user.name}`, 'success');
    return res;
  }, [showToast]);

  // Patient OTP login handler linked to Supabase patients and users_directory
  const loginPatientWithOtp = useCallback(async (name, mobile) => {
    // Find or create patient record in patients table
    let existingPatient = patients.find((p) => p.mobile === mobile);
    if (!existingPatient) {
      const newToken = generateToken();
      const newPatId = 'PAT-' + Date.now();
      const selectedHosp = hospitals.find((h) => h.id === activeHospitalId) || hospitals[0];
      existingPatient = {
        id: newPatId,
        token: newToken,
        name,
        age: 30,
        gender: 'Other',
        mobile,
        aadhar: '1234 5678 9012',
        abha: '12-3456-7890-9999',
        address: 'Bengaluru City',
        city: 'Bengaluru',
        hospitalId: activeHospitalId || 'HOSP-01',
        department: 'General Medicine',
        doctor: 'Dr. Priya Nair',
        priority: 'Normal',
        status: 'Waiting',
        queuePosition: patients.filter((p) => p.hospitalId === (activeHospitalId || 'HOSP-01') && p.status === 'Waiting').length + 1,
        registeredAt: new Date().toISOString(),
        journey: [
          { stage: 'Registration', time: formatTime(), note: 'Self-registered via Patient OTP Access', actor: name, userId: newPatId },
          { stage: 'Queue', time: formatTime(), note: 'Waiting for OPD consultation', actor: 'System' },
        ],
        vitals: { bp: '120/80', pulse: 72, temp: '98.6°F', spo2: '99%' },
        diagnosis: 'General Health Consultation',
        symptoms: 'Routine check-up and care evaluation',
        labRequests: [],
        prescriptions: [],
      };
      setPatients((prev) => [existingPatient, ...prev]);
      await supabaseService.insertPatient(existingPatient);
    }

    // Ensure patient has a corresponding record in users_directory table in Supabase
    const patientUserRecord = {
      id: existingPatient.id,
      user_id: existingPatient.id,
      name: existingPatient.name,
      email: `${existingPatient.mobile}@patient.arogya.gov.in`,
      assignedRole: ROLES.PATIENT,
      role: ROLES.PATIENT,
      hospitalNode: hospitals.find((h) => h.id === existingPatient.hospitalId)?.name || 'Bengaluru Central Hospital',
      status: 'Active',
      createdDate: new Date().toLocaleDateString('en-IN'),
    };
    await supabaseService.upsertUser(patientUserRecord);
    setUsers((prev) => [patientUserRecord, ...prev.filter((u) => u.id !== patientUserRecord.id)]);

    const user = {
      id: existingPatient.id,
      user_id: existingPatient.id,
      patientId: existingPatient.id,
      name: existingPatient.name,
      email: `${existingPatient.mobile}@patient.arogya.gov.in`,
      mobile: existingPatient.mobile,
      phone: existingPatient.mobile,
      role: ROLES.PATIENT,
      assignedRole: ROLES.PATIENT,
      hospitalId: existingPatient.hospitalId,
      hospitalNode: patientUserRecord.hospitalNode,
      token: existingPatient.token,
      status: 'Active',
      created_at: existingPatient.registeredAt || new Date().toISOString(),
    };

    setCurrentUser(user);
    authService.saveSession(user);
    showToast('Patient session verified successfully', 'success');
    return user;
  }, [activeHospitalId, hospitals, patients, showToast]);

  const logout = useCallback(async () => {
    authService.logoutUser();
    try {
      await supabaseService.signOutAuth();
    } catch {
      // safe signOut catch
    }
    setCurrentUser(null);
    showToast('Logged out successfully', 'info');
  }, [showToast]);

  // Register Patient Action
  const registerPatient = useCallback(async (formData) => {
    const token = generateToken();
    const assignedHospitalId = formData.hospitalId || currentUser?.hospitalId || activeHospitalId || 'HOSP-01';
    const assignedDoctor = formData.doctor || (currentUser?.role === 'DOCTOR' ? currentUser.name : 'Dr. Priya Nair');
    const authorName = currentUser?.name || 'Staff User';
    const authorId = currentUser?.id || 'STAFF-01';

    const newPatient = {
      id: 'PAT-' + Date.now(),
      uhid: formData.uhid || ('UHID-2026-' + Math.floor(1000 + Math.random() * 9000)),
      token,
      name: formData.name,
      age: Number(formData.age) || 30,
      gender: formData.gender || 'Male',
      mobile: formData.mobile,
      aadhar: formData.aadhar || 'XXXX XXXX 0000',
      abha: formData.abha || '00-0000-0000-0000',
      address: formData.address || '',
      city: formData.city || 'Bengaluru',
      emergencyContact: formData.emergencyContact || formData.mobile || '',
      bloodGroup: formData.bloodGroup || 'O +ve',
      allergies: formData.allergies ? (Array.isArray(formData.allergies) ? formData.allergies : [formData.allergies]) : [],
      hospitalId: assignedHospitalId,
      department: formData.department || 'General Medicine',
      doctor: assignedDoctor,
      priority: formData.priority || 'Normal',
      status: formData.priority === 'Emergency' ? 'Emergency' : 'Waiting',
      queuePosition: patients.filter((p) => p.hospitalId === assignedHospitalId && p.status === 'Waiting').length + 1,
      registeredAt: new Date().toISOString(),
      symptoms: formData.symptoms || 'Walk-in registration',
      vitals: {
        bp: formData.bp || '120/80',
        pulse: Number(formData.pulse) || 75,
        temp: formData.temp || '98.6°F',
        spo2: formData.spo2 || '98%',
      },
      diagnosis: formData.diagnosis || 'Pending doctor examination',
      journey: [
        { stage: 'Registration', time: formatTime(), note: `Registered in ${formData.department || 'General Medicine'} by ${authorName}`, actor: authorName, userId: authorId },
        { stage: 'Queue', time: formatTime(), note: `Queue Token #${token} generated`, actor: 'System' },
      ],
      labRequests: [],
      prescriptions: [],
      reports: [],
      medicalHistory: formData.medicalHistory || [],
    };

    setPatients((prev) => [newPatient, ...prev]);

    // Remote sync to Supabase
    const { error } = await supabaseService.insertPatient(newPatient);
    if (error) {
      showToast(`Supabase Sync Warning: ${error.message || 'Failed to save patient'}`, 'error');
    }

    // Push notification
    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: newPatient.priority === 'Emergency' ? 'EMERGENCY PATIENT TRIAGED' : 'New Patient Registered',
      message: `${newPatient.name} assigned token ${newPatient.token} in ${newPatient.department}.`,
      type: newPatient.priority === 'Emergency' ? 'emergency' : 'info',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: newPatient.hospitalId,
      link: '/patient-flow',
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast(`Patient registered! Token: ${token}`, 'success');
    return newPatient;
  }, [activeHospitalId, currentUser, patients, showToast]);

  // Update Patient Status
  const updatePatientStatus = useCallback(async (patientId, newStatus, note = '') => {
    let updatedPatient = null;
    const authorName = currentUser?.name || 'Staff User';
    const authorId = currentUser?.id || 'STAFF-01';

    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id !== patientId) return pat;
        const updatedJourney = [...(pat.journey || [])];
        const stageName =
          newStatus === 'In Consultation' ? 'Doctor Consultation' :
          newStatus === 'Lab' ? 'Lab Investigation' :
          newStatus === 'Pharmacy' ? 'Pharmacy' :
          newStatus === 'Discharged' ? 'Discharge' :
          newStatus === 'Emergency' ? 'Emergency Triage' : newStatus;

        updatedJourney.push({
          stage: stageName,
          time: formatTime(),
          note: note || `Status updated to ${newStatus} by ${authorName}`,
          actor: authorName,
          userId: authorId,
        });

        const updated = {
          ...pat,
          status: newStatus,
          journey: updatedJourney,
        };
        updatedPatient = updated;
        return updated;
      })
    );

    if (updatedPatient) {
      const { error } = await supabaseService.updatePatient(patientId, {
        status: newStatus,
        journey: updatedPatient.journey,
      });
      if (error) {
        showToast(`Supabase Sync: ${error.message}`, 'error');
      }
    }
    showToast(`Patient status changed to ${newStatus}`, 'info');
  }, [currentUser, showToast]);

  // Update Patient Clinical Data (Doctor OPD Desk)
  const updatePatientClinical = useCallback(async (patientId, { diagnosis, vitals, symptoms }) => {
    let target = null;
    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id !== patientId) return pat;
        target = {
          ...pat,
          diagnosis: diagnosis || pat.diagnosis,
          vitals: { ...(pat.vitals || {}), ...(vitals || {}) },
          symptoms: symptoms || pat.symptoms,
        };
        return target;
      })
    );

    if (target) {
      const { error } = await supabaseService.updatePatient(patientId, {
        diagnosis: target.diagnosis,
        vitals: target.vitals,
        symptoms: target.symptoms,
      });
      if (error) {
        showToast(`Supabase Sync: ${error.message}`, 'error');
      }
    }
    showToast('Clinical record updated successfully', 'success');
  }, [showToast]);

  // Add Lab Diagnostic Test(s)
  const addLabRequest = useCallback(async (patientId, testOrTests) => {
    const doctorName = currentUser?.name || 'Consulting Specialist';
    const testsArray = Array.isArray(testOrTests) ? testOrTests : [testOrTests];

    const newLabItems = testsArray.map((test, idx) => ({
      id: test.id || ('LAB-' + Date.now() + '-' + idx + '-' + Math.floor(Math.random() * 1000)),
      testName: test.testName,
      priority: test.priority || 'Routine',
      status: test.status || 'Ordered',
      instructions: test.instructions || 'Standard protocol',
      orderedAt: test.orderedAt || formatTime(),
      orderedBy: test.orderedBy || doctorName,
      department: test.department || 'Diagnostic Labs',
    }));

    let updatedPatient = null;
    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id !== patientId) return pat;
        const currentLabs = pat.labRequests || pat.testsOrdered || [];
        const journey = [...(pat.journey || [])];

        newLabItems.forEach((item) => {
          journey.push({
            stage: 'Lab Investigation',
            time: formatTime(),
            note: `Diagnostic test ordered: ${item.testName} (${item.priority}) by ${doctorName}`,
          });
        });

        const combinedLabs = [...currentLabs, ...newLabItems];
        updatedPatient = {
          ...pat,
          labRequests: combinedLabs,
          testsOrdered: combinedLabs,
          journey,
        };
        return updatedPatient;
      })
    );

    if (updatedPatient) {
      await supabaseService.updatePatient(patientId, {
        labRequests: updatedPatient.labRequests,
        journey: updatedPatient.journey,
      });
    }

    const testNamesStr = newLabItems.map((t) => t.testName).join(', ');
    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Diagnostic Test(s) Ordered',
      message: `${testNamesStr} ordered for patient by ${doctorName}.`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: activeHospitalId,
      link: '/patient-flow',
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast(`Diagnostic test(s) [${testNamesStr}] ordered`, 'success');
    return newLabItems;
  }, [activeHospitalId, currentUser, showToast]);

  // Remove / Cancel Lab Request
  const removeLabRequest = useCallback(async (patientId, testId) => {
    let updatedPatient = null;
    let removedTestName = '';
    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id !== patientId) return pat;
        const currentLabs = pat.labRequests || pat.testsOrdered || [];
        const target = currentLabs.find((t) => t.id === testId);
        if (target) removedTestName = target.testName;
        const filtered = currentLabs.filter((t) => t.id !== testId);
        const journey = [...(pat.journey || [])];
        if (removedTestName) {
          journey.push({
            stage: 'Lab Test Cancelled',
            time: formatTime(),
            note: `Test ${removedTestName} cancelled by ${currentUser?.name || 'attending physician'}`,
          });
        }
        updatedPatient = {
          ...pat,
          labRequests: filtered,
          testsOrdered: filtered,
          journey,
        };
        return updatedPatient;
      })
    );

    if (updatedPatient) {
      await supabaseService.updatePatient(patientId, {
        labRequests: updatedPatient.labRequests,
        journey: updatedPatient.journey,
      });
    }

    showToast('Test order removed', 'info');
  }, [currentUser, showToast]);

  // Update Lab Test Status (e.g. Ordered -> Scheduled -> Sample Collected -> Processing -> Completed)
  const updateLabTestStatus = useCallback(async (patientId, testId, newStatus, note = '') => {
    const actor = currentUser?.name || 'Lab Technician';
    let updatedPatient = null;
    let testName = '';

    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id !== patientId) return pat;
        const currentLabs = pat.labRequests || pat.testsOrdered || [];
        const updatedLabs = currentLabs.map((t) => {
          if (t.id === testId) {
            testName = t.testName;
            return {
              ...t,
              status: newStatus,
              updatedAt: formatTime(),
              updatedBy: actor,
              note: note || t.note,
            };
          }
          return t;
        });

        const journey = [...(pat.journey || [])];
        journey.push({
          stage: 'Lab Test Update',
          time: formatTime(),
          note: `${testName || 'Test'} transitioned to "${newStatus}" by ${actor}${note ? ` (${note})` : ''}`,
        });

        updatedPatient = {
          ...pat,
          labRequests: updatedLabs,
          testsOrdered: updatedLabs,
          journey,
        };
        return updatedPatient;
      })
    );

    if (updatedPatient) {
      await supabaseService.updatePatient(patientId, {
        labRequests: updatedPatient.labRequests,
        journey: updatedPatient.journey,
      });
    }

    showToast(`${testName || 'Test'} marked as ${newStatus}`, 'success');
  }, [currentUser, showToast]);

  // Add Digital Prescription
  const addPrescription = useCallback(async (patientId, medicinesList) => {
    let updatedPatient = null;
    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id !== patientId) return pat;
        const currentRx = pat.prescriptions || [];
        const newItems = medicinesList.map((m, idx) => ({
          id: 'RX-' + Date.now() + '-' + idx,
          medicine: m.medicine,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions,
          status: 'Active',
        }));

        const journey = [...(pat.journey || [])];
        journey.push({
          stage: 'Prescription',
          time: formatTime(),
          note: `Digital prescription issued with ${newItems.length} medication(s)`,
        });

        updatedPatient = {
          ...pat,
          prescriptions: [...currentRx, ...newItems],
          journey,
        };
        return updatedPatient;
      })
    );

    if (updatedPatient) {
      await supabaseService.updatePatient(patientId, {
        prescriptions: updatedPatient.prescriptions,
        journey: updatedPatient.journey,
      });
    }

    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Digital Prescription Transmitted',
      message: `Prescription sent to Pharmacy counter for dispensation.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: activeHospitalId,
      link: '/pharmacy',
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast('Prescription saved and sent to Pharmacy', 'success');
  }, [activeHospitalId, showToast]);

  // Book Scheduled OPD Appointment
  /**
   * Mirror a booking into the Supabase approval queue.
   *
   * Fire and forget on purpose: the optimistic local record and its toast have
   * already been shown, so a network or schema failure must not roll that back.
   * The error is surfaced as its own toast and the receptionist simply will not
   * see this particular request.
   */
  const pushSupabaseApproval = useCallback((kind, row) => {
    submitRequest(kind, row)
      .then(({ error }) => {
        if (error) {
          showToast(
            'Saved locally, but the approval queue could not be reached: ' + error.message,
            'error'
          );
        }
      })
      .catch((err) => {
        showToast('Saved locally, approval queue unreachable: ' + err.message, 'error');
      });
  }, [showToast]);

  // Cancel Appointment
  const cancelAppointment = useCallback((appointmentId) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: 'Cancelled' } : apt
      )
    );
    showToast(`Appointment ${appointmentId} cancelled`, 'info');
  }, [showToast]);

  // Check In Appointment into Live OPD Queue
  const checkInAppointment = useCallback(async (appointmentId) => {
    const apt = appointments.find((a) => a.id === appointmentId);
    if (!apt) {
      showToast('Appointment record not found', 'error');
      return null;
    }

    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: 'Checked In' } : a))
    );

    const existingActive = patients.find(
      (p) => p.mobile === apt.mobile && (p.status === 'Waiting' || p.status === 'In Consultation')
    );
    if (existingActive) {
      showToast(`Patient is already in queue with Token #${existingActive.token}`, 'info');
      return existingActive;
    }

    const newPatient = await registerPatient({
      name: apt.patientName,
      age: apt.age,
      gender: apt.gender,
      mobile: apt.mobile,
      hospitalId: apt.hospitalId,
      department: apt.department,
      doctor: apt.doctor,
      priority: 'Normal',
      symptoms: `Appointment (${apt.id}) - ${apt.symptoms || 'Scheduled Consultation'}`,
      appointmentType: 'Scheduled Appointment',
    });
    showToast(`Appointment checked in! Token #${newPatient.token} issued`, 'success');
    return newPatient;
  }, [appointments, patients, registerPatient, showToast]);

  // Submit Patient Feedback
  const submitFeedback = useCallback((feedbackData) => {
    const fbId = 'FB-' + Math.floor(100 + Math.random() * 900);
    const newFeedback = {
      id: fbId,
      patientName: feedbackData.patientName || currentUser?.name || 'Anonymous Patient',
      mobile: feedbackData.mobile || currentUser?.mobile || '',
      hospitalId: feedbackData.hospitalId || activeHospitalId || 'HOSP-01',
      department: feedbackData.department || 'General Medicine',
      doctor: feedbackData.doctor || 'Dr. Priya Nair',
      rating: Number(feedbackData.rating) || 5,
      categories: Array.isArray(feedbackData.categories) ? feedbackData.categories : ['Doctor Care'],
      comments: feedbackData.comments || '',
      createdAt: new Date().toISOString(),
    };
    setFeedbacks((prev) => [newFeedback, ...prev]);

    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'New Patient Feedback Received',
      message: `${newFeedback.patientName} submitted a ${newFeedback.rating}-star review for ${newFeedback.doctor}.`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: newFeedback.hospitalId,
      link: '/administration',
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast('Thank you! Your feedback has been recorded.', 'success');
    return newFeedback;
  }, [activeHospitalId, currentUser, showToast]);

  // Calculate Smart Queue ETA
  const calculateQueueEta = useCallback((queuePosition, priority = 'Normal') => {
    if (priority === 'Emergency') return 'Immediate (STAT)';
    const pos = Math.max(1, Number(queuePosition) || 1);
    const avgMinutes = priority === 'Urgent' ? 6 : 12;
    const estMinutes = (pos - 1) * avgMinutes;
    if (estMinutes === 0) return 'Next in line (< 5m)';
    if (estMinutes < 60) return `~${estMinutes} mins`;
    const hours = Math.floor(estMinutes / 60);
    const mins = estMinutes % 60;
    return `~${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }, []);

  // Submit Support Ticket
  const submitSupportTicket = useCallback((ticketData) => {
    const ticketId = 'TCK-' + Math.floor(100 + Math.random() * 900);
    const newTicket = {
      id: ticketId,
      patientName: ticketData.patientName || currentUser?.name || 'Patient',
      mobile: ticketData.mobile || currentUser?.mobile || '',
      category: ticketData.category || 'General Inquiry',
      subject: ticketData.subject || '',
      message: ticketData.message || '',
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    setSupportTickets((prev) => [newTicket, ...prev]);

    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Support Ticket Registered',
      message: `Ticket #${ticketId} created: ${newTicket.subject}`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: activeHospitalId,
      link: '/patient-portal',
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast(`Support Ticket #${ticketId} submitted. Support team will respond shortly.`, 'success');
    return newTicket;
  }, [activeHospitalId, currentUser, showToast]);

  // Assign Bed
  const assignBed = useCallback(async (bedId, patientId, condition = 'Stable') => {
    const patient = patients.find((p) => p.id === patientId);
    const targetBed = beds.find((b) => b.id === bedId);
    if (!targetBed) return;

    const attendingStaff = currentUser?.name || 'Staff Attendant';
    const staffId = currentUser?.id || 'STAFF-01';
    const assignedDoctor = currentUser?.role === 'DOCTOR' ? currentUser.name : (patient?.doctor || 'Consultant On Duty');

    setBeds((prev) =>
      prev.map((bed) => {
        if (bed.id !== bedId) return bed;
        return {
          ...bed,
          status: 'Occupied',
          patientId,
          patientName: patient?.name || 'Inpatient',
          patientCondition: condition,
          assignedAt: new Date().toISOString(),
        };
      })
    );

    // Create admission record with user attribution
    const newAdmission = {
      id: 'ADM-' + Date.now(),
      patientId,
      patientName: patient?.name || 'Inpatient',
      hospitalId: targetBed.hospitalId,
      admissionDate: new Date().toISOString(),
      department: patient?.department || 'General Medicine',
      doctor: assignedDoctor,
      diagnosis: patient?.diagnosis || 'Inpatient observation',
      ward: targetBed.ward,
      bedNumber: targetBed.bedNumber,
      attendantName: attendingStaff,
      attendantContact: patient?.mobile || 'N/A',
      emergencyStatus: condition === 'Critical' ? 'Critical' : 'Normal',
      notes: `Assigned Bed ${targetBed.bedNumber} in ${targetBed.ward} ward by ${attendingStaff} (ID: ${staffId}).`,
      status: 'Admitted',
    };
    setAdmissions((prev) => [newAdmission, ...prev]);

    // Remote sync to Supabase
    const bedRes = await supabaseService.updateBed(bedId, {
      status: 'Occupied',
      patientId: patientId,
      patientName: patient?.name || 'Inpatient',
      patientCondition: condition,
      assignedAt: new Date().toISOString(),
    });
    if (bedRes.error) {
      showToast(`Supabase Bed update: ${bedRes.error.message}`, 'error');
    }

    const admRes = await supabaseService.insertAdmission(newAdmission);
    if (admRes.error) {
      showToast(`Supabase Admission save: ${admRes.error.message}`, 'error');
    }

    // Update patient journey
    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id !== patientId) return pat;
        const journey = [...(pat.journey || [])];
        journey.push({
          stage: 'Admission',
          time: formatTime(),
          note: `Admitted to ${targetBed.ward} Ward, Bed #${targetBed.bedNumber} by ${attendingStaff}`,
          actor: attendingStaff,
          userId: staffId,
        });
        return {
          ...pat,
          bedNumber: targetBed.bedNumber,
          ward: targetBed.ward,
          journey,
        };
      })
    );

    showToast(`Bed ${targetBed.bedNumber} assigned to ${patient?.name || 'patient'}`, 'success');
  }, [beds, currentUser, patients, showToast]);

  // Release / Clean Bed
  const releaseBed = useCallback(async (bedId, status = 'Cleaning') => {
    setBeds((prev) =>
      prev.map((bed) => {
        if (bed.id !== bedId) return bed;
        return {
          ...bed,
          status,
          patientId: null,
          patientName: null,
          patientCondition: null,
          assignedAt: null,
        };
      })
    );

    const { error } = await supabaseService.updateBed(bedId, {
      status,
      patientId: null,
      patientName: null,
      patientCondition: null,
      assignedAt: null,
    });
    if (error) {
      showToast(`Supabase Bed release: ${error.message}`, 'error');
    }

    showToast(`Bed updated to ${status}`, 'info');
  }, [showToast]);

  // Discharge Patient
  const dischargePatient = useCallback(async (patientId, dischargeData) => {
    const patient = patients.find((p) => p.id === patientId);
    const dischargeDoctor = dischargeData.doctor || (currentUser?.role === 'DOCTOR' ? currentUser.name : (patient?.doctor || 'Attending Specialist'));
    const staffAuthor = currentUser?.name || 'Attending Physician';
    const staffId = currentUser?.id || 'STAFF-01';
    
    // Free any assigned beds
    setBeds((prev) =>
      prev.map((b) => {
        if (b.patientId === patientId) {
          return {
            ...b,
            status: 'Cleaning',
            patientId: null,
            patientName: null,
            patientCondition: null,
          };
        }
        return b;
      })
    );

    // Update patient status to Discharged
    let updatedJourney = [];
    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id !== patientId) return pat;
        updatedJourney = [...(pat.journey || [])];
        updatedJourney.push({
          stage: 'Discharge',
          time: formatTime(),
          note: `Patient discharged by ${staffAuthor}. ${dischargeData.dischargeCondition || 'Clinically stable.'}`,
          actor: staffAuthor,
          userId: staffId,
        });
        return {
          ...pat,
          status: 'Discharged',
          queuePosition: 0,
          journey: updatedJourney,
        };
      })
    );

    // Save discharge record
    const dischargeRecord = {
      id: 'DIS-' + Date.now(),
      admissionId: dischargeData.admissionId || 'ADM-DIS-' + Date.now(),
      patientId,
      patientName: patient?.name || 'Discharged Patient',
      hospitalId: patient?.hospitalId || currentUser?.hospitalId || activeHospitalId,
      doctor: dischargeDoctor,
      department: patient?.department || 'General Medicine',
      diagnosis: dischargeData.diagnosis || patient?.diagnosis || 'Recovery completed',
      treatmentSummary: dischargeData.treatmentSummary || 'Course of medications and supportive care completed.',
      medicines: dischargeData.medicines || 'Prescribed oral maintenance medications.',
      labResults: dischargeData.labResults || 'Vitals stabilized; markers within acceptable range.',
      dischargeCondition: dischargeData.dischargeCondition || 'Stable / Ambulatory',
      followUpDate: dischargeData.followUpDate || 'After 7 days',
      followUpInstructions: dischargeData.followUpInstructions || 'Continue hydration and routine medicines.',
      finalBill: Number(dischargeData.finalBill) || 1200,
      paymentStatus: dischargeData.paymentStatus || 'Paid',
      dischargeDate: new Date().toLocaleDateString(),
    };
    setDischarges((prev) => [dischargeRecord, ...prev]);

    // Create payment billing record
    const paymentRecord = {
      id: 'PAY-' + Date.now(),
      billNumber: 'REC-' + Math.floor(100000 + Math.random() * 900000),
      patientId,
      patientName: patient?.name || 'Patient',
      hospitalId: patient?.hospitalId || currentUser?.hospitalId || activeHospitalId,
      consultationFee: 500,
      labFee: (patient?.labRequests?.length || 0) * 350,
      medicineFee: (patient?.prescriptions?.length || 0) * 200,
      bedCharges: Number(dischargeData.finalBill) > 1050 ? Number(dischargeData.finalBill) - 1050 : 0,
      otherCharges: 50,
      totalAmount: Number(dischargeData.finalBill) || 1200,
      paymentStatus: dischargeData.paymentStatus || 'Paid',
      method: dischargeData.paymentMethod || 'UPI',
      createdAt: new Date().toISOString(),
      transactionId: 'TXN-' + Math.floor(10000000 + Math.random() * 90000000),
    };
    setPayments((prev) => [paymentRecord, ...prev]);

    // Remote sync to Supabase
    const [disRes, payRes, patRes] = await Promise.all([
      supabaseService.insertDischarge(dischargeRecord),
      supabaseService.insertPayment(paymentRecord),
      supabaseService.updatePatient(patientId, { status: 'Discharged', journey: updatedJourney })
    ]);

    if (disRes.error) showToast(`Supabase Discharge: ${disRes.error.message}`, 'error');
    if (payRes.error) showToast(`Supabase Payment: ${payRes.error.message}`, 'error');
    if (patRes.error) showToast(`Supabase Patient: ${patRes.error.message}`, 'error');

    showToast(`Patient ${patient?.name || ''} successfully discharged`, 'success');
    return dischargeRecord;
  }, [activeHospitalId, currentUser, patients, showToast]);

  // Record Standalone / Terminal Payment
  const recordPayment = useCallback(async (paymentData) => {
    const newPay = {
      id: `PAY-${Date.now()}`,
      billNumber: paymentData.billNumber || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      patientId: paymentData.patientId || null,
      patientName: paymentData.patientName || 'Direct Terminal Pay',
      hospitalId: paymentData.hospitalId || activeHospitalId,
      consultationFee: Number(paymentData.consultationFee) || 0,
      labFee: Number(paymentData.labFee) || 0,
      medicineFee: Number(paymentData.medicineFee) || 0,
      bedCharges: Number(paymentData.bedCharges) || 0,
      otherCharges: Number(paymentData.otherCharges) || 0,
      totalAmount: Number(paymentData.totalAmount) || 500,
      paymentStatus: 'Paid',
      method: paymentData.method || 'UPI',
      transactionId: paymentData.transactionId || `UPI-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [newPay, ...prev]);
    showToast(`Payment of ₹${newPay.totalAmount} confirmed via ${newPay.method}! Receipt #${newPay.billNumber}`, 'success');

    try {
      await supabaseService.insertPayment(newPay);
    } catch (e) {
      console.warn('Supabase record payment sync:', e);
    }

    return newPay;
  }, [activeHospitalId, showToast]);

  // Blood Bank: Register Donor
  const registerBloodDonor = useCallback(async (donorData) => {
    const newDonor = {
      id: `DNR-${Date.now().toString().slice(-4)}`,
      name: donorData.name,
      age: Number(donorData.age) || 28,
      gender: donorData.gender || 'Male',
      bloodGroup: donorData.bloodGroup,
      mobile: donorData.mobile,
      email: donorData.email || '',
      city: donorData.city || 'Bengaluru',
      address: donorData.address || '',
      weight: Number(donorData.weight) || 60,
      hemoglobin: Number(donorData.hemoglobin) || 13.5,
      bloodPressure: donorData.bloodPressure || '120/80',
      lastDonationDate: donorData.lastDonationDate || null,
      totalDonations: Number(donorData.totalDonations) || 0,
      eligibilityStatus: donorData.eligibilityStatus || 'Eligible',
      registeredHospitalId: donorData.registeredHospitalId || activeHospitalId,
      isEmergencyVolunteer: Boolean(donorData.isEmergencyVolunteer),
      medicalNotes: donorData.medicalNotes || 'Voluntary donor registration',
      createdAt: new Date().toISOString(),
    };

    setBloodDonors((prev) => [newDonor, ...prev]);
    showToast(`Blood donor ${newDonor.name} (${newDonor.bloodGroup}) registered successfully!`, 'success');

    try {
      await supabaseService.upsertBloodDonor(newDonor);
    } catch (e) {
      console.warn('Supabase donor sync:', e);
    }

    return newDonor;
  }, [activeHospitalId, showToast]);

  // Blood Bank: Update Donor
  const updateBloodDonor = useCallback(async (id, updates) => {
    let updatedDonor = null;
    setBloodDonors((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          updatedDonor = { ...d, ...updates };
          return updatedDonor;
        }
        return d;
      })
    );

    if (updatedDonor) {
      showToast(`Donor record for ${updatedDonor.name} updated`, 'info');
      try {
        await supabaseService.upsertBloodDonor(updatedDonor);
      } catch (e) {
        console.warn('Supabase donor update sync:', e);
      }
    }
  }, [showToast]);

  // Blood Bank: Delete Donor
  const deleteBloodDonor = useCallback(async (id) => {
    setBloodDonors((prev) => prev.filter((d) => d.id !== id));
    showToast('Donor record removed', 'info');
    try {
      await supabaseService.deleteBloodDonor(id);
    } catch (e) {
      console.warn('Supabase donor delete sync:', e);
    }
  }, [showToast]);

  // Blood Bank: Record Voluntary Donation
  const recordDonation = useCallback(async (donorId, { units = 1, component = 'Whole Blood', notes = '' } = {}) => {
    const donor = bloodDonors.find((d) => d.id === donorId);
    if (!donor) return;

    const updatedDonor = {
      ...donor,
      totalDonations: (donor.totalDonations || 0) + units,
      lastDonationDate: new Date().toISOString(),
      eligibilityStatus: 'Cooling Period',
      medicalNotes: notes || donor.medicalNotes,
    };

    setBloodDonors((prev) => prev.map((d) => (d.id === donorId ? updatedDonor : d)));

    // Automatically credit units to blood inventory for that hospital and group!
    const targetHospId = donor.registeredHospitalId || activeHospitalId;
    setBloodInventory((prev) => {
      let found = false;
      const updated = prev.map((item) => {
        if (item.hospitalId === targetHospId && item.bloodGroup === donor.bloodGroup) {
          found = true;
          const compKey = component === 'Packed Red Blood Cells (PRBC)' ? 'prbc' :
                          component === 'Platelets Concentrate' ? 'platelets' :
                          component === 'Fresh Frozen Plasma (FFP)' ? 'ffp' : 'wholeBlood';
          const newCompCount = (item[compKey] || 0) + units;
          const newTotal = (item.totalUnits || 0) + units;
          const updatedItem = {
            ...item,
            [compKey]: newCompCount,
            totalUnits: newTotal,
            status: newTotal <= 3 ? 'Critical' : newTotal < (item.minThreshold || 10) ? 'Low Stock' : 'Adequate',
            lastRestocked: new Date().toISOString(),
          };
          supabaseService.upsertBloodInventory(updatedItem);
          return updatedItem;
        }
        return item;
      });

      if (!found) {
        const newItem = {
          id: `STK-${targetHospId}-${donor.bloodGroup.replace('+', 'P').replace('-', 'N')}`,
          hospitalId: targetHospId,
          bloodGroup: donor.bloodGroup,
          wholeBlood: component === 'Whole Blood' ? units : 0,
          prbc: component === 'Packed Red Blood Cells (PRBC)' ? units : 0,
          platelets: component === 'Platelets Concentrate' ? units : 0,
          ffp: component === 'Fresh Frozen Plasma (FFP)' ? units : 0,
          totalUnits: units,
          minThreshold: 10,
          status: units <= 3 ? 'Critical' : 'Low Stock',
          lastRestocked: new Date().toISOString(),
        };
        supabaseService.upsertBloodInventory(newItem);
        return [...updated, newItem];
      }
      return updated;
    });

    showToast(`Donation recorded! +${units} unit(s) credited to ${donor.bloodGroup} inventory`, 'success');

    try {
      await supabaseService.upsertBloodDonor(updatedDonor);
    } catch (e) {
      console.warn('Supabase record donation sync:', e);
    }
  }, [bloodDonors, activeHospitalId, showToast]);

  // Blood Bank: Update Inventory Stock
  const updateBloodStock = useCallback(async (hospitalId, bloodGroup, component, delta) => {
    setBloodInventory((prev) => {
      let found = false;
      const updated = prev.map((item) => {
        if (item.hospitalId === hospitalId && item.bloodGroup === bloodGroup) {
          found = true;
          const compKey = component === 'Packed Red Blood Cells (PRBC)' ? 'prbc' :
                          component === 'Platelets Concentrate' ? 'platelets' :
                          component === 'Fresh Frozen Plasma (FFP)' ? 'ffp' : 'wholeBlood';
          const newComp = Math.max(0, (item[compKey] || 0) + delta);
          const newTotal = Math.max(0, (item.totalUnits || 0) + delta);
          const updatedItem = {
            ...item,
            [compKey]: newComp,
            totalUnits: newTotal,
            status: newTotal <= 3 ? 'Critical' : newTotal < (item.minThreshold || 10) ? 'Low Stock' : 'Adequate',
            lastRestocked: new Date().toISOString(),
          };
          supabaseService.upsertBloodInventory(updatedItem);
          return updatedItem;
        }
        return item;
      });

      if (!found && delta > 0) {
        const newItem = {
          id: `STK-${hospitalId}-${bloodGroup.replace('+', 'P').replace('-', 'N')}`,
          hospitalId,
          bloodGroup,
          wholeBlood: component === 'Whole Blood' ? delta : 0,
          prbc: component === 'Packed Red Blood Cells (PRBC)' ? delta : 0,
          platelets: component === 'Platelets Concentrate' ? delta : 0,
          ffp: component === 'Fresh Frozen Plasma (FFP)' ? delta : 0,
          totalUnits: delta,
          minThreshold: 10,
          status: delta <= 3 ? 'Critical' : 'Low Stock',
          lastRestocked: new Date().toISOString(),
        };
        supabaseService.upsertBloodInventory(newItem);
        return [...updated, newItem];
      }
      return updated;
    });

    showToast(`Blood stock for ${bloodGroup} updated (${delta >= 0 ? '+' : ''}${delta} units)`, 'info');
  }, [showToast]);

  // Blood Bank: Create Blood Requisition
  const createBloodRequest = useCallback(async (reqData) => {
    const newReq = {
      id: `REQ-B-${Date.now().toString().slice(-4)}`,
      patientId: reqData.patientId || null,
      patientName: reqData.patientName,
      hospitalId: reqData.hospitalId || activeHospitalId,
      bloodGroup: reqData.bloodGroup,
      component: reqData.component || 'Whole Blood',
      unitsNeeded: Number(reqData.unitsNeeded) || 1,
      unitsDispatched: 0,
      priority: reqData.priority || 'Routine Elective',
      department: reqData.department || 'General Medicine',
      doctorName: reqData.doctorName || 'Attending Physician',
      clinicalIndication: reqData.clinicalIndication || '',
      crossMatchStatus: 'Pending Cross-Match',
      status: 'Pending',
      requestedAt: new Date().toISOString(),
    };

    setBloodRequests((prev) => [newReq, ...prev]);

    if (newReq.priority === 'STAT Emergency') {
      showToast(`🚨 STAT BLOOD REQUISITION: ${newReq.unitsNeeded} unit(s) of ${newReq.bloodGroup} requested for ${newReq.patientName}`, 'emergency');
    } else {
      showToast(`Blood requisition created for ${newReq.patientName} (${newReq.bloodGroup})`, 'success');
    }

    try {
      await supabaseService.upsertBloodRequest(newReq);
    } catch (e) {
      console.warn('Supabase blood request sync:', e);
    }

    return newReq;
  }, [activeHospitalId, showToast]);

  // Blood Bank: Fulfill Blood Requisition & Deduct Stock
  const fulfillBloodRequest = useCallback(async (requestId) => {
    const req = bloodRequests.find((r) => r.id === requestId);
    if (!req) return;

    const units = req.unitsNeeded || 1;
    setBloodInventory((prev) => {
      return prev.map((item) => {
        if (item.hospitalId === req.hospitalId && item.bloodGroup === req.bloodGroup) {
          const compKey = req.component === 'Packed Red Blood Cells (PRBC)' ? 'prbc' :
                          req.component === 'Platelets Concentrate' ? 'platelets' :
                          req.component === 'Fresh Frozen Plasma (FFP)' ? 'ffp' : 'wholeBlood';
          const newComp = Math.max(0, (item[compKey] || 0) - units);
          const newTotal = Math.max(0, (item.totalUnits || 0) - units);
          const updated = {
            ...item,
            [compKey]: newComp,
            totalUnits: newTotal,
            status: newTotal <= 3 ? 'Critical' : newTotal < (item.minThreshold || 10) ? 'Low Stock' : 'Adequate',
            lastRestocked: new Date().toISOString(),
          };
          supabaseService.upsertBloodInventory(updated);
          return updated;
        }
        return item;
      });
    });

    const updatedReq = {
      ...req,
      status: 'Fulfilled',
      unitsDispatched: units,
      crossMatchStatus: 'Compatible & Transfused',
    };

    setBloodRequests((prev) => prev.map((r) => (r.id === requestId ? updatedReq : r)));
    showToast(`Blood requisition ${req.id} fulfilled! ${units} unit(s) of ${req.bloodGroup} dispatched`, 'success');

    try {
      await supabaseService.upsertBloodRequest(updatedReq);
    } catch (e) {
      console.warn('Supabase blood request fulfill sync:', e);
    }
  }, [bloodRequests, showToast]);

  // Blood Bank: Update Request Status
  const updateBloodRequestStatus = useCallback(async (requestId, status, crossMatchStatus) => {
    setBloodRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const updated = {
            ...r,
            status,
            ...(crossMatchStatus ? { crossMatchStatus } : {}),
          };
          supabaseService.upsertBloodRequest(updated);
          return updated;
        }
        return r;
      })
    );
    showToast(`Blood requisition status updated to ${status}`, 'info');
  }, [showToast]);

  // Blood Bank: Register Donation Drive / Camp
  const registerBloodCamp = useCallback(async (campData) => {
    const newCamp = {
      id: `CAMP-${Date.now().toString().slice(-4)}`,
      title: campData.title,
      organizer: campData.organizer,
      venue: campData.venue,
      date: campData.date,
      time: campData.time || '09:00 AM - 05:00 PM',
      targetUnits: Number(campData.targetUnits) || 100,
      registeredDonors: Number(campData.registeredDonors) || 0,
      hospitalId: campData.hospitalId || activeHospitalId,
      status: 'Upcoming',
      contactPerson: campData.contactPerson || '',
    };

    setBloodCamps((prev) => [newCamp, ...prev]);
    showToast(`Blood donation camp "${newCamp.title}" registered!`, 'success');

    try {
      await supabaseService.upsertBloodCamp(newCamp);
    } catch (e) {
      console.warn('Supabase camp sync:', e);
    }

    return newCamp;
  }, [activeHospitalId, showToast]);

  // Inter-Hospital Medicine Redistribution
  const transferMedicine = useCallback(async ({ fromHospitalId, toHospitalId, medicineName, quantity, reason }) => {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      showToast('Please enter a valid transfer quantity', 'error');
      return false;
    }

    const fromHosp = hospitals.find((h) => h.id === fromHospitalId);
    const toHosp = hospitals.find((h) => h.id === toHospitalId);

    // Check source medicine availability
    const sourceMed = medicines.find((m) => m.hospitalId === fromHospitalId && m.name === medicineName);
    if (!sourceMed || sourceMed.quantity < qty) {
      showToast(`Insufficient ${medicineName} at ${fromHosp?.name || 'source hospital'}`, 'error');
      return false;
    }

    let updatedSourceMed = null;
    let updatedDestMed = null;

    // Update inventories
    setMedicines((prev) => {
      // Deduct from source
      let updated = prev.map((m) => {
        if (m.id === sourceMed.id) {
          updatedSourceMed = { ...m, quantity: m.quantity - qty };
          return updatedSourceMed;
        }
        return m;
      });

      // Add to destination
      const destMed = updated.find((m) => m.hospitalId === toHospitalId && m.name === medicineName);
      if (destMed) {
        updated = updated.map((m) => {
          if (m.id === destMed.id) {
            updatedDestMed = { ...m, quantity: m.quantity + qty };
            return updatedDestMed;
          }
          return m;
        });
      } else {
        // Create medicine entry in target hospital
        updatedDestMed = {
          id: 'MED-' + Date.now(),
          name: sourceMed.name,
          dosageForm: sourceMed.dosageForm,
          category: sourceMed.category,
          batch: sourceMed.batch + '-TR',
          quantity: qty,
          minStock: sourceMed.minStock,
          expiry: sourceMed.expiry,
          hospitalId: toHospitalId,
          unitPrice: sourceMed.unitPrice,
        };
        updated.push(updatedDestMed);
      }
      return updated;
    });

    // Remote sync both medicines to Supabase
    if (updatedSourceMed) {
      await supabaseService.upsertMedicine(updatedSourceMed);
    }
    if (updatedDestMed) {
      await supabaseService.upsertMedicine(updatedDestMed);
    }

    // Add city alert notification
    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Medicine Redistribution Completed',
      message: `${qty} units of ${medicineName} transferred from ${fromHosp?.name} to ${toHosp?.name}. (${reason})`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: toHospitalId,
      link: '/pharmacy',
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast(`Successfully redistributed ${qty} units of ${medicineName}`, 'success');
    return true;
  }, [hospitals, medicines, showToast]);

  // Add Medicine directly to inventory
  const addMedicine = useCallback(async (medicineData) => {
    const assignedHospitalId = medicineData.hospitalId || currentUser?.hospitalId || activeHospitalId || 'HOSP-01';
    const newMed = {
      id: 'MED-' + Date.now(),
      name: medicineData.name,
      dosageForm: medicineData.dosageForm || 'Tablet',
      category: medicineData.category || 'General',
      batch: medicineData.batch || ('B' + Math.floor(1000 + Math.random() * 9000)),
      quantity: Number(medicineData.quantity) || 100,
      minStock: Number(medicineData.minStock) || 50,
      expiry: medicineData.expiry || '2027-12-31',
      hospitalId: assignedHospitalId,
      unitPrice: Number(medicineData.unitPrice) || 10.0,
    };

    setMedicines((prev) => [newMed, ...prev]);
    const { error } = await supabaseService.upsertMedicine(newMed);
    if (error) {
      showToast(`Supabase save error: ${error.message}`, 'error');
    } else {
      showToast(`Medicine "${newMed.name}" added to inventory`, 'success');
    }
    return newMed;
  }, [activeHospitalId, currentUser, showToast]);

  // Create Patient Referral
  const createReferral = useCallback(async (referralData) => {
    const fromHosp = hospitals.find((h) => h.id === referralData.fromHospital);
    const toHosp = hospitals.find((h) => h.id === referralData.toHospital);
    const patient = patients.find((p) => p.id === referralData.patientId);
    const authorDoc = referralData.doctor || (currentUser?.role === 'DOCTOR' ? currentUser.name : 'Referral Coordinator');
    const authorUser = currentUser?.name || 'Staff Coordinator';
    const authorId = currentUser?.id || 'STAFF-COORD';

    const newRef = {
      id: 'REF-2026-' + Math.floor(100 + Math.random() * 900),
      patientId: referralData.patientId,
      patientName: patient?.name || referralData.patientName,
      fromHospital: referralData.fromHospital,
      fromHospitalName: fromHosp?.name || 'Origin Facility',
      toHospital: referralData.toHospital,
      toHospitalName: toHosp?.name || 'Destination Facility',
      reason: referralData.reason,
      department: referralData.department || 'Emergency & Trauma',
      doctor: authorDoc,
      urgency: referralData.urgency || 'Urgent',
      status: 'Requested',
      timeline: [
        { status: 'Requested', time: formatTime(), note: `${referralData.reason} (Initiated by ${authorUser})`, actor: authorUser, userId: authorId },
      ],
      requestedAt: new Date().toISOString(),
    };

    setReferrals((prev) => [newRef, ...prev]);

    // Remote sync to Supabase
    const { error } = await supabaseService.insertReferral(newRef);
    if (error) {
      showToast(`Supabase Referral: ${error.message}`, 'error');
    }

    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'New Inter-Hospital Referral',
      message: `${newRef.patientName} referred to ${toHosp?.name} for ${newRef.department}.`,
      type: newRef.urgency === 'Critical' ? 'emergency' : 'info',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: toHosp?.id,
      link: '/city-grid',
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast('Digital Referral sent via City Grid', 'success');
  }, [currentUser, hospitals, patients, showToast]);

  // Update Referral Status
  const updateReferralStatus = useCallback(async (referralId, newStatus, note = '') => {
    let target = null;
    const authorUser = currentUser?.name || 'Staff';
    const authorId = currentUser?.id || 'STAFF-01';

    setReferrals((prev) =>
      prev.map((r) => {
        if (r.id !== referralId) return r;
        const timeline = [...(r.timeline || [])];
        timeline.push({
          status: newStatus,
          time: formatTime(),
          note: note || `Referral transitioned to ${newStatus} by ${authorUser}`,
          actor: authorUser,
          userId: authorId,
        });
        target = {
          ...r,
          status: newStatus,
          timeline,
        };
        return target;
      })
    );

    if (target) {
      const { error } = await supabaseService.updateReferral(referralId, {
        status: newStatus,
        timeline: target.timeline,
      });
      if (error) {
        showToast(`Supabase Referral Update: ${error.message}`, 'error');
      }
    }
    showToast(`Referral marked as ${newStatus}`, 'info');
  }, [currentUser, showToast]);

  // Add User to Administration User Directory
  const addUser = useCallback(async (userData) => {
    const res = await authService.createUser({
      ...userData,
      role: userData.assignedRole || userData.role,
    });
    if (!res.success) {
      showToast(res.error, 'error');
      return null;
    }
    setUsers((prev) => [res.user, ...prev.filter((u) => u.id !== res.user.id)]);

    showToast(`User ${res.user.name} created successfully`, 'success');
    return res.user;
  }, [showToast]);

  const deleteUser = useCallback(async (userId) => {
    await authService.deleteUser(userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    showToast('User removed from directory', 'info');
  }, [showToast]);

  const editUser = useCallback(async (userId, updates) => {
    const res = await authService.updateUser(userId, updates);
    if (res.success && res.user) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.user : u)));
      // If the edited user is currently logged in, update current session too
      setCurrentUser((prev) => {
        if (prev && prev.id === userId) {
          const updatedSession = {
            ...prev,
            ...res.user,
            role: res.user.assignedRole || res.user.role,
          };
          authService.saveSession(updatedSession);
          return updatedSession;
        }
        return prev;
      });

      showToast('User information updated', 'success');
      return res.user;
    }
    return null;
  }, [showToast]);

  // Add Ambulance Unit
  const addAmbulance = useCallback(async (ambData) => {
    const assignedHospitalId = ambData.hospitalId || currentUser?.hospitalId || activeHospitalId || 'HOSP-01';
    const assignedDriver = ambData.driver || (currentUser?.role === 'AMBULANCE' ? currentUser.name : 'Staff Driver');

    const newAmb = {
      id: 'AMB-' + Date.now(),
      code: ambData.code || ('KA-01-EQ-' + Math.floor(1000 + Math.random() * 9000)),
      driver: assignedDriver,
      contact: ambData.contact || '+91 98800 11223',
      hospitalId: assignedHospitalId,
      status: ambData.status || 'Available',
      priority: ambData.priority || 'Normal',
      currentLocation: ambData.currentLocation || 'Base Station',
      coordinates: ambData.coordinates || { lat: 12.9716, lng: 77.5946 },
      destination: null,
      assignedPatient: null,
      eta: 'Standby',
      speedKmH: 0,
      fuelLevel: '95%',
      equipment: ambData.equipment || ['Defibrillator', 'Oxygen Cylinder', 'Ventilator', 'First Aid Kit'],
    };

    setAmbulances((prev) => [newAmb, ...prev]);
    const { error } = await supabaseService.upsertAmbulance(newAmb);
    if (error) {
      showToast(`Supabase Ambulance Save: ${error.message}`, 'error');
    } else {
      showToast(`Ambulance ${newAmb.code} registered to fleet`, 'success');
    }
    return newAmb;
  }, [activeHospitalId, currentUser, showToast]);

  // Add Hospital Node (Admin)
  const addHospital = useCallback(async (hospitalData) => {
    const newHosp = {
      id: 'HOSP-' + String(hospitals.length + 1).padStart(2, '0'),
      name: hospitalData.name,
      code: (hospitalData.code || hospitalData.name.substring(0, 3)).toUpperCase() + '-NODE',
      location: hospitalData.location || 'Bengaluru Urban',
      coordinates: {
        lat: 12.9716 + (Math.random() - 0.5) * 0.1,
        lng: 77.5946 + (Math.random() - 0.5) * 0.1,
      },
      contact: hospitalData.contact || '+91 80 4000 0000',
      totalBeds: Number(hospitalData.totalBeds) || 100,
      icuBeds: Number(hospitalData.icuBeds) || 15,
      emergencyCapacity: Number(hospitalData.emergencyCapacity) || 12,
      departments: hospitalData.departments || ['General Medicine', 'Emergency', 'Pediatrics'],
      status: 'Normal',
      established: new Date().getFullYear(),
      rating: 4.8,
    };

    setHospitals((prev) => [...prev, newHosp]);
    // Remote sync to Supabase
    const { error } = await supabaseService.upsertHospital(newHosp);
    if (error) {
      showToast(`Supabase Hospital Save: ${error.message}`, 'error');
    }

    // Generate seed beds for new hospital
    const generatedBeds = [];
    for (let i = 1; i <= Math.min(newHosp.icuBeds, 4); i++) {
      generatedBeds.push({
        id: `BED-${newHosp.id}-ICU-${i}`,
        hospitalId: newHosp.id,
        bedNumber: `ICU-${i}`,
        ward: 'ICU',
        floor: 2,
        bedType: 'Ventilator Equipped',
        status: 'Available',
        patientId: null,
      });
    }
    for (let i = 1; i <= 6; i++) {
      generatedBeds.push({
        id: `BED-${newHosp.id}-GEN-${i}`,
        hospitalId: newHosp.id,
        bedNumber: `GEN-${i}`,
        ward: 'General',
        floor: 1,
        bedType: 'Standard',
        status: 'Available',
        patientId: null,
      });
    }
    setBeds((prev) => [...prev, ...generatedBeds]);

    // Upsert generated beds in Supabase
    for (const b of generatedBeds) {
      await supabaseService.upsertBed(b);
    }

    showToast(`Hospital node "${newHosp.name}" added to City Grid!`, 'success');
    return newHosp;
  }, [hospitals, showToast]);

  // Derived Metrics for a specific Hospital
  const getHospitalMetrics = useCallback((hospId) => {
    const hosp = hospitals.find((h) => h.id === hospId) || hospitals[0] || {};
    const hospPatients = patients.filter((p) => p.hospitalId === hospId);
    const waitingList = hospPatients.filter((p) => p.status === 'Waiting' || p.status === 'Registered');
    const emergencyList = hospPatients.filter(
      (p) => p.priority === 'Emergency' || p.status === 'Emergency'
    );
    const hospBeds = beds.filter((b) => b.hospitalId === hospId);
    
    // If specific bed objects are fewer than totalBeds, scale accurately
    const totalBedsCount = hosp.totalBeds || 150;
    const icuBedsCount = hosp.icuBeds || 25;
    const occupiedBedsInSample = hospBeds.filter((b) => b.status === 'Occupied' || b.status === 'Reserved').length;
    const sampleSize = hospBeds.length || 1;
    const occupancyRatio = hospBeds.length > 0 ? occupiedBedsInSample / sampleSize : 0.45;
    
    const occupiedBedsTotal = Math.round(totalBedsCount * occupancyRatio);
    const availableBeds = Math.max(0, totalBedsCount - occupiedBedsTotal);
    
    const icuBedsInSample = hospBeds.filter((b) => b.ward === 'ICU');
    const occupiedIcuInSample = icuBedsInSample.filter((b) => b.status === 'Occupied').length;
    const icuRatio = icuBedsInSample.length > 0 ? (occupiedIcuInSample / icuBedsInSample.length) : 0.6;
    const icuOccupancy = Math.round(icuRatio * 100);

    // Dynamic Average OPD wait in minutes based on waiting queue size
    const avgWait = Math.max(8, Math.round(waitingList.length * 7.5));

    return {
      hospital: hosp,
      patientsToday: hospPatients.length + 18, // includes earlier finished visits
      registeredPatients: hospPatients.length,
      waitingPatients: waitingList.length,
      emergencyPatients: emergencyList.length,
      averageWait: avgWait,
      icuOccupancy: icuOccupancy,
      availableBeds: availableBeds,
      totalBeds: totalBedsCount,
      icuBeds: icuBedsCount,
    };
  }, [beds, hospitals, patients]);

  // Derived City-wide Metrics
  const cityMetrics = useMemo(() => {
    const totalHospitals = hospitals.length;
    const totalPatients = patients.length + 140; // aggregated across city nodes
    const emergencyPatients = patients.filter((p) => p.priority === 'Emergency' || p.status === 'Emergency').length + 14;
    
    let totalBeds = 0;
    let totalIcuBeds = 0;
    hospitals.forEach((h) => {
      totalBeds += h.totalBeds || 150;
      totalIcuBeds += h.icuBeds || 25;
    });

    const activeAmbulancesCount = ambulances.filter((a) => a.status === 'On Duty' || a.status === 'On Call').length;
    const activeReferralsCount = referrals.filter((r) => r.status === 'Requested' || r.status === 'Accepted' || r.status === 'In Transit').length;

    // Medicine shortages count
    const shortagesCount = medicines.filter((m) => m.quantity < m.minStock).length;

    return {
      totalHospitals,
      totalPatients,
      emergencyCases: emergencyPatients,
      totalBeds,
      availableBeds: Math.round(totalBeds * 0.38),
      icuBedsAvailable: Math.round(totalIcuBeds * 0.24),
      ambulancesActive: activeAmbulancesCount,
      referralCount: activeReferralsCount,
      medicineShortages: shortagesCount,
      hospitalLoad: emergencyMode ? 94 : 76,
    };
  }, [ambulances, emergencyMode, hospitals, medicines, patients, referrals]);

  // Diagnostic Reports Upload
  const uploadReport = useCallback(async (patientId, reportData) => {
    const reportId = 'REP-' + Date.now();
    const newReport = {
      id: reportId,
      patientId,
      testName: reportData.reportName || reportData.testName || 'Diagnostic Report',
      department: reportData.testType || reportData.department || 'General Diagnostics',
      orderedBy: reportData.doctor || 'Dr. Priya Nair',
      hospitalId: reportData.hospitalId || activeHospitalId || 'HOSP-01',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      timestamp: new Date().toISOString(),
      status: reportData.status || 'Available',
      critical: Boolean(reportData.critical),
      normalRange: reportData.normalRange || 'Verified Clinical Findings',
      findings: reportData.findings || `Clinical parameter values recorded for ${reportData.reportName || reportData.testName}. Verified authentic report.`,
      labTech: reportData.uploadedBy || currentUser?.name || 'Authorized Lab Specialist',
      fileName: reportData.fileName || 'Report.pdf',
      fileUrl: reportData.fileUrl || null,
    };

    let targetPatientName = 'Patient';
    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id !== patientId) return pat;
        targetPatientName = pat.name;
        const currentReports = pat.reports || [];
        const journey = [...(pat.journey || [])];
        journey.push({
          stage: 'Report Uploaded',
          time: formatTime(),
          note: `Report "${newReport.testName}" (${newReport.fileName}) uploaded by ${newReport.labTech}`,
          actor: newReport.labTech,
        });
        return {
          ...pat,
          reports: [newReport, ...currentReports],
          journey,
        };
      })
    );

    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Diagnostic Report Uploaded',
      message: `${newReport.testName} (${newReport.fileName}) successfully uploaded for ${targetPatientName}.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: newReport.hospitalId,
      link: '/patient-portal',
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast(`Report "${newReport.fileName}" uploaded successfully`, 'success');
    return newReport;
  }, [activeHospitalId, currentUser, showToast]);

  // Bed Reservations
  const requestBedReservation = useCallback((formData) => {
    const resId = 'RES-' + Math.floor(1000 + Math.random() * 9000);
    const targetHosp = hospitals.find((h) => h.id === formData.hospitalId) || hospitals[0];
    const newReservation = {
      id: resId,
      patientId: formData.patientId || currentUser?.id || ('PAT-' + Date.now()),
      patientName: formData.patientName || currentUser?.name || 'Patient',
      mobile: formData.mobile || currentUser?.mobile || '',
      hospitalId: formData.hospitalId || activeHospitalId || 'HOSP-01',
      hospitalName: targetHosp?.name || 'Arogya Hospital',
      ward: formData.ward || 'ICU',
      bedType: formData.bedType || `${formData.ward || 'ICU'} Bed`,
      isEmergency: Boolean(formData.isEmergency),
      reason: formData.reason || (formData.isEmergency ? 'Urgent emergency admission request' : 'Inpatient bed reservation'),
      status: 'Pending',
      requestedAt: new Date().toISOString(),
      bedId: null,
      bedNumber: null,
      assignedStaff: null,
    };

    setBedReservations((prev) => [newReservation, ...prev]);

    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: newReservation.isEmergency ? '🚨 Emergency Bed Request' : 'New Bed Reservation Request',
      message: `${newReservation.patientName} requested ${newReservation.ward} bed at ${newReservation.hospitalName}.${newReservation.isEmergency ? ' Urgent admission required.' : ''}`,
      type: newReservation.isEmergency ? 'emergency' : 'info',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: newReservation.hospitalId,
      link: '/hospital-os',
    };
    setNotifications((prev) => [notif, ...prev]);

    // Real approval queue row - approving it blocks one free bed.
    pushSupabaseApproval('bed', {
      patient_name: newReservation.patientName,
      bed_type: formData.bedType || newReservation.bedType,
      // beds.hospitalId holds an ID, so the queue must carry the ID - not the display name
      hospital: formData.hospitalId || newReservation.hospitalId || newReservation.hospitalName,
    });


    showToast(
      newReservation.isEmergency
        ? `Emergency Bed Request submitted! Staff alerted immediately.`
        : `Bed reservation request submitted. Status: Pending.`,
      newReservation.isEmergency ? 'warning' : 'success'
    );
    return newReservation;
  }, [activeHospitalId, currentUser, hospitals, showToast, pushSupabaseApproval]);



  const bookAppointment = useCallback((formData) => {
    const aptId = 'APT-' + Math.floor(1000 + Math.random() * 9000);
    const newAppointment = {
      id: aptId,
      patientName: formData.patientName || currentUser?.name || 'Walk-in Patient',
      mobile: formData.mobile || currentUser?.mobile || '',
      email: formData.email || currentUser?.email || '',
      age: Number(formData.age) || 30,
      gender: formData.gender || 'Other',
      hospitalId: formData.hospitalId || activeHospitalId || 'HOSP-01',
      department: formData.department || 'General Medicine',
      doctor: formData.doctor || 'Dr. Priya Nair',
      date: formData.date || new Date().toISOString().split('T')[0],
      timeSlot: formData.timeSlot || '10:00 AM',
      status: 'Confirmed',
      symptoms: formData.symptoms || 'Scheduled consultation',
      createdAt: new Date().toISOString(),
    };
    setAppointments((prev) => [newAppointment, ...prev]);

    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Appointment Booked',
      message: `Appointment ${aptId} confirmed with ${newAppointment.doctor} for ${newAppointment.date} at ${newAppointment.timeSlot}.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: newAppointment.hospitalId,
      link: '/patient-portal',
    };
    setNotifications((prev) => [notif, ...prev]);
    // Real approval queue row - the receptionist approves this.
    pushSupabaseApproval('appointment', {
      patient_name: newAppointment.patientName,
      doctor: newAppointment.doctor,
      date_time: (() => {
        // combine the chosen date + slot when both are present
        if (formData.date && formData.timeSlot) {
          const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(formData.timeSlot);
          if (m) {
            let hh = Number(m[1]) % 12;
            if (/pm/i.test(m[3])) hh += 12;
            const d = new Date(formData.date);
            d.setHours(hh, Number(m[2]), 0, 0);
            return d.toISOString();
          }
        }
        return new Date().toISOString();
      })(),
    });

    showToast(`Appointment ${aptId} booked successfully!`, 'success');
    return newAppointment;
  }, [activeHospitalId, currentUser, showToast, pushSupabaseApproval]);

  const approveBedReservation = useCallback(async (reservationId, specificBedId = null) => {
    const reservation = bedReservations.find((r) => r.id === reservationId);
    if (!reservation) {
      showToast('Reservation record not found', 'error');
      return null;
    }

    let targetBed = null;
    if (specificBedId) {
      targetBed = beds.find((b) => b.id === specificBedId && b.status === 'Available');
    }
    if (!targetBed) {
      targetBed = beds.find(
        (b) =>
          b.hospitalId === reservation.hospitalId &&
          b.ward === reservation.ward &&
          b.status === 'Available'
      );
    }
    if (!targetBed) {
      targetBed = beds.find(
        (b) => b.hospitalId === reservation.hospitalId && b.status === 'Available'
      );
    }

    if (!targetBed) {
      showToast(`No available bed currently in ${reservation.ward} ward for this facility.`, 'error');
      return null;
    }

    const staffAuthor = currentUser?.name || 'Admissions Coordinator';

    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== targetBed.id) return b;
        return {
          ...b,
          status: 'Reserved',
          patientId: reservation.patientId,
          patientName: reservation.patientName,
          patientCondition: reservation.isEmergency ? 'Critical' : 'Stable',
          assignedAt: new Date().toISOString(),
        };
      })
    );

    let updatedRes = null;
    setBedReservations((prev) =>
      prev.map((r) => {
        if (r.id !== reservationId) return r;
        updatedRes = {
          ...r,
          status: 'Reserved',
          bedId: targetBed.id,
          bedNumber: targetBed.bedNumber,
          approvedAt: new Date().toISOString(),
          assignedStaff: staffAuthor,
        };
        return updatedRes;
      })
    );

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== reservation.patientId) return p;
        const journey = [...(p.journey || [])];
        journey.push({
          stage: 'Bed Reserved',
          time: formatTime(),
          note: `Bed ${targetBed.bedNumber} (${targetBed.ward} Ward) reserved by ${staffAuthor}`,
          actor: staffAuthor,
        });
        return {
          ...p,
          bedNumber: targetBed.bedNumber,
          ward: targetBed.ward,
          journey,
        };
      })
    );

    await supabaseService.updateBed(targetBed.id, {
      status: 'Reserved',
      patientId: reservation.patientId,
      patientName: reservation.patientName,
      patientCondition: reservation.isEmergency ? 'Critical' : 'Stable',
      assignedAt: new Date().toISOString(),
    });

    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Bed Reservation Approved!',
      message: `Your reservation at ${reservation.hospitalName} is confirmed. Bed #${targetBed.bedNumber} (${targetBed.ward} Ward) has been reserved.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: reservation.hospitalId,
      link: '/patient-portal',
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast(`Bed #${targetBed.bedNumber} marked as Reserved for ${reservation.patientName}`, 'success');
    return updatedRes;
  }, [bedReservations, beds, currentUser, showToast]);

  const rejectBedReservation = useCallback((reservationId, reason = 'No beds currently available in requested ward') => {
    const reservation = bedReservations.find((r) => r.id === reservationId);
    if (!reservation) return;

    if (reservation.bedId) {
      setBeds((prev) =>
        prev.map((b) => {
          if (b.id !== reservation.bedId) return b;
          return {
            ...b,
            status: 'Available',
            patientId: null,
            patientName: null,
            patientCondition: null,
            assignedAt: null,
          };
        })
      );
      supabaseService.updateBed(reservation.bedId, {
        status: 'Available',
        patientId: null,
        patientName: null,
        patientCondition: null,
        assignedAt: null,
      });
    }

    setBedReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? { ...r, status: 'Rejected', rejectionReason: reason, rejectedAt: new Date().toISOString() }
          : r
      )
    );

    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Bed Reservation Update',
      message: `Reservation request ${reservationId} could not be approved. Reason: ${reason}`,
      type: 'warning',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: reservation.hospitalId,
      link: '/patient-portal',
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast(`Reservation ${reservationId} rejected`, 'info');
  }, [bedReservations, showToast]);

  const cancelBedReservation = useCallback((reservationId) => {
    const reservation = bedReservations.find((r) => r.id === reservationId);
    if (!reservation) return;

    if (reservation.bedId) {
      setBeds((prev) =>
        prev.map((b) => {
          if (b.id !== reservation.bedId) return b;
          return {
            ...b,
            status: 'Available',
            patientId: null,
            patientName: null,
            patientCondition: null,
            assignedAt: null,
          };
        })
      );
      supabaseService.updateBed(reservation.bedId, {
        status: 'Available',
        patientId: null,
        patientName: null,
        patientCondition: null,
        assignedAt: null,
      });
    }

    setBedReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? { ...r, status: 'Cancelled', cancelledAt: new Date().toISOString() }
          : r
      )
    );

    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Bed Reservation Cancelled',
      message: `Bed reservation request ${reservationId} has been cancelled.`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: reservation.hospitalId,
      link: '/patient-portal',
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast(`Reservation ${reservationId} cancelled. Bed released to Available.`, 'info');
  }, [bedReservations, showToast]);

  const admitReservedBed = useCallback(async (reservationId) => {
    const res = bedReservations.find((r) => r.id === reservationId);
    if (!res || !res.bedId) {
      showToast('Valid reserved bed not found', 'error');
      return;
    }
    await assignBed(res.bedId, res.patientId, res.isEmergency ? 'Critical' : 'Stable');
    setBedReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'Admitted', admittedAt: new Date().toISOString() } : r))
    );
    showToast(`Patient successfully admitted to bed ${res.bedNumber}`, 'success');
  }, [assignBed, bedReservations, showToast]);

  // Ambulance Requests
  const requestAmbulance = useCallback((reqData) => {
    const reqId = 'AMB-REQ-' + Math.floor(1000 + Math.random() * 9000);
    const targetHosp = hospitals.find((h) => h.id === reqData.destinationHospitalId) || hospitals[0];
    const newRequest = {
      requestId: reqId,
      patientId: reqData.patientId || currentUser?.id || ('PAT-' + Date.now()),
      patientName: reqData.patientName || currentUser?.name || 'Emergency Patient',
      mobile: reqData.mobile || currentUser?.mobile || '',
      pickupLocation: reqData.pickupLocation || 'Current Patient Location',
      destination: targetHosp?.name || reqData.destination || 'Arogya Central Hospital Trauma Bay',
      destinationHospitalId: targetHosp?.id || 'HOSP-01',
      emergencyType: reqData.emergencyType || 'Medical Emergency',
      notes: reqData.notes || '',
      requestedAt: new Date().toISOString(),
      status: 'Pending',
      ambulanceId: null,
      ambulanceCode: null,
      driverName: null,
      driverContact: null,
      eta: 'Awaiting Driver Assignment',
    };

    setAmbulanceRequests((prev) => [newRequest, ...prev]);

    const patientNotif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Ambulance Request Submitted',
      message: 'Ambulance request submitted. Searching for nearest emergency unit.',
      type: 'emergency',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: newRequest.destinationHospitalId,
      link: '/patient-portal',
    };
    const driverNotif = {
      id: 'NOTIF-' + (Date.now() + 1),
      title: '🚨 New Emergency Ambulance Request',
      message: `New emergency call from ${newRequest.patientName} (${newRequest.emergencyType}) at ${newRequest.pickupLocation}.`,
      type: 'emergency',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: newRequest.destinationHospitalId,
      link: '/ambulance',
    };
    setNotifications((prev) => [driverNotif, patientNotif, ...prev]);

    // Real approval queue row - the front desk dispatches the unit.
    pushSupabaseApproval('ambulance', {
      patient_name: newRequest.patientName,
      pickup_location: reqData.pickupLocation || newRequest.pickupLocation,
    });



    showToast(`Emergency Ambulance requested! Units alerted.`, 'warning');
    return newRequest;
  }, [currentUser, hospitals, showToast, pushSupabaseApproval]);

  const acceptAmbulanceRequest = useCallback((requestId, specificAmbulanceId = null) => {
    const req = ambulanceRequests.find((r) => r.requestId === requestId);
    if (!req) {
      showToast('Ambulance request not found', 'error');
      return null;
    }

    let amb = null;
    if (specificAmbulanceId) {
      amb = ambulances.find((a) => a.id === specificAmbulanceId && a.status === 'Available');
    }
    if (!amb) {
      amb = ambulances.find((a) => a.status === 'Available');
    }
    if (!amb) {
      amb = ambulances.find((a) => a.status !== 'On Duty') || ambulances[0];
    }

    if (!amb) {
      showToast('No fleet vehicle available for dispatch', 'error');
      return null;
    }

    setAmbulances((prev) =>
      prev.map((a) => {
        if (a.id !== amb.id) return a;
        return {
          ...a,
          status: 'On Duty',
          assignedPatient: `${req.patientName} (${req.emergencyType})`,
          destination: req.destination,
          eta: '8 mins',
          currentLocation: req.pickupLocation ? `Dispatched to ${req.pickupLocation}` : 'Dispatched',
        };
      })
    );

    let updatedReq = null;
    setAmbulanceRequests((prev) =>
      prev.map((r) => {
        if (r.requestId !== requestId) return r;
        updatedReq = {
          ...r,
          status: 'Accepted',
          ambulanceId: amb.id,
          ambulanceCode: amb.code,
          driverName: amb.driver,
          driverContact: amb.contact,
          eta: '8 mins',
          acceptedAt: new Date().toISOString(),
        };
        return updatedReq;
      })
    );

    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Ambulance Accepted',
      message: `Ambulance accepted. Driver ${amb.driver} (${amb.code}) is en route to ${req.pickupLocation}. Contact: ${amb.contact}.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: req.destinationHospitalId,
      link: '/patient-portal',
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast(`Request accepted! Ambulance ${amb.code} dispatched.`, 'success');
    return updatedReq;
  }, [ambulanceRequests, ambulances, showToast]);

  const updateAmbulanceRequestStatus = useCallback((requestId, newStatus) => {
    const req = ambulanceRequests.find((r) => r.requestId === requestId);
    if (!req) return;

    let patientMessage = '';
    switch (newStatus) {
      case 'Driver En Route':
        patientMessage = 'Driver is on the way.';
        break;
      case 'Arrived at Pickup':
        patientMessage = 'Ambulance has arrived.';
        break;
      case 'Patient Picked Up':
        patientMessage = 'Patient picked up.';
        break;
      case 'En Route to Hospital':
        patientMessage = `En route to destination hospital: ${req.destination}.`;
        break;
      case 'Arrived at Hospital':
        patientMessage = 'Arrived at destination.';
        break;
      case 'Completed':
        patientMessage = 'Ambulance trip completed successfully.';
        break;
      default:
        patientMessage = `Ambulance status updated to "${newStatus}".`;
    }

    if (newStatus === 'Completed' && req.ambulanceId) {
      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.id !== req.ambulanceId) return a;
          return {
            ...a,
            status: 'Available',
            assignedPatient: null,
            destination: 'Standby at Base',
            eta: 'Immediate',
            currentLocation: `${req.destination} Base`,
          };
        })
      );
    }

    setAmbulanceRequests((prev) =>
      prev.map((r) => {
        if (r.requestId !== requestId) return r;
        return {
          ...r,
          status: newStatus,
          lastUpdatedAt: new Date().toISOString(),
          eta:
            newStatus === 'Driver En Route'
              ? '5 mins'
              : newStatus === 'Arrived at Pickup'
              ? 'At Location'
              : newStatus === 'Patient Picked Up' || newStatus === 'En Route to Hospital'
              ? 'Transit to Hosp (7 mins)'
              : newStatus === 'Arrived at Hospital'
              ? 'Arrived'
              : 'Standby',
        };
      })
    );

    const notif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Ambulance Telemetry Update',
      message: patientMessage,
      type: newStatus === 'Completed' ? 'success' : 'info',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: req.destinationHospitalId,
      link: '/patient-portal',
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast(patientMessage, 'info');
  }, [ambulanceRequests, showToast]);

  const cancelAmbulanceRequest = useCallback((requestId) => {
    const req = ambulanceRequests.find((r) => r.requestId === requestId);
    if (!req) return;

    if (req.ambulanceId) {
      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.id !== req.ambulanceId) return a;
          return {
            ...a,
            status: 'Available',
            assignedPatient: null,
            destination: 'Standby at Base',
            eta: 'Immediate',
          };
        })
      );
    }

    setAmbulanceRequests((prev) =>
      prev.map((r) =>
        r.requestId === requestId
          ? { ...r, status: 'Cancelled', cancelledAt: new Date().toISOString() }
          : r
      )
    );

    const patientNotif = {
      id: 'NOTIF-' + Date.now(),
      title: 'Ambulance Request Cancelled',
      message: 'Ambulance request cancelled.',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: req.destinationHospitalId,
      link: '/patient-portal',
    };
    const driverNotif = {
      id: 'NOTIF-' + (Date.now() + 1),
      title: 'Ambulance Request Cancelled',
      message: `Request cancelled for ${req.patientName}.`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      hospitalId: req.destinationHospitalId,
      link: '/ambulance',
    };
    setNotifications((prev) => [driverNotif, patientNotif, ...prev]);

    showToast('Ambulance request cancelled', 'info');
  }, [ambulanceRequests, showToast]);

  const value = {
    // Theme
    theme,
    toggleTheme,

    // Auth
    currentUser,
    login,
    registerUser,
    loginPatientWithOtp,
    logout,

    // Hospitals
    hospitals,
    activeHospitalId,
    setActiveHospitalId,
    addHospital,
    getHospitalMetrics,

    // Patients & Queue
    patients,
    registerPatient,
    updatePatientStatus,
    updatePatientClinical,
    addLabRequest,
    removeLabRequest,
    updateLabTestStatus,
    addPrescription,
    uploadReport,

    // Beds & Hospital OS
    beds,
    assignBed,
    releaseBed,
    admissions,
    discharges,
    dischargePatient,
    payments,
    recordPayment,
    bedReservations,
    requestBedReservation,
    approveBedReservation,
    rejectBedReservation,
    cancelBedReservation,
    admitReservedBed,

    // Blood Bank & Donors
    bloodInventory,
    bloodDonors,
    bloodRequests,
    bloodCamps,
    registerBloodDonor,
    updateBloodDonor,
    deleteBloodDonor,
    recordDonation,
    updateBloodStock,
    createBloodRequest,
    fulfillBloodRequest,
    updateBloodRequestStatus,
    registerBloodCamp,

    // Pharmacy
  medicines,
  setMedicines,
    transferMedicine,
    addMedicine,

    // City Grid & Emergency
    cityMetrics,
    referrals,
    createReferral,
    updateReferralStatus,
    emergencyMode,
    setEmergencyMode,

    // Ambulances
    ambulances,
    ambulanceEmployees,
    addAmbulance,
    ambulanceRequests,
    requestAmbulance,
    acceptAmbulanceRequest,
    updateAmbulanceRequestStatus,
    cancelAmbulanceRequest,

    // Administration
    users,
    addUser,
    editUser,
    deleteUser,

    // Appointments & Booking
    appointments,
    bookAppointment,
    cancelAppointment,
    checkInAppointment,

    // Smart Queue
    calculateQueueEta,

    // Feedbacks & Ratings
    feedbacks,
    submitFeedback,

    // Support Tickets
    supportTickets,
    submitSupportTicket,

    // Notifications & Toasts
    notifications,
    setNotifications,
    toasts,
    showToast,
    removeToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useHealthcare() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useHealthcare must be used within an AppProvider');
  }
  return context;
}