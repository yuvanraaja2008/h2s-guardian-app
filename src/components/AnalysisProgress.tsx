import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2, Sparkles, Cpu, Layers, SunMedium, Activity } from 'lucide-react';

interface AnalysisProgressProps {
  currentStepIndex: number; // 0 to 4
  stepMessage: string;
}

interface StepItem {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const STEPS: StepItem[] = [
  {
    id: 0,
    label: 'Reference detected',
    sublabel: 'Identified 5-point printed calibration swatches (0% - 100%)',
    icon: <Layers className="w-4 h-4" />,
  },
  {
    id: 1,
    label: 'Strip detected',
    sublabel: 'Localized immobilized Lead Acetate reactive sensing element',
    icon: <Cpu className="w-4 h-4" />,
  },
  {
    id: 2,
    label: 'Lighting normalized',
    sublabel: 'Compensating ambient lux and spectral white point gain',
    icon: <SunMedium className="w-4 h-4" />,
  },
  {
    id: 3,
    label: 'Colour analyzed',
    sublabel: 'Extracted RGB/LAB optical density and reaction kinetics',
    icon: <Activity className="w-4 h-4" />,
  },
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  currentStepIndex,
  stepMessage,
}) => {
  return (
    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Title & Spinner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            COMPUTER VISION ANALYSIS PIPELINE
          </div>
          <div className="text-sm font-semibold text-slate-200 mt-0.5">
            Colorimetric Digital Dosimetry
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        </div>
      </div>

      {/* Lighting Correction Callout Banner */}
      <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-3 mb-4 flex items-start gap-2.5">
        <SunMedium className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold text-cyan-300">
            Lighting correction using reference scale
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
            The printed 0% (unexposed) swatch is compared with calibrated baseline reflectance to cancel out phone camera exposure shifts, shadows, and ambient color temperature.
          </p>
        </div>
      </div>

      {/* Step checklist */}
      <div className="space-y-3">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isPending = idx > currentStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                  : isCurrent
                  ? 'bg-cyan-950/30 border-cyan-400/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
              }`}
            >
              {/* Status Icon */}
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-500">
                    {idx + 1}
                  </div>
                )}
              </div>

              {/* Step text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold uppercase tracking-wider ${
                      isDone
                        ? 'text-emerald-400'
                        : isCurrent
                        ? 'text-cyan-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label} {isDone ? '✓' : isCurrent ? '...' : ''}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-mono text-cyan-400 animate-pulse font-semibold">
                      PROCESSING
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {step.sublabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Status Message */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400">Current Task:</span>
        <span className="text-cyan-300 font-semibold truncate max-w-[240px]">
          {stepMessage || 'Executing colorimetric algorithm...'}
        </span>
      </div>
    </div>
  );
};
