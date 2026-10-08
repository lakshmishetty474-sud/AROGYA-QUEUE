import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building,
  Pill,
  Network,
  Cpu,
  Settings2,
  Ambulance,
  Stethoscope,
  MapPin,
  UserCheck,
  Activity,
  HeartPulse,
  LogOut,
  Monitor,
  Droplet,
} from 'lucide-react';
import { useHealthcare } from '../../context/AppContext';
import { ROLES } from '../../utils/roleDetector';
import { RoleBadge } from '../ui/RoleBadge';

export function Sidebar({ collapsed, setCollapsed }) {
  const { currentUser, logout, emergencyMode } = useHealthcare();

  if (!currentUser) return null;

  const role = currentUser.role;

  // Define navigational links for each role
  const getNavItems = () => {
    switch (role) {
      case ROLES.ADMIN:
      case ROLES.SUPER_ADMIN:
      case ROLES.HOSPITAL_ADMIN:
        return [
          { name: 'Overview', path: '/overview', icon: LayoutDashboard },
          { name: 'Patient Flow', path: '/patient-flow', icon: Users },
          { name: 'Hospital OS', path: '/hospital-os', icon: Building },
          { name: 'Blood Bank & Donors', path: '/blood-bank', icon: Droplet },
          { name: 'Queue TV Display', path: '/display', icon: Monitor },
          { name: 'Pharmacy & Supply', path: '/pharmacy', icon: Pill },
          { name: 'Arogya City Grid', path: '/city-grid', icon: Network },
          { name: 'Advanced AI', path: '/ai', icon: Cpu },
          { name: 'Administration', path: '/administration', icon: Settings2 },
        ];

      case ROLES.NURSE:
      case ROLES.HEAD_NURSE:
        return [
          { name: 'Overview', path: '/overview', icon: LayoutDashboard },
          { name: 'Patient Flow', path: '/patient-flow', icon: Users },
          { name: 'Hospital OS', path: '/hospital-os', icon: Building },
          { name: 'Queue TV Display', path: '/display', icon: Monitor },
          { name: 'Pharmacy & Supply', path: '/pharmacy', icon: Pill },
          { name: 'Arogya City Grid', path: '/city-grid', icon: Network },
          { name: 'Advanced AI', path: '/ai', icon: Cpu },
          { name: 'Administration', path: '/administration', icon: Settings2 },
        ];

      case ROLES.DOCTOR:
      case ROLES.SURGEON:
        return [
          { name: 'Doctor OPD Desk', path: '/doctor-desk', icon: Stethoscope },
          { name: 'Patient Flow', path: '/patient-flow', icon: Users },
          { name: 'Blood Bank & Donors', path: '/blood-bank', icon: Droplet },
          { name: 'Queue TV Display', path: '/display', icon: Monitor },
          { name: 'Arogya City Grid', path: '/city-grid', icon: Network },
          { name: 'Advanced AI', path: '/ai', icon: Cpu },
          { name: 'Administration', path: '/administration', icon: Settings2 },
        ];

      case ROLES.PHARMACIST:
        return [
          { name: 'Pharmacy & Supply', path: '/pharmacy', icon: Pill },
          { name: 'Administration', path: '/administration', icon: Settings2 },
        ];

      case ROLES.RECEPTIONIST:
        return [
          { name: 'Patient Flow', path: '/patient-flow', icon: Users },
          { name: 'Hospital OS', path: '/hospital-os', icon: Building },
          { name: 'Blood Bank & Donors', path: '/blood-bank', icon: Droplet },
          { name: 'Queue TV Display', path: '/display', icon: Monitor },
          { name: 'Administration', path: '/administration', icon: Settings2 },
        ];

      case ROLES.LAB_TECH:
      case ROLES.RADIOLOGIST:
        return [
          { name: 'Patient Flow', path: '/patient-flow', icon: Users },
          { name: 'Advanced AI', path: '/ai', icon: Cpu },
          { name: 'Administration', path: '/administration', icon: Settings2 },
        ];

      case ROLES.AMBULANCE:
        return [
          { name: 'Ambulance Portal', path: '/ambulance', icon: Ambulance },
          { name: 'Live Tracking', path: '/ambulance-tracking', icon: MapPin },
          { name: 'Employee Directory', path: '/ambulance-employees', icon: UserCheck },
          { name: 'Administration', path: '/administration', icon: Settings2 },
        ];

      case ROLES.PATIENT:
        return [
          { name: 'My Token & Care', path: '/patient-portal', icon: Users },
          { name: 'AI Health Guide', path: '/ai', icon: Cpu },
          { name: 'Profile & Settings', path: '/profile', icon: Settings2 },
        ];

      default:
        return [
          { name: 'Overview', path: '/overview', icon: LayoutDashboard },
          { name: 'Patient Flow', path: '/patient-flow', icon: Users },
          { name: 'Administration', path: '/administration', icon: Settings2 },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#090e1a]/95 backdrop-blur-xl transition-all duration-300 z-30 shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-slate-800/80 justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Brand tile: the real logo when present, gradient fallback otherwise */}
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm shadow-teal-500/25">
            {/* Icon is the base layer; the logo is absolutely positioned on top
                of it and reveals itself by covering it. If the file is missing
                the onError hides it and the icon shows through. */}
            <Activity className="w-5 h-5" />
            <img
              src="/arogya-logo.png"
              alt="AROGYA QUEUE"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100 truncate">
                AROGYA QUEUE
              </span>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 tracking-wider truncate">
                HOSPITAL OS
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Mode Banner in sidebar */}
      {emergencyMode && !collapsed && (
        <div className="m-3 p-2.5 rounded-xl bg-red-600 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1.5 shadow-sm">
          <HeartPulse className="w-3.5 h-3.5" />
          <span>CITY EMERGENCY ACTIVE</span>
        </div>
      )}

      {/* Role Indicator Banner */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Active Session
          </div>
          <RoleBadge role={role} size="sm" />
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/20 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-teal-600 dark:bg-teal-400" />
                  )}
                  <Icon className="w-4 h-4 shrink-0 group-hover:scale-110" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser.name ? currentUser.name[0] : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
