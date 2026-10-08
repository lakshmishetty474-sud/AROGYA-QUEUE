import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES } from '../utils/roleDetector';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';
import { Auth } from '../pages/Auth';
import { Overview } from '../pages/Overview';
import { PatientFlow } from '../pages/PatientFlow';
import { DoctorDesk } from '../pages/DoctorDesk';
import { HospitalOS } from '../pages/HospitalOS';
import { Pharmacy } from '../pages/Pharmacy';
import { CityGrid } from '../pages/CityGrid';
import { AmbulancePortal } from '../pages/AmbulancePortal';
import { AdvancedAI } from '../pages/AdvancedAI';
import { Administration } from '../pages/Administration';
import { PatientPortal } from '../pages/PatientPortal';
import { Profile } from '../pages/Profile';
import { Settings } from '../pages/Settings';
import { NotFound } from '../pages/NotFound';
import { QueueDisplay } from '../pages/QueueDisplay';
import { LabTechnician } from '../pages/LabTechnician';
import { ReceptionistVerification } from '../pages/ReceptionistVerification';
import { BloodBank } from '../pages/BloodBank';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth & TV Display Routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/display" element={<QueueDisplay />} />

      {/* Role-Specific Direct Aliases */}
      <Route path="/admin" element={<Navigate to="/overview" replace />} />
      <Route path="/hospital" element={<Navigate to="/overview" replace />} />
      <Route path="/doctor" element={<Navigate to="/doctor-desk" replace />} />
      <Route path="/nurse" element={<Navigate to="/overview" replace />} />
      <Route path="/pharmacist" element={<Navigate to="/pharmacy" replace />} />
      <Route path="/patient" element={<Navigate to="/patient-portal" replace />} />

      {/* Protected Healthcare Application Layout Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect based on role or to overview */}
        <Route index element={<Navigate to="/overview" replace />} />

        {/* Overview Module */}
        <Route
          path="overview"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
                ROLES.NURSE,
              ]}
            >
              <Overview />
            </ProtectedRoute>
          }
        />

        {/* Laboratory Module - restricted to lab / radiology roles */}
        <Route
          path="labtech"
          element={
            <ProtectedRoute allowedRoles={[ROLES.LAB_TECH, ROLES.RADIOLOGIST]}>
              <LabTechnician />
            </ProtectedRoute>
          }
        />

        {/* Receptionist Verification Desk */}
        <Route
          path="receptionist"
          element={
            <ProtectedRoute allowedRoles={[ROLES.RECEPTIONIST]}>
              <ReceptionistVerification />
            </ProtectedRoute>
          }
        />
        {/* Patient Flow Module */}
        <Route
          path="patient-flow"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
                ROLES.DOCTOR,
                ROLES.NURSE,
                ROLES.RECEPTIONIST,
                ROLES.LAB_TECH,
              ]}
            >
              <PatientFlow />
            </ProtectedRoute>
          }
        />

        {/* Doctor Desk Module */}
        <Route
          path="doctor-desk"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.DOCTOR,
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
              ]}
            >
              <DoctorDesk />
            </ProtectedRoute>
          }
        />

        {/* Hospital OS Module */}
        <Route
          path="hospital-os"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
                ROLES.NURSE,
                ROLES.RECEPTIONIST,
              ]}
            >
              <HospitalOS />
            </ProtectedRoute>
          }
        />

        {/* Blood Bank & Donor Section (Admin, Doctor, Receptionist Only) */}
        <Route
          path="blood-bank"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.SUPER_ADMIN,
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
                ROLES.DOCTOR,
                ROLES.SURGEON,
                ROLES.RECEPTIONIST,
              ]}
            >
              <BloodBank />
            </ProtectedRoute>
          }
        />

        {/* Pharmacy Module */}
        <Route
          path="pharmacy"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
                ROLES.NURSE,
                ROLES.PHARMACIST,
              ]}
            >
              <Pharmacy />
            </ProtectedRoute>
          }
        />

        {/* Arogya City Grid Module */}
        <Route
          path="city-grid"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
                ROLES.DOCTOR,
                ROLES.NURSE,
              ]}
            >
              <CityGrid />
            </ProtectedRoute>
          }
        />

        {/* Ambulance Fleet & Tracking */}
        <Route
          path="ambulance"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.AMBULANCE,
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
              ]}
            >
              <AmbulancePortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="ambulance-tracking"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.AMBULANCE,
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
              ]}
            >
              <AmbulancePortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="ambulance-employees"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.AMBULANCE,
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
              ]}
            >
              <AmbulancePortal />
            </ProtectedRoute>
          }
        />

        {/* Advanced AI Insights */}
        <Route
          path="ai"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
                ROLES.DOCTOR,
                ROLES.NURSE,
                ROLES.LAB_TECH,
                ROLES.PATIENT,
              ]}
            >
              <AdvancedAI />
            </ProtectedRoute>
          }
        />

        {/* Administration Module */}
        <Route
          path="administration"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
                ROLES.DOCTOR,
                ROLES.NURSE,
                ROLES.PHARMACIST,
                ROLES.RECEPTIONIST,
                ROLES.LAB_TECH,
                ROLES.AMBULANCE,
              ]}
            >
              <Administration />
            </ProtectedRoute>
          }
        />

        {/* Patient Portal Module */}
        <Route
          path="patient-portal"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.PATIENT,
                ROLES.ADMIN,
                ROLES.HOSPITAL_ADMIN,
              ]}
            >
              <PatientPortal />
            </ProtectedRoute>
          }
        />

        {/* User Profile */}
        <Route path="profile" element={<Profile />} />

        {/* System Settings */}
        <Route path="settings" element={<Settings />} />

        {/* 404 in layout */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Global 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
