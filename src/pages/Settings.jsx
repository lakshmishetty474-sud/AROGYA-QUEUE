import React from 'react';
import { Settings as SettingsIcon, Sun, Moon, Bell, Globe, Shield, Info } from 'lucide-react';
import { useHealthcare } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Settings() {
  const { theme, toggleTheme, showToast } = useHealthcare();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          System Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure interface appearance, notifications, and regional telemetry preferences.
        </p>
      </div>

      {/* Theme Setting */}
      <Card title="Display & Theme" subtitle="Customize the application visual interface">
        <div className="flex items-center justify-between py-2 text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Interface Color Theme
            </span>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Current active theme: <strong className="capitalize">{theme}</strong> mode
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Light
            </button>
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              Dark
            </button>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card title="Alerts & Telemetry Preferences" subtitle="Control system alerts and critical sound cues">
        <div className="space-y-3 text-xs">
          {[
            { label: 'Emergency STAT Patient Influx Alerts', desc: 'Notify immediately when emergency triage cases are registered', default: true },
            { label: 'Pharmacy Low Stock Warnings', desc: 'Trigger warnings when batch count falls below minimum safety stock', default: true },
            { label: 'City Grid Inter-Hospital Referrals', desc: 'Display incoming transfer requests from connected hospitals', default: true },
            { label: 'Ambulance Handoff ETA Pings', desc: 'Receive real-time countdown when ambulance approaches triage bay', default: false },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {item.label}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={item.default}
                onChange={() => showToast('Preference updated', 'info')}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Application System Information */}
      <Card title="Application Information" subtitle="Arogya Queue System Build Specifications">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Platform Version</span>
            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">v2.4.0-PROD (Enterprise)</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Data Architecture</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">Local-First Reactive Mesh (localStorage Sync)</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Compliance</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">ABHA / NDHM Ready Healthcare Protocol</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500">Regional Health Authority</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">Government Health Grid Node</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
