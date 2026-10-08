import React from 'react';

/**
 * High-fidelity Pharmaceutical Tablet Visual Component
 * Renders authentic medical pill shapes (Round Scored, Oblong, Two-tone Capsule, Vial)
 * with 3D bevels, realistic shadows, imprinted dosage codes, and pharmaceutical colorways.
 */

export function TabletVisualBadge({
  name = 'Medicine',
  dosageForm = 'Tablet',
  shape = 'Round',
  primaryColor = '#ffffff',
  secondaryColor = '#ffffff',
  imprint = 'MED',
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabel = false,
  className = '',
  onClick,
}) {
  const isCapsule = dosageForm?.toLowerCase().includes('capsule') || shape?.toLowerCase().includes('capsule');
  const isVial = dosageForm?.toLowerCase().includes('vial') || dosageForm?.toLowerCase().includes('injection');
  const isOblong = shape?.toLowerCase().includes('oblong') || dosageForm?.toLowerCase().includes('sr');
  const isOctagon = shape?.toLowerCase().includes('octagon');

  const dimensions = {
    sm: { w: 32, h: 32, svgW: 32, svgH: 32 },
    md: { w: 48, h: 48, svgW: 48, svgH: 48 },
    lg: { w: 72, h: 72, svgW: 72, svgH: 72 },
  }[size] || { w: 48, h: 48, svgW: 48, svgH: 48 };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} onClick={onClick}>
      <div
        className="relative shrink-0 flex items-center justify-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-2xs group cursor-pointer hover:border-teal-500"
        style={{ width: dimensions.w, height: dimensions.h }}
        title={`${name} (${dosageForm}) • Imprint: ${imprint}`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm group-hover:scale-105"
        >
          <defs>
            {/* 3D Tablet Gradient Highlights */}
            <linearGradient id={`grad-${name}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#000000" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
            </linearGradient>

            <linearGradient id="vial-glass" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="40%" stopColor="#f8fafc" stopOpacity="0.1" />
              <stop offset="80%" stopColor="#0f172a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* CAPSULE SHAPE */}
          {isCapsule && (
            <g transform="rotate(-30 50 50)">
              {/* Left/Top Half Capsule */}
              <path
                d="M 28 50 C 28 36, 42 22, 50 22 C 58 22, 72 36, 72 50 Z"
                fill={primaryColor}
                stroke="#475569"
                strokeWidth="1.5"
              />
              {/* Right/Bottom Half Capsule */}
              <path
                d="M 28 50 L 28 62 C 28 76, 42 88, 50 88 C 58 88, 72 76, 72 62 L 72 50 Z"
                fill={secondaryColor || primaryColor}
                stroke="#475569"
                strokeWidth="1.5"
              />
              {/* Separation ring */}
              <line x1="28" y1="50" x2="72" y2="50" stroke="#334155" strokeWidth="2" opacity="0.4" />
              {/* Highlight sheen */}
              <ellipse cx="42" cy="38" rx="4" ry="12" fill="#ffffff" opacity="0.6" transform="rotate(-15 42 38)" />
              {/* Imprint Text */}
              <text
                x="50"
                y="74"
                textAnchor="middle"
                fontSize="9"
                fontFamily="system-ui, sans-serif"
                fontWeight="900"
                fill="#ffffff"
                opacity="0.9"
                transform="rotate(90 50 74)"
              >
                {imprint.split(' ')[0]}
              </text>
            </g>
          )}

          {/* VIAL SHAPE */}
          {isVial && (
            <g>
              {/* Cap */}
              <rect x="38" y="16" width="24" height="8" rx="2" fill={primaryColor} stroke="#334155" strokeWidth="1.5" />
              {/* Neck */}
              <rect x="42" y="24" width="16" height="8" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
              {/* Body */}
              <rect x="30" y="32" width="40" height="52" rx="6" fill="#f1f5f9" stroke="#334155" strokeWidth="2" />
              {/* Liquid Level */}
              <rect x="32" y="44" width="36" height="38" rx="4" fill="#0284c7" opacity="0.35" />
              {/* Glass Sheen */}
              <rect x="30" y="32" width="40" height="52" rx="6" fill="url(#vial-glass)" />
              {/* Label */}
              <rect x="33" y="48" width="34" height="24" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              <text x="50" y="58" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#0f172a">
                INSULIN
              </text>
              <text x="50" y="66" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#0284c7">
                100 IU/ml
              </text>
            </g>
          )}

          {/* OBLONG / EXTENDED RELEASE SHAPE */}
          {!isCapsule && !isVial && isOblong && (
            <g transform="rotate(-20 50 50)">
              {/* Pill Body */}
              <rect
                x="20"
                y="36"
                width="60"
                height="28"
                rx="14"
                fill={primaryColor}
                stroke="#64748b"
                strokeWidth="1.5"
              />
              <rect x="20" y="36" width="60" height="28" rx="14" fill={`url(#grad-${name})`} />
              {/* Center Score Line */}
              <line x1="50" y1="36" x2="50" y2="64" stroke="#475569" strokeWidth="1.5" opacity="0.6" />
              {/* Imprint */}
              <text
                x="35"
                y="54"
                textAnchor="middle"
                fontSize="8"
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
                fill={primaryColor === '#ffffff' || primaryColor === '#f8fafc' ? '#334155' : '#ffffff'}
              >
                {imprint.split(' ')[0]}
              </text>
              <text
                x="65"
                y="54"
                textAnchor="middle"
                fontSize="8"
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
                fill={primaryColor === '#ffffff' || primaryColor === '#f8fafc' ? '#334155' : '#ffffff'}
              >
                {imprint.split(' ')[1] || '500'}
              </text>
            </g>
          )}

          {/* OCTAGONAL TABLET */}
          {!isCapsule && !isVial && !isOblong && isOctagon && (
            <g>
              <polygon
                points="35,18 65,18 82,35 82,65 65,82 35,82 18,65 18,35"
                fill={primaryColor}
                stroke="#64748b"
                strokeWidth="1.5"
              />
              <polygon
                points="35,18 65,18 82,35 82,65 65,82 35,82 18,65 18,35"
                fill={`url(#grad-${name})`}
              />
              <text
                x="50"
                y="54"
                textAnchor="middle"
                fontSize="9"
                fontWeight="900"
                fill="#334155"
              >
                {imprint}
              </text>
            </g>
          )}

          {/* STANDARD ROUND SCORED TABLET */}
          {!isCapsule && !isVial && !isOblong && !isOctagon && (
            <g>
              {/* Outer circle */}
              <circle
                cx="50"
                cy="50"
                r="34"
                fill={primaryColor}
                stroke="#64748b"
                strokeWidth="1.5"
              />
              <circle cx="50" cy="50" r="34" fill={`url(#grad-${name})`} />
              {/* Debossed Bevel Inner Ring */}
              <circle cx="50" cy="50" r="28" fill="none" stroke="#94a3b8" strokeWidth="0.75" opacity="0.6" />
              {/* Score Line */}
              <line x1="22" y1="50" x2="78" y2="50" stroke="#475569" strokeWidth="1.5" opacity="0.5" />
              {/* Debossed Imprint */}
              <text
                x="50"
                y="42"
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
                fill={primaryColor === '#ffffff' || primaryColor === '#f8fafc' || primaryColor === '#fef08a' ? '#334155' : '#ffffff'}
              >
                {imprint.split(' ')[0]}
              </text>
              <text
                x="50"
                y="65"
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                fontFamily="system-ui, sans-serif"
                fill={primaryColor === '#ffffff' || primaryColor === '#f8fafc' || primaryColor === '#fef08a' ? '#475569' : '#ffffff'}
              >
                {imprint.split(' ')[1] || dosageForm.replace(/[^0-9]/g, '') || ''}
              </text>
            </g>
          )}
        </svg>
      </div>

      {showLabel && (
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
            {name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {shape} • {imprint}
          </span>
        </div>
      )}
    </div>
  );
}
