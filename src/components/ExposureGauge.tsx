import React from 'react';
import { ExposureStatus } from '../types';
import { getStatusColor } from '../utils/colorimetry';

interface ExposureGaugeProps {
  dosePpmHr: number; // Cumulative exposure in ppm·hr
  status: ExposureStatus;
  conversionPercent?: number;
  size?: number; // width & height in px
}

export const ExposureGauge: React.FC<ExposureGaugeProps> = ({
  dosePpmHr,
  status,
  conversionPercent = 0,
  size = 220,
}) => {
  const statusColors = getStatusColor(status);
  
  // Max scale is 120 ppm·hr for full sweep (240 degrees arc)
  const maxScale = 120;
  const clampedDose = Math.min(maxScale, Math.max(0, dosePpmHr));
  
  // Calculate percentage along arc (0 to 1)
  const progressRatio = clampedDose / maxScale;
  
  // SVG Arc geometry
  const radius = (size / 2) - 24;
  const strokeWidth = 14;
  const center = size / 2;
  
  // 240 degree gauge (from -210 deg to 30 deg)
  const startAngle = 150; // In standard polar coords (degrees)
  const endAngle = 390;   // 240 deg sweep
  const sweepAngle = 240;
  
  const arcLength = (sweepAngle / 360) * (2 * Math.PI * radius);
  const strokeDashoffset = arcLength * (1 - progressRatio);

  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="85%" stopColor="#ef4444" />
          </linearGradient>
          
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background track arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${2 * Math.PI * radius}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform={`rotate(150 ${center} ${center})`}
        />

        {/* Active colored exposure arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={statusColors.hex}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${2 * Math.PI * radius}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(150 ${center} ${center})`}
          filter="url(#gaugeGlow)"
          className="transition-all duration-700 ease-out"
        />

        {/* Zone markers */}
        {/* SAFE threshold tick (10 ppm·hr / 120 = 8.3%) */}
        {/* WARNING threshold tick (100 ppm·hr / 120 = 83.3%) */}
      </svg>

      {/* Center Readout Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none mt-1">
        <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
          ESTIMATED EXPOSURE
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-3xl font-extrabold font-mono tracking-tight text-white drop-shadow-md">
            {dosePpmHr.toFixed(1)}
          </span>
          <span className="text-xs font-mono text-slate-400">ppm·hr</span>
        </div>

        {/* Status Badge */}
        {conversionPercent >= 85.0 ? (
          <div className="mt-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider border shadow-sm bg-rose-950/70 border-rose-500/60 text-rose-300 animate-pulse">
            ⚠ EXPIRED / SATURATED
          </div>
        ) : (
          <div className={`mt-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider border shadow-sm ${statusColors.badgeBg} ${statusColors.badgeText} ${statusColors.badgeBorder}`}>
            {status}
          </div>
        )}

        {conversionPercent > 0 && (
          <span className="text-[10px] font-mono text-slate-400 mt-1">
            Conversion: <strong className="text-slate-200">{conversionPercent.toFixed(1)}%</strong>
          </span>
        )}
      </div>

      {/* Sub-threshold Legend Arc Markers */}
      <div className="absolute bottom-2 flex items-center justify-between w-4/5 text-[9px] font-mono text-slate-400">
        <span className="text-emerald-400 font-semibold">0.0 SAFE</span>
        <span className="text-amber-400 font-semibold">10.0 WARN</span>
        <span className="text-rose-400 font-semibold">&gt;100 HIGH</span>
      </div>
    </div>
  );
};
