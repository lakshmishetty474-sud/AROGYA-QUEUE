import React, { useState } from 'react';
import { Building2, Ambulance, MapPin, ExternalLink, ShieldCheck, Layers } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function InteractiveMap({
  hospitals = [],
  ambulances = [],
  onSelectHospital,
  apiKeyConfigured = false,
}) {
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Approximate relative positioning on a stylized Bangalore / Metro map canvas
  // Base center lat: 12.9716, lng: 77.5946
  const getMapCoordinates = (lat, lng) => {
    const minLat = 12.90;
    const maxLat = 13.06;
    const minLng = 77.53;
    const maxLng = 77.77;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(10, Math.min(90, y)),
    };
  };

  return (
    <div className="relative w-full h-96 sm:h-[480px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-inner select-none">
      {/* Stylized Vector Grid Background */}
      <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        {/* Arterial Highway Network Simulation Lines */}
        <path
          d="M 50 10 Q 55 50 50 90 M 10 50 Q 50 48 90 50 M 20 80 L 80 20 M 25 25 L 75 75"
          fill="none"
          stroke="#0284c7"
          strokeWidth="1.5"
          strokeDasharray="4 2"
          opacity="0.6"
        />
        {/* Ring Road */}
        <circle cx="50%" cy="50%" r="35%" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.3" />
      </svg>

      {/* Map Control Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[11px] font-bold text-slate-200 flex items-center gap-1.5 shadow-md">
          <Layers className="w-3.5 h-3.5 text-teal-400" />
          <span>Regional Healthcare Telemetry Map</span>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 backdrop-blur-md border border-slate-700 text-[10px] text-slate-300">
          Google Maps API: {apiKeyConfigured ? 'Connected' : 'Simulation Mode'}
        </div>
      </div>

      {/* Hospital Nodes Markers */}
      {hospitals.map((hosp) => {
        const { x, y } = getMapCoordinates(hosp.coordinates.lat, hosp.coordinates.lng);
        const isSelected = selectedMarker?.id === hosp.id;
        const isCritical = hosp.status === 'Critical' || hosp.status === 'Emergency';

        return (
          <div
            key={hosp.id}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => {
              setSelectedMarker(hosp);
              if (onSelectHospital) onSelectHospital(hosp);
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
          >
            {/* Pulsing ring for critical or emergency */}
            {isCritical && (
              <div className="absolute -inset-2 rounded-full bg-rose-500/40" />
            )}

            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                isCritical
                  ? 'bg-rose-600 text-white'
                  : hosp.status === 'Busy'
                  ? 'bg-amber-500 text-white'
                  : 'bg-teal-600 text-white'
              } border-2 border-white dark:border-slate-900`}
            >
              <Building2 className="w-4 h-4" />
            </div>

            {/* Marker Label */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-700 text-[10px] font-bold text-white shadow-md pointer-events-none">
              {hosp.code}
            </div>
          </div>
        );
      })}

      {/* Ambulance Markers */}
      {ambulances.map((amb) => {
        const { x, y } = getMapCoordinates(amb.coordinates.lat, amb.coordinates.lng);
        const isOnDuty = amb.status === 'On Duty';

        return (
          <div
            key={amb.id}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => setSelectedMarker(amb)}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${
                isOnDuty ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-700 text-slate-200'
              } border border-white/80`}
            >
              <Ambulance className="w-3.5 h-3.5" />
            </div>
          </div>
        );
      })}

      {/* Selected Marker Detail Card Popup */}
      {selectedMarker && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xl slide-in-from-bottom-2 text-xs">
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                {selectedMarker.code || selectedMarker.id}
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {selectedMarker.name || selectedMarker.driver}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedMarker.location || selectedMarker.currentLocation}
              </p>
            </div>
            <button
              onClick={() => setSelectedMarker(null)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
            {selectedMarker.totalBeds ? (
              <>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Beds</span>
                  <span className="font-bold">{selectedMarker.totalBeds}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ICU Capacity</span>
                  <span className="font-bold">{selectedMarker.icuBeds}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status</span>
                  <Badge variant={selectedMarker.status === 'Busy' ? 'warning' : 'success'} size="sm">
                    {selectedMarker.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Rating</span>
                  <span className="font-bold font-mono">★ {selectedMarker.rating}</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-slate-400 block text-[10px]">Driver Contact</span>
                  <span className="font-semibold">{selectedMarker.contact}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ETA</span>
                  <span className="font-bold text-rose-500 font-mono">{selectedMarker.eta}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">Destination</span>
                  <span className="font-semibold truncate">{selectedMarker.destination}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
