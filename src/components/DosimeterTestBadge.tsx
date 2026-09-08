import React from 'react';
import { REFERENCE_STEPS, getSimulatedStripColor } from '../utils/colorimetry';
import { Shield, Sparkles, CheckCircle2, AlertTriangle, QrCode } from 'lucide-react';

interface DosimeterTestBadgeProps {
  badgeId?: string;
  expiryDate?: string;
  isExpired?: boolean;
  conversionPercent?: number; // 0 to 100
  showLegend?: boolean;
  compact?: boolean;
  onSelectConversion?: (percent: number) => void;
}

export const DosimeterTestBadge: React.FC<DosimeterTestBadgeProps> = ({
  badgeId = 'BDG-7049-H2S',
  expiryDate = '2026-12-31',
  isExpired = false,
  conversionPercent = 65.1,
  showLegend = true,
  compact = false,
  onSelectConversion,
}) => {
  const currentStrip = getSimulatedStripColor(conversionPercent);

  return (
    <div className={`relative bg-gradient-to-b from-slate-900 to-slate-950 border ${isExpired ? 'border-amber-500/50' : 'border-cyan-500/40'} rounded-2xl p-4 shadow-xl text-slate-100 overflow-hidden select-none`}>
      {/* Badge Header with Industrial Branding */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
              H₂S PASSIVE DOSIMETER
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">TYPE-IV</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">CHEM-SPEC: Pb-ACETATE REAGENT</div>
          </div>
        </div>

        {/* Expiry Indicator */}
        <div className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
          isExpired 
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          {isExpired ? (
            <>
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>EXPIRED</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>EXP: {expiryDate}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Dosimeter Body */}
      <div className="space-y-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
        
        {/* CALIBRATION REFERENCE SCALE (Horizontal [0%] [25%] [50%] [75%] [100%]) */}
        <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
                REFERENCE SCALE
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 font-mono border border-cyan-500/30">
                LOCKED ✓
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400">
              LIGHTING CALIBRATION ONLY
            </span>
          </div>

          {/* 5 Printed Reference Steps Horizontally */}
          <div className="grid grid-cols-5 gap-1.5">
            {REFERENCE_STEPS.map((step) => {
              const isSelected = Math.abs(conversionPercent - step.percent) < 12.5;
              return (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => onSelectConversion && onSelectConversion(step.percent)}
                  className={`flex flex-col items-center p-1.5 rounded transition-all text-center ${
                    isSelected ? 'ring-2 ring-cyan-400 bg-cyan-950/40' : 'hover:bg-slate-800/60 bg-slate-950/40'
                  }`}
                >
                  <div
                    className="w-full h-7 rounded border border-black/40 shadow-inner mb-1"
                    style={{ backgroundColor: step.colorHex }}
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-200">{step.label}</span>
                  <span className="text-[8px] font-mono text-slate-400">{step.colorHex}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 85% Saturation / Expired Badge Indicator */}
        {conversionPercent >= 85.0 && (
          <div className="p-2.5 bg-rose-950/70 border border-rose-500/60 rounded-lg flex items-center gap-2 text-rose-300 text-xs font-mono font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            <span>⚠ STRIP EXPIRED / SATURATED (Conversion ≥ 85%)</span>
          </div>
        )}

        {/* SENSING ELEMENT: Reactive Strip */}
        <div className="flex items-center justify-between bg-slate-900/90 rounded-lg p-3 border border-slate-800">
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
              REACTIVE H₂S STRIP (SENSING ELEMENT)
            </div>
            <div className="text-[9px] text-slate-400 font-mono">
              Lead Acetate Reagent (Darkens proportionally with H₂S)
            </div>
            <div className="flex items-center gap-2 pt-1 font-mono text-xs text-slate-300">
              <span>Conversion: <strong className="text-white">{conversionPercent.toFixed(1)}%</strong></span>
              <span className="text-slate-500">|</span>
              <span>Hex: <strong className="text-cyan-300">{currentStrip.hex}</strong></span>
            </div>
          </div>

          {/* Physical chemical reagent strip visual: PURE swatch with NO text overlay */}
          <div
            className="w-20 h-16 rounded-lg shadow-inner border-2 border-black/60 transition-colors duration-300 shrink-0"
            style={{ backgroundColor: currentStrip.hex }}
            title={`Pure Reactive Strip Color: ${currentStrip.hex} (${conversionPercent.toFixed(1)}% conversion)`}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-1">
          <span>BATCH: 26-08A</span>
          <span>BADGE ID: {badgeId}</span>
        </div>

      </div>

      {/* Educational Footer explaining the components */}
      {showLegend && !compact && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[9px] text-slate-400">
          <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/50">
            <span className="block text-cyan-400 font-semibold">1. Reactive Strip</span>
            Darkens with H₂S gas
          </div>
          <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/50">
            <span className="block text-cyan-400 font-semibold">2. Reference Scale</span>
            Lighting correction
          </div>
          <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/50">
            <span className="block text-cyan-400 font-semibold">3. Smartphone</span>
            Digital reader ONLY
          </div>
        </div>
      )}
    </div>
  );
};
