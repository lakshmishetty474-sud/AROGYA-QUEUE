import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  ShieldAlert,
  User,
  Settings,
  LogOut,
  HeartPulse,
  Monitor,
  Globe,
  QrCode,
} from 'lucide-react';
import { useHealthcare } from '../../context/AppContext';
import { HospitalSelector } from './HospitalSelector';
import { RoleBadge } from '../ui/RoleBadge';
import { PaymentQRModal } from '../modules/PaymentQRModal';

export function Header({ onOpenSearch, onOpenNotifications, onToggleMobileNav }) {
  const {
    currentUser,
    logout,
    theme,
    toggleTheme,
    notifications,
    emergencyMode,
  } = useHealthcare();
  const [profileOpen, setProfileOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Breadcrumbs title helper
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('overview')) return 'Command Center Overview';
    if (path.includes('patient-flow')) return 'Smart OPD Queue & Patient Intake';
    if (path.includes('doctor-desk')) return 'Doctor Clinical Workspace';
    if (path.includes('hospital-os')) return 'Hospital Operating System';
    if (path.includes('pharmacy')) return 'Pharmacy & Supply Logistics';
    if (path.includes('city-grid')) return 'Arogya City Healthcare Grid';
    if (path.includes('ambulance')) return 'Emergency Ambulance Fleet';
    if (path.includes('ai')) return 'AI Operational Insights';
    if (path.includes('administration')) return 'System & Facility Administration';
    if (path.includes('patient-portal')) return 'My Patient Care & Queue Token';
    if (path.includes('profile')) return 'User Profile';
    if (path.includes('settings')) return 'System Settings';
    return 'Arogya Queue Hospital OS';
  };

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0c1220]/85 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left section: mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* AROGYA QUEUE logo mark */}
        <img
          data-aq-brand-mark="1"
          src="/arogya-logo.png"
          alt="AROGYA QUEUE"
          className="h-12 w-auto object-contain shrink-0 hidden sm:block"
        />
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {getPageTitle()}
            </h2>
            {emergencyMode && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white">
                <HeartPulse className="w-3 h-3" /> CITY EMERGENCY
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
            Connected Regional Healthcare Operating System
          </span>
        </div>
      </div>

      {/* Right section: Hospital Selector, Search, Theme, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Supabase Cloud Sync Indicator */}
        <div
          title="Supabase Cloud Database Connected (https://uurtddghpcusgjgltvuj.supabase.co)"
          className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Supabase Sync Active</span>
        </div>

        {/* Hospital selector */}
        {currentUser?.role !== 'PATIENT' && (
          <HospitalSelector className="hidden md:flex" />
        )}

        {/* Queue TV / Monitor Display Quick Launcher */}
        <button
          onClick={() => navigate('/display')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-teal-200/80 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-900/60 shadow-2xs"
          title="Open Queue TV / Kiosk Display"
        >
          <Monitor className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="hidden sm:inline">TV Display</span>
        </button>

        {/* Instant UPI Pay Quick Launcher */}
        <button
          onClick={() => setPaymentModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-violet-200/80 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-xs font-bold hover:bg-violet-100 dark:hover:bg-violet-900/60 shadow-2xs"
          title="Scan & Pay via Official UPI QR Code"
        >
          <QrCode className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span className="hidden sm:inline">UPI Pay</span>
        </button>

        {/* Global Search trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          title="Global Search (Ctrl+K)"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="hidden lg:inline">Search...</span>
          <kbd className="hidden lg:inline-block text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 font-mono text-slate-400">
            Ctrl K
          </kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Profile menu dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-600 dark:bg-teal-500 text-white font-bold text-xs flex items-center justify-center">
              {currentUser?.name ? currentUser.name[0] : 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden md:inline max-w-[100px] truncate">
              {currentUser?.name?.split(' ')[0]}
            </span>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 fade-in zoom-in-95"
              onClick={() => setProfileOpen(false)}
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {currentUser?.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate mb-2">{currentUser?.email}</p>
                <RoleBadge role={currentUser?.role} size="sm" />
              </div>

              <div className="py-1">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  My Profile
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Settings
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Instant Payment QR Modal */}
      <PaymentQRModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
    </header>
  );
}
