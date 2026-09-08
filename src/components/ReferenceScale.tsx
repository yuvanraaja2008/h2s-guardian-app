import React from 'react';
import { REFERENCE_STEPS } from '../utils/colorimetry';

interface ReferenceScaleProps {
  currentConversion?: number;
  interactive?: boolean;
  onSelect?: (percent: number) => void;
  className?: string;
}

export const ReferenceScale: React.FC<ReferenceScaleProps> = ({
  currentConversion,
  interactive = false,
  onSelect,
  className = '',
}) => {
  return (
    <div className={`bg-slate-900/80 border border-slate-800 rounded-xl p-3 select-none ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-cyan-400">
          PRINTED REFERENCE SCALE
        </span>
        <span className="text-[9px] font-mono text-slate-400">
          PbS CALIBRATION STEPS
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {REFERENCE_STEPS.map((step) => {
          const isClosest =
            currentConversion !== undefined &&
            Math.abs(currentConversion - step.percent) <= 12.5;

          return (
            <div
              key={step.label}
              onClick={() => interactive && onSelect && onSelect(step.percent)}
              className={`flex flex-col items-center p-1 rounded transition-all ${
                interactive ? 'cursor-pointer hover:bg-slate-800' : ''
              } ${isClosest ? 'ring-2 ring-cyan-400 bg-cyan-950/40' : ''}`}
            >
              <div
                className="w-full h-7 rounded border border-black/40 shadow-inner mb-1"
                style={{ backgroundColor: step.colorHex }}
              />
              <span className="text-[10px] font-mono font-bold text-slate-200">
                {step.label}
              </span>
              <span className="text-[8px] font-mono text-slate-400">
                {step.colorHex}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-[9px] text-slate-400 text-center font-mono">
        Optical normalization baseline: 0% unexposed to 100% saturation
      </div>
    </div>
  );
};
