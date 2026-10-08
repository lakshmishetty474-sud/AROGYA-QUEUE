import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  Building2,
  HeartPulse,
  Pill,
  UserCheck,
  FlaskConical,
  Ambulance,
  User,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  BadgeCheck,
  Sun,
  Moon,
  Network,
  Cpu,
  ScanFace,
  Camera,
} from 'lucide-react';

import { useHealthcare } from '../context/AppContext';
import { authService } from '../services/authService';
import { otpService } from '../services/otpService';
import { ROLE_DETAILS, ROLES } from '../utils/roleDetector';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { RoleBadge } from '../components/ui/RoleBadge';
import { BiometricFaceLoginModal } from '../components/modules/BiometricFaceLoginModal';
import { LoginShell } from '../components/auth/LoginShell';

export function Auth() {
  const {
    login,
    registerUser,
    loginPatientWithOtp,
    currentUser,
    users,
    hospitals,
    showToast,
    theme,
    toggleTheme,
  } = useHealthcare();
  const navigate = useNavigate();

  // If already logged in, redirect to respective default route
  useEffect(() => {
    if (currentUser && currentUser.role) {
      const details = ROLE_DETAILS[currentUser.role];
      navigate(details?.defaultRoute || '/overview');
    }
  }, [currentUser, navigate]);

  // Tab mode: 'staff' | 'patient'
  const [authMode, setAuthMode] = useState('staff');
  const [isRegister, setIsRegister] = useState(false);

  // Registration success banner state
  const [registeredSuccessUser, setRegisteredSuccessUser] = useState(null);

  // Facial Biometric Login Modal State
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [faceModalRole, setFaceModalRole] = useState('DOCTOR');

  // Staff Login Form state
  const [email, setEmail] = useState('doctor@gmail.com');
  const [password, setPassword] = useState('arogya2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Registration Form additional fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState(ROLES.DOCTOR);
  const [regHospital, setRegHospital] = useState(hospitals[0]?.name || 'Bengaluru Central Hospital');
  const [regEmployeeId, setRegEmployeeId] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Dynamic Role Detection as user types email with 3-tier Role Priority:
  // 1. Registered User (Authoritative role from user store)
  // 2. Demo Email Pattern
  // 3. Unknown Account
  const targetEmailForDetection = isRegister ? regEmail : email;
  const detectedPortal = authService.detectPortal(targetEmailForDetection, users);

  // Patient OTP Mode state
  const [patientName, setPatientName] = useState('');
  const [patientMobile, setPatientMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMode, setOtpMode] = useState('demo'); // 'demo' or 'production'
  const [otpProvider, setOtpProvider] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(30);
  const [otpError, setOtpError] = useState('');

  // OTP Countdown timer
  useEffect(() => {
    let timer;
    if (otpSent && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpCountdown]);

  // Form Validation for Staff Login
  const validateLoginForm = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email format.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form Validation for New User Registration
  const validateRegisterForm = () => {
    const errs = {};
    if (!regName.trim()) {
      errs.name = 'Full name is required.';
    }

    if (!regEmail.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      errs.email = 'Please enter a valid email format.';
    } else {
      // Duplicate email check
      const existing = authService.getUserByEmail(regEmail);
      if (existing) {
        errs.email = 'An account with this email already exists.';
      }
    }

    if (!regMobile.trim() || !/^\d{10}$/.test(regMobile.trim())) {
      errs.mobile = 'Enter a valid 10-digit mobile number.';
    }

    if (!regPassword) {
      errs.password = 'Password is required.';
    } else if (regPassword.length < 6) {
      errs.password = 'Password must contain at least 6 characters.';
    }

    if (regPassword !== regConfirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Staff Login Submit with Supabase Auth
  const handleStaffLogin = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await login(email, password);
      setLoading(false);
      if (res && res.success) {
        const roleDetails = ROLE_DETAILS[res.role];
        navigate(roleDetails?.defaultRoute || '/overview');
      } else if (res && res.deactivated) {
        setErrors({
          form: 'Your account has been deactivated. Please contact an administrator.',
        });
      } else if (res && res.notFound) {
        setErrors({
          form: 'Account not found. Create an account to access a staff portal.',
        });
      } else {
        setErrors({
          form: res?.error || 'Authentication failed. Please check your credentials.',
        });
      }
    } catch (err) {
      setLoading(false);
      setErrors({ form: err.message || 'Login failed' });
    }
  };

  // Staff Registration Submit with Supabase Auth
  const handleStaffRegister = async (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const selectedHosp = hospitals.find((h) => h.name === regHospital) || hospitals[0];
      const res = await registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        mobile: regMobile.trim(),
        password: regPassword,
        role: regRole,
        assignedRole: regRole,
        hospitalNode: regHospital,
        hospitalId: selectedHosp?.id || 'HOSP-01',
        employeeId: regEmployeeId.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Active',
      });

      setLoading(false);
      if (res.success) {
        setRegisteredSuccessUser(res.user);
        setEmail(res.user.email);
        setPassword(regPassword);
        setIsRegister(false);
      } else {
        setErrors({
          email: res.error,
        });
      }
    } catch (err) {
      setLoading(false);
      setErrors({ form: err.message || 'Registration failed' });
    }
  };

  // Patient Send OTP via backend service
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!patientName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    if (!patientMobile.trim() || !/^\d{10}$/.test(patientMobile.trim())) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setOtpSending(true);
    setOtpError('');

    try {
      const res = await otpService.sendPatientOtp(patientMobile, patientName);
      setOtpSending(false);

      if (!res.success) {
        setOtpError(res.error || 'Failed to send OTP code.');
        showToast(res.error || 'Failed to send OTP code', 'error');
        return;
      }

      setOtpSent(true);
      setOtpMode(res.mode || 'demo');
      setOtpProvider(res.provider || '');
      setMaskedMobile(res.maskedMobile || `******${patientMobile.slice(-4)}`);
      setGeneratedOtp(res.demoOtp || '');
      setOtpCountdown(res.resendCooldown || 30);
      setInputOtp('');

      if (res.mode === 'production') {
        showToast(`OTP sent successfully to ${res.maskedMobile}`, 'success');
      } else {
        showToast(`Demo Mode: OTP sent (${res.demoOtp})`, 'info');
      }
    } catch (err) {
      setOtpSending(false);
      setOtpError('Failed to communicate with OTP service.');
      showToast('Failed to send OTP', 'error');
    }
  };

  // Patient Verify OTP via backend service
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!inputOtp || inputOtp.length !== 6) {
      setOtpError('Please enter a complete 6-digit OTP code.');
      showToast('Please enter 6-digit OTP', 'error');
      return;
    }

    setLoading(true);
    setOtpError('');

    try {
      const verifyRes = await otpService.verifyPatientOtp(patientMobile, inputOtp);
      if (!verifyRes.success) {
        setLoading(false);
        setOtpError(verifyRes.error || 'Invalid OTP code. Please check and try again.');
        showToast(verifyRes.error || 'Invalid OTP code', 'error');
        return;
      }

      await loginPatientWithOtp(patientName, patientMobile);
      setLoading(false);
      showToast('Patient access confirmed', 'success');
      navigate('/patient-portal');
    } catch (err) {
      setLoading(false);
      setOtpError(err.message || 'Verification failed');
      showToast('Verification failed', 'error');
    }
  };

  // Quick Demo account filler helper
  const quickFill = (demoEmail, demoName = 'Healthcare Staff') => {
    setEmail(demoEmail);
    setPassword('arogya2026');
    setAuthMode('staff');
    setIsRegister(false);
    setErrors({});
    setRegisteredSuccessUser(null);
  };

  // Render Portal Header Details based on authoritative detection
  const renderPortalHeader = () => {
    if (authMode === 'patient') {
      return {
        badge: <RoleBadge role={ROLES.PATIENT} size="sm" />,
        title: 'PATIENT ACCESS PORTAL',
        description: 'Fast OPD queue check-in, live token tracking, and personal care timeline.',
        accessLevel: 'Level 5 — Personal Care & Outpatient Queue Token',
      };
    }

    if (isRegister) {
      return {
        badge: <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">NEW STAFF REGISTRATION</span>,
        title: 'CREATE STAFF ACCOUNT',
        description: 'Register an authorized healthcare staff profile with specific hospital node clearance.',
        accessLevel: 'Clearance will be governed by selected role',
      };
    }

    if (detectedPortal.isRegistered) {
      return {
        badge: (
          <div className="flex items-center gap-1">
            <BadgeCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <RoleBadge role={detectedPortal.role} size="sm" />
          </div>
        ),
        title: detectedPortal.details?.title || 'HEALTHCARE PORTAL',
        description: `Verified Staff Record (${detectedPortal.user?.name}) • ${detectedPortal.user?.hospitalNode || 'Registered Facility'}`,
        accessLevel: detectedPortal.details?.accessLevel,
      };
    }

    if (detectedPortal.isDemo) {
      return {
        badge: <RoleBadge role={detectedPortal.role} size="sm" />,
        title: detectedPortal.details?.title || 'HEALTHCARE PORTAL',
        description: detectedPortal.details?.description,
        accessLevel: detectedPortal.details?.accessLevel,
      };
    }

    if (detectedPortal.isUnknown) {
      return {
        badge: (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            UNKNOWN ACCOUNT
          </span>
        ),
        title: 'No Account Found',
        description: 'No registered staff account found with this email. Create an account to access a staff portal or use Patient Access.',
        accessLevel: 'No Clearance Detected',
      };
    }

    return {
      badge: <span className="text-[10px] font-bold text-slate-400">STAFF LOGIN</span>,
      title: 'PORTAL AUTHENTICATION',
      description: 'Enter your registered healthcare credentials or select a role preview.',
      accessLevel: 'Role-based network clearance',
    };
  };

  const portalHeader = renderPortalHeader();

  return (
    <LoginShell
      title="AROGYA QUEUE"
      subtitle="Hospital OS + City Health Care Network"
      badge="Secure Staff & Patient Access"
      action={
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      }
    >
      

      

      {/* Main Authentication Grid */}
      <main className="relative z-10 w-full max-w-md px-4">
        {/* Left Side: Authentication Card */}
        <div className="w-full">
          <div className="rounded-2xl overflow-hidden relative">
            {/* Top Glowing Gradient Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-cyan-400 to-indigo-500" />

            {/* Top dynamic header responding to email / role */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-br from-slate-50/70 to-teal-50/30 dark:from-slate-800/40 dark:to-teal-950/20">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Portal Authentication
                </span>
                {portalHeader.badge}
              </div>

              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {portalHeader.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {portalHeader.description}
              </p>

              {/* Dynamic access level note */}
              {authMode !== 'patient' && portalHeader.accessLevel && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200/60 dark:border-teal-800/60">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{portalHeader.accessLevel}</span>
                </div>
              )}

              {/* Deactivated warning alert */}
              {detectedPortal.isDeactivated && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Your account has been deactivated. Please contact an administrator.</span>
                </div>
              )}

              {/* Unknown Account CTA actions banner */}
              {detectedPortal.isUnknown && !isRegister && authMode === 'staff' && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    This email is not recognized as a registered staff account or demo role.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRegEmail(email);
                        setIsRegister(true);
                        setErrors({});
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700"
                    >
                      Create New User
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('patient')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200"
                    >
                      Patient Access
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Registration Success Confirmation Card */}
            {registeredSuccessUser && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Account Created Successfully</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <div><strong>Name:</strong> {registeredSuccessUser.name}</div>
                  <div><strong>Role:</strong> {registeredSuccessUser.role}</div>
                  <div><strong>Email:</strong> {registeredSuccessUser.email}</div>
                  <div><strong>Hospital:</strong> {registeredSuccessUser.hospitalNode}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setRegisteredSuccessUser(null)}
                  className="w-full py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                >
                  Continue to Login
                </button>
              </div>
            )}

            {/* Mode Switcher Tabs */}
            <div className="p-4 pb-0">
              <div className="grid grid-cols-2 p-1 bg-slate-100/90 dark:bg-slate-800/70 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('staff');
                    setErrors({});
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'staff'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Staff Portal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('patient');
                    setIsRegister(false);
                    setErrors({});
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'patient'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Patient Access
                </button>
              </div>
            </div>

            {/* Staff Credentials Form (Login OR Register) */}
            {authMode === 'staff' ? (
              !isRegister ? (
                /* LOGIN FORM */
                <form onSubmit={handleStaffLogin} className="p-6 space-y-4">
                  {/* Facial Biometric Login Button for Doctors */}
                  <button
                    type="button"
                    onClick={() => {
                      setFaceModalRole('DOCTOR');
                      setFaceModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-bold text-xs hover:border-teal-500/60 hover:shadow-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105">
                        <ScanFace className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="leading-tight">Doctor Facial Biometric Login</div>
                        <div className="text-[10px] text-teal-600/70 dark:text-teal-400/70 font-normal">
                          Instant camera authentication
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-teal-500/20 text-teal-800 dark:text-teal-200">
                      Face ID
                    </span>
                  </button>

                  <div className="relative flex items-center justify-center my-1">
                    <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                    <span className="bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 uppercase tracking-widest font-semibold shrink-0">
                      or credentials
                    </span>
                    <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  </div>

                  {errors.form && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errors.form}</span>
                    </div>
                  )}

                  <Input
                    label="Official or Personal Email"
                    required
                    type="email"
                    placeholder="e.g. doctor@gmail.com, john@hospital.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({});
                    }}
                    error={errors.email}
                    icon={Mail}
                    helperText={
                      detectedPortal.isRegistered
                        ? `Authoritative role: ${detectedPortal.role} (${detectedPortal.user?.hospitalNode || 'Registered Node'})`
                        : 'Role is automatically identified from registered records or demo accounts.'
                    }
                  />

                  <Input
                    label="Password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({});
                    }}
                    error={errors.password}
                    icon={Lock}
                    endIcon={showPassword ? EyeOff : Eye}
                    onEndIconClick={() => setShowPassword(!showPassword)}
                  />

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                      Remember session
                    </label>
                    <button
                      type="button"
                      onClick={() => showToast('Demo Mode: Use password "arogya2026" or your registered password', 'info')}
                      className="text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={loading}
                    className="w-full mt-2 font-bold shadow-md shadow-teal-500/20"
                  >
                    Authenticate & Enter Portal
                  </Button>

                  <div className="text-center pt-2 text-xs text-slate-500">
                    Need new staff registration?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(true);
                        setRegEmail(email);
                        setErrors({});
                      }}
                      className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              ) : (
                /* NEW USER REGISTRATION FORM */
                <form onSubmit={handleStaffRegister} className="p-6 space-y-3.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Staff Registration Form
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(false);
                        setErrors({});
                      }}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-bold"
                    >
                      ← Back to Login
                    </button>
                  </div>

                  <Input
                    label="Full Name"
                    required
                    placeholder="e.g. Dr. Rajeshwari Rao"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    error={errors.name}
                    icon={User}
                  />

                  <Input
                    label="Email Address"
                    required
                    type="email"
                    placeholder="e.g. rajeshwari@cityhealth.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    error={errors.email}
                    icon={Mail}
                  />

                  <Input
                    label="Mobile Number"
                    required
                    type="tel"
                    placeholder="10-digit mobile"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    error={errors.mobile}
                    icon={Phone}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label="Assigned Role"
                      options={[
                        ROLES.DOCTOR,
                        ROLES.NURSE,
                        ROLES.HOSPITAL_ADMIN,
                        ROLES.PHARMACIST,
                        ROLES.RECEPTIONIST,
                        ROLES.LAB_TECH,
                        ROLES.AMBULANCE,
                        ROLES.ADMIN,
                        ROLES.PATIENT,
                      ]}
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                    />

                    <Select
                      label="Hospital Node"
                      options={hospitals.map((h) => h.name)}
                      value={regHospital}
                      onChange={(e) => setRegHospital(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Employee ID (Optional)"
                    placeholder="e.g. EMP-4091"
                    value={regEmployeeId}
                    onChange={(e) => setRegEmployeeId(e.target.value)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Password"
                      required
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      error={errors.password}
                      icon={Lock}
                    />
                    <Input
                      label="Confirm Password"
                      required
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      error={errors.confirmPassword}
                      icon={Lock}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={loading}
                    className="w-full mt-2 font-bold shadow-md shadow-teal-500/20"
                    icon={UserPlus}
                  >
                    Complete Registration
                  </Button>

                  <div className="text-center pt-1 text-xs text-slate-500">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(false);
                        setErrors({});
                      }}
                      className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )
            ) : (
              /* Patient OTP Verification Form */
              <div className="p-6">
                {/* Facial Biometric Login Button for Patients */}
                <button
                  type="button"
                  onClick={() => {
                    setFaceModalRole('PATIENT');
                    setFaceModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-bold text-xs hover:border-teal-500/60 hover:shadow-xs cursor-pointer group mb-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105">
                      <ScanFace className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="leading-tight">Patient Facial Biometric Login</div>
                      <div className="text-[10px] text-teal-600/70 dark:text-teal-400/70 font-normal">
                        Direct token check-in with camera
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-teal-500/20 text-teal-800 dark:text-teal-200">
                    Face ID
                  </span>
                </button>

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 uppercase tracking-widest font-semibold shrink-0">
                    or mobile OTP
                  </span>
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                </div>

                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <Input
                      label="Patient Full Name"
                      required
                      placeholder="e.g. Anjali Verma"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      icon={User}
                    />

                    <Input
                      label="Registered Mobile Number"
                      required
                      type="tel"
                      placeholder="Enter 10-digit mobile"
                      value={patientMobile}
                      onChange={(e) => setPatientMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      icon={Phone}
                      helperText="Enter your 10-digit mobile to receive your verification OTP."
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={otpSending}
                      className="w-full font-bold shadow-md shadow-teal-500/20"
                    >
                      {otpSending ? 'Sending OTP...' : 'Send Verification OTP'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    {/* Status Banner: PRODUCTION SMS vs DEMO MODE */}
                    {otpMode === 'production' ? (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>SMS OTP SENT</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold">
                            {otpProvider || 'Live SMS'}
                          </span>
                        </div>
                        <p className="mt-1.5 text-slate-700 dark:text-slate-300">
                          OTP sent to{' '}
                          <strong className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                            {maskedMobile}
                          </strong>
                          . Code expires in 5 minutes.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>DEVELOPMENT / DEMO MODE</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold">
                            Demo Mode
                          </span>
                        </div>
                        <p className="mt-1.5 text-slate-700 dark:text-slate-300">
                          SMS service is not configured. Demo OTP:{' '}
                          <strong className="text-amber-700 dark:text-amber-300 font-mono text-sm tracking-wider font-bold">
                            {generatedOtp}
                          </strong>
                        </p>
                      </div>
                    )}

                    <div className="px-1 flex items-center justify-between text-xs text-slate-500">
                      <span>OTP sent to: <strong className="font-mono text-slate-800 dark:text-slate-200">{maskedMobile}</strong></span>
                      <span className="text-slate-400 font-medium">6 Digits</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Enter 6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={inputOtp}
                        onChange={(e) => {
                          setInputOtp(e.target.value.replace(/\D/g, ''));
                          setOtpError('');
                        }}
                        className="w-full text-center text-2xl tracking-[0.5em] font-mono py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      {otpError && <p className="mt-1.5 text-xs text-rose-500 font-medium">{otpError}</p>}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Expires in {otpCountdown}s</span>
                      <button
                        type="button"
                        disabled={otpCountdown > 0 || otpSending}
                        onClick={handleSendOtp}
                        className="text-teal-600 dark:text-teal-400 font-bold hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {otpSending ? 'Resending...' : 'Resend OTP'}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={loading}
                      className="w-full font-bold shadow-md shadow-teal-500/20 cursor-pointer"
                    >
                      Verify OTP & Enter Patient Portal
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setInputOtp('');
                        setOtpError('');
                      }}
                      className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mt-2 cursor-pointer"
                    >
                      Change Mobile Number
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Quick Demo Credentials Footer */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col items-center gap-1 mb-3 text-center">
                <p className="text-[11px] font-bold tracking-[0.06em] text-gray-400 dark:text-slate-400 flex items-center gap-1 whitespace-nowrap">
                  {'\u2728'} QUICK ROLE ACCESS PREVIEW (1-CLICK TEST)
                </p>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 whitespace-nowrap">Password autofilled</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5">
                {[
                  { label: 'Doctor', email: 'doctor@gmail.com', name: 'Dr. Arvind Sharma', dot: 'bg-indigo-500', emoji: '\u{1FA7A}' },
                  { label: 'Admin', email: 'admin.admin@gmail.com', name: 'System Admin', dot: 'bg-violet-500', emoji: '\u{1F6E1}\uFE0F' },
                  { label: 'Hospital Admin', email: 'hospital.admin@gmail.com', name: 'BCH Director', dot: 'bg-blue-500', emoji: '\u{1F3E5}' },
                  { label: 'Nurse', email: 'nurse@gmail.com', name: 'Sister Mary', dot: 'bg-emerald-500', emoji: '\u{1F469}\u200D\u2695\uFE0F' },
                  { label: 'Pharmacist', email: 'pharmacist@gmail.com', name: 'Chief Pharmacist', dot: 'bg-amber-500', emoji: '\u{1F48A}' },
                  { label: 'Receptionist', email: 'receptionist@gmail.com', name: 'Reception Desk', dot: 'bg-teal-500', emoji: '\u{1F481}' },
                  { label: 'Lab Tech', email: 'labtech@gmail.com', name: 'Pathology Lab', dot: 'bg-purple-500', emoji: '\u{1F9EA}' },
                  { label: 'Ambulance', email: 'ambulance@gmail.com', name: 'Manjunath Gowda', dot: 'bg-red-500', emoji: '\u{1F691}' },
                  { label: 'Patient', email: 'patient.kumar@gmail.com', name: 'Ramesh Sundaram', dot: 'bg-cyan-600', emoji: '\u{1F9D1}' },
                ].map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => quickFill(r.email, r.name)}
                    title={`Sign in as ${r.name}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-[12px] font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:scale-105 hover:shadow-md hover:border-teal-400 cursor-pointer whitespace-nowrap"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${r.dot}`} />
                    <span className="whitespace-nowrap">
                      {r.emoji} {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Facial Camera Biometric Login Modal */}
      <BiometricFaceLoginModal
        isOpen={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        initialRole={faceModalRole}
      />
    </LoginShell>
  );
}
