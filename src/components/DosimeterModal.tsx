import React, { useState } from 'react';
import { DosimeterTestBadge } from './DosimeterTestBadge';
import { Shield, Sparkles, X, Printer, ExternalLink, AlertTriangle, Cpu, HelpCircle } from 'lucide-react';

interface DosimeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'target' | 'info';
}

export const DosimeterModal: React.FC<DosimeterModalProps> = ({
  isOpen,
  onClose,
  type,
}) => {
  const [conversion, setConversion] = useState(65.1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {type === 'target' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <Shield className="w-5 h-5" />
              <h3 className="text-base font-bold font-mono uppercase tracking-wider">
                VIRTUAL DOSIMETER TARGET
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Use this virtual calibrated badge target to demonstrate camera alignment and colorimetric reading on screen or by pointing another phone.
            </p>

            {/* Interactive Badge Display */}
            <DosimeterTestBadge
              conversionPercent={conversion}
              onSelectConversion={(pct) => setConversion(pct)}
              showLegend={true}
            />

            {/* Quick Conversion Presets */}
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setConversion(0)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                0%
              </button>
              <button
                type="button"
                onClick={() => setConversion(25)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setConversion(50)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setConversion(53)}
                className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-bold hover:bg-cyan-900"
              >
                53% (62.2 ppm·hr)
              </button>
              <button
                type="button"
                onClick={() => setConversion(75)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setConversion(85)}
                className="px-2.5 py-1 rounded bg-rose-950 border border-rose-500/60 text-rose-300 font-bold hover:bg-rose-900"
              >
                85% (EXPIRED)
              </button>
            </div>

            {/* Conversion Slider */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Simulate Exposure Darkening:</span>
                <span className="text-cyan-400 font-bold">{conversion.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={conversion}
                onChange={(e) => setConversion(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>0% (White/Cream)</span>
                <span>50% (Medium Tan)</span>
                <span>100% (Dark Brown)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all"
            >
              CLOSE TARGET
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
              <h3 className="text-base font-bold font-mono uppercase tracking-wider">
                H₂S GUARDIAN ARCHITECTURE
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl space-y-1">
                <div className="font-bold text-cyan-300 uppercase font-mono text-[11px]">
                  CRITICAL SENSING PRINCIPLE
                </div>
                <p className="leading-relaxed">
                  The disposable chemical strip is the <strong>physical H₂S sensor</strong> (using immobilized metal salts like Lead Acetate or Bismuth). The smartphone camera is <strong>ONLY the digital reader</strong>. The phone itself has no gas sensor.
                </p>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-white font-mono text-[11px]">
                  HOW IT WORKS:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                  <li><strong>Physical Sensing:</strong> H₂S gas reacts irreversibly with the strip, precipitating insoluble metal sulfide that darkens the material.</li>
                  <li><strong>Optical Normalization:</strong> The smartphone camera photographs both the reactive strip and the 5-point printed reference scale.</li>
                  <li><strong>Illumination Gain:</strong> The printed 0% baseline eliminates shadows and color temperature shifts.</li>
                  <li><strong>Dose Estimation:</strong> The normalized optical density is mapped via reaction kinetics to cumulative dose (concentration × time in ppm·hr).</li>
                </ol>
              </div>

              {/* Safety Disclaimer */}
              <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl text-amber-300 text-[11px] leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5 font-mono">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>SAFETY & REGULATORY DISCLAIMER</span>
                </div>
                <p>
                  H₂S Guardian is a prototype passive dosimetry and digital-reading system. Estimated exposure values require controlled calibration and validation. This prototype must not replace certified industrial gas detection or occupational safety equipment.
                </p>
                <p className="text-[10px] text-amber-400/80 italic">
                  Never claim certified DGMS/OISD compliance or medical-grade measurement without physical laboratory validation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all"
            >
              ACKNOWLEDGE & CLOSE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
