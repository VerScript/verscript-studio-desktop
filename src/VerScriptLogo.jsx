import React from 'react';

export default function VerScriptLogo({ width = 28, height = 28, className = '', showFrame = false }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="VerScript Studio Logo"
    >
      <defs>
        <linearGradient id="vrsLeftGrad" x1="0%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#00FFCC" />
          <stop offset="50%" stopColor="#00d2ff" />
          <stop offset="100%" stopColor="#0077fe" />
        </linearGradient>

        <linearGradient id="vrsRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="30%" stopColor="#bd00ff" />
          <stop offset="100%" stopColor="#7928CA" />
        </linearGradient>

        <linearGradient id="vrsOverlapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9333ea" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="vrsBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFCC" />
          <stop offset="50%" stopColor="#00d2ff" />
          <stop offset="100%" stopColor="#bd00ff" />
        </linearGradient>

        <filter id="vrsGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {showFrame && (
        <g id="workstation-frame">
          <rect x="24" y="36" width="464" height="390" rx="36" fill="#0a0d16" stroke="url(#vrsBorderGrad)" strokeWidth="6"/>
          <path d="M 196 426 L 180 476 L 332 476 L 316 426 Z" fill="#151a28" stroke="rgba(255,255,255,0.15)" strokeWidth="4"/>
          <circle cx="64" cy="68" r="7" fill="#ef4444" opacity="0.8"/>
          <circle cx="86" cy="68" r="7" fill="#f59e0b" opacity="0.8"/>
          <circle cx="108" cy="68" r="7" fill="#10b981" opacity="0.8"/>
        </g>
      )}

      <g id="verscript-mark">
        {/* Left Arm Capsule */}
        <rect
          x="-48"
          y="-180"
          width="96"
          height="360"
          rx="48"
          transform="translate(194, 255) rotate(-24.5)"
          fill="url(#vrsLeftGrad)"
        />

        {/* Right Arm Capsule with blend */}
        <rect
          x="-48"
          y="-180"
          width="96"
          height="360"
          rx="48"
          transform="translate(318, 255) rotate(24.5)"
          fill="url(#vrsRightGrad)"
          opacity="0.94"
          style={{ mixBlendMode: 'screen' }}
        />

        {/* Overlapping Apex Diamond */}
        <path
          d="M 256 312 L 298 392 L 256 438 L 214 392 Z"
          fill="url(#vrsOverlapGrad)"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}
