import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building,
  Pill,
  Network,
  Stethoscope,
  Ambulance,
  Cpu,
  Settings2,
  Droplet,
} from 'lucide-react';
import { useHealthcare } from '../../context/AppContext';
import { ROLES } from '../../utils/roleDetector';

export function BottomNavigation() {
  const { currentUser } = useHealthcare();

  if (!currentUser) return null;

  const role = currentUser.role;

  const getMobileTabs = () => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
      case ROLES.ADMIN:
      case ROLES.HOSPITAL_ADMIN:
        return [
          { name: 'Overview', path: '/overview', icon: LayoutDashboard },
          { name: 'Queue', path: '/patient-flow', icon: Users },
          { name: 'Beds', path: '/hospital-os', icon: Building },
          { name: 'Blood Bank', path: '/blood-bank', icon: Droplet },
          { name: 'City Grid', path: '/city-grid', icon: Network },
        ];

      case ROLES.NURSE:
        return [
          { name: 'Overview', path: '/overview', icon: LayoutDashboard },
          { name: 'Queue', path: '/patient-flow', icon: Users },
          { name: 'Beds', path: '/hospital-os', icon: Building },
          { name: 'Pharmacy', path: '/pharmacy', icon: Pill },
          { name: 'City Grid', path: '/city-grid', icon: Network },
        ];

      case ROLES.DOCTOR:
      case ROLES.SURGEON:
        return [
          { name: 'OPD Desk', path: '/doctor-desk', icon: Stethoscope },
          { name: 'Patients', path: '/patient-flow', icon: Users },
          { name: 'Blood Bank', path: '/blood-bank', icon: Droplet },
          { name: 'AI Insights', path: '/ai', icon: Cpu },
          { name: 'Admin', path: '/administration', icon: Settings2 },
        ];

      case ROLES.PHARMACIST:
        return [
          { name: 'Pharmacy', path: '/pharmacy', icon: Pill },
          { name: 'Admin', path: '/administration', icon: Settings2 },
        ];

      case ROLES.RECEPTIONIST:
        return [
          { name: 'Intake & Queue', path: '/patient-flow', icon: Users },
          { name: 'Hospital OS', path: '/hospital-os', icon: Building },
          { name: 'Blood Bank', path: '/blood-bank', icon: Droplet },
          { name: 'Admin', path: '/administration', icon: Settings2 },
        ];

      case ROLES.LAB_TECH:
        return [
          { name: 'Lab Queue', path: '/patient-flow', icon: Users },
          { name: 'AI Tests', path: '/ai', icon: Cpu },
          { name: 'Admin', path: '/administration', icon: Settings2 },
        ];

      case ROLES.AMBULANCE:
        return [
          { name: 'Fleet', path: '/ambulance', icon: Ambulance },
          { name: 'Staff', path: '/ambulance-employees', icon: Users },
          { name: 'Tracking', path: '/ambulance-tracking', icon: Network },
        ];

      case ROLES.PATIENT:
        return [
          { name: 'My Token', path: '/patient-portal', icon: Users },
          { name: 'AI Guide', path: '/ai', icon: Cpu },
          { name: 'Profile', path: '/profile', icon: Settings2 },
        ];

      default:
        return [
          { name: 'Overview', path: '/overview', icon: LayoutDashboard },
          { name: 'Queue', path: '/patient-flow', icon: Users },
          { name: 'Settings', path: '/settings', icon: Settings2 },
        ];
    }
  };

  const tabs = getMobileTabs();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
                  isActive
                    ? 'text-teal-600 dark:text-teal-400 font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-tight truncate">{tab.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
