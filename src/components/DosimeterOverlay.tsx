import React from 'react';
import { motion } from 'motion/react';
import { Check, Sun, Crosshair, AlertCircle, Sparkles } from 'lucide-react';
import { REFERENCE_SCALE_PATCHES } from '../utils/colorimetry';

interface DosimeterOverlayProps {
  isScanning: boolean;
  referenceDetected: boolean;
  stripDetected: boolean;
  lightingOk: boolean;
  guidanceMessage: string;
  onSimulateBadgeTap?: () => void;
}

export const DosimeterOverlay: React.FC<DosimeterOverlayProps> = ({
  isScanning,
  referenceDetected,
  stripDetected,
  lightingOk,
  guidanceMessage,
  onSimulateBadgeTap,
}) => {
  const isReady = referenceDetected && stripDetected && lightingOk;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
      {/* Top Status Indicators */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border backdrop-blur-md transition-all ${
            referenceDetected
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400'
              : 'bg-slate-950/70 border-slate-700 text-slate-400'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>REFERENCE SCALE {referenceDetected ? '✓' : '...'}</span>
        </div>

        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border backdrop-blur-md transition-all ${
            stripDetected
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400'
              : 'bg-slate-950/70 border-slate-700 text-slate-400'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>STRIP {stripDetected ? '✓' : '...'}</span>
        </div>

        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border backdrop-blur-md transition-all ${
            lightingOk
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400'
              : 'bg-amber-950/70 border-amber-500/50 text-amber-400'
          }`}
        >
          <Sun className="w-3 h-3" />
          <span>LIGHTING {lightingOk ? '✓' : 'LOW'}</span>
        </div>
      </div>

      {/* Central Rectangular Scanning Reticle (Sleek Interface style) */}
      <div className="flex-1 flex items-center justify-center my-auto">
        <div
          className="relative w-[230px] h-[330px] rounded-lg border-2 transition-colors duration-300 flex flex-col justify-between p-3.5 shadow-[0_0_0_1000px_rgba(0,0,0,0.65)]"
          style={{
            borderColor: isReady ? 'var(--accent)' : '#4b5563',
          }}
        >
          {/* Animated Laser Scanning Line */}
          {isScanning && (
            <motion.div
              animate={{
                top: ['4%', '94%', '4%'],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="sleek-scan-line left-0 right-0 z-30 pointer-events-none"
            />
          )}

          {/* Precision Corner Reticles */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl pointer-events-none" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr pointer-events-none" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl pointer-events-none" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br pointer-events-none" />

          {/* Sleek Guide Box Top: Reference Scale */}
          <div className="sleek-guide-box w-full h-[95px] rounded-md bg-slate-900/40 p-2 flex flex-col justify-between relative">
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-[9px] font-bold text-slate-200 tracking-wider">
                REFERENCE SCALE
              </span>
              <span className="text-[8px] text-cyan-400 font-mono">
                {referenceDetected ? 'LOCKED ✓' : 'CALIB'}
              </span>
            </div>

            {/* 5-step preview swatches */}
            <div className="grid grid-cols-5 gap-1 w-full my-auto">
              {REFERENCE_SCALE_PATCHES.map((sw, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-full h-3 rounded-xs border border-white/20"
                    style={{ backgroundColor: sw.hex }}
                  />
                  <span className="text-[7px] font-mono text-slate-400 mt-0.5">{sw.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center spacing divider */}
          <div className="flex items-center justify-center py-1">
            <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase">
              OPTICAL ALIGNMENT
            </span>
          </div>

          {/* Sleek Guide Box Bottom: Reactive Strip */}
          <div className="sleek-guide-box w-full h-[95px] rounded-md bg-cyan-950/20 border-cyan-400/60 p-2 flex flex-col justify-between relative">
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-[9px] font-bold text-cyan-300 tracking-wider">
                REACTIVE STRIP
              </span>
              <span className="text-[8px] text-cyan-300 font-mono">
                {stripDetected ? 'DETECTED ✓' : 'ACTIVE'}
              </span>
            </div>
            <div className="my-auto w-full h-8 rounded border border-dashed border-cyan-400/60 flex items-center justify-center bg-slate-950/40">
              <Crosshair className="w-4 h-4 text-cyan-400 mr-1.5" />
              <span className="text-[8px] font-mono text-cyan-200">
                ALIGN SENSING STRIP HERE
              </span>
            </div>
            <div className="text-[8px] font-mono text-slate-400 text-center">
              PHYSICAL SENSOR (PbS DEPOSITION)
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Guidance Prompt Box */}
      <div className="mb-2 flex flex-col items-center">
        <motion.div
          key={guidanceMessage}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`pointer-events-auto px-4 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md border ${
            isReady
              ? 'bg-cyan-950/85 border-cyan-400/60 text-cyan-300 shadow-cyan-950/40'
              : 'bg-slate-950/90 border-slate-700 text-slate-200'
          }`}
        >
          {isReady ? (
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{guidanceMessage}</span>
        </motion.div>
      </div>
    </div>
  );
};
