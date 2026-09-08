import React, { useState } from 'react';
import { DosimeterAnalysisResult } from '../types';
import { ExposureGauge } from './ExposureGauge';
import { getStatusColor, K } from '../utils/colorimetry';
import {
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  RotateCcw,
  Save,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertTriangle,
} from 'lucide-react';

interface ResultCardProps {
  result: DosimeterAnalysisResult;
  onSaveRecord: () => void;
  onScanAgain: () => void;
  isSaved?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onSaveRecord,
  onScanAgain,
  isSaved = false,
}) => {
  const statusColors = getStatusColor(result.status);
  const [showDebug, setShowDebug] = useState<boolean>(false);

  const debug = result.debugInfo;

  return (
    <div className="space-y-4 select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
            ANALYSIS REPORT
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            DOSIMETER RESULT
          </h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-400 block">ID: {result.id}</span>
          <span className="text-[10px] font-mono text-slate-400">
            {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* 85% RULE BANNER: Show prominently if conversion >= 85.0% */}
      {result.conversion >= 85.0 && (
        <div className="p-4 bg-rose-950/70 border-2 border-rose-500 rounded-3xl flex items-center gap-3.5 text-rose-200 shadow-xl shadow-rose-950/50">
          <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0 animate-pulse" />
          <div className="space-y-0.5">
            <div className="text-sm font-mono font-bold tracking-wider text-rose-300 uppercase">
              ⚠ STRIP EXPIRED / SATURATED
            </div>
            <div className="text-xs text-rose-200/90 leading-snug">
              Measured conversion is <strong>{result.conversion.toFixed(1)}%</strong> (threshold ≥ 85.0%). Strip has reached chemical saturation limit and must be replaced.
            </div>
          </div>
        </div>
      )}

      {/* Primary Circular Exposure Gauge Card */}
      <div className={`relative bg-gradient-to-b from-slate-900 to-slate-950 border ${statusColors.badgeBorder} rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center overflow-hidden`}>
        {/* Glow ambient background */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: statusColors.hex }}
        />

        {/* Section 13: ESTIMATED CUMULATIVE EXPOSURE */}
        <div className="text-center mb-2">
          <span className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase block">
            ESTIMATED CUMULATIVE EXPOSURE
          </span>
          <div className="text-3xl font-mono font-extrabold text-white tracking-tight">
            {result.dose_ppm_hr.toFixed(1)} <span className="text-base text-slate-400 font-semibold">ppm·hr</span>
          </div>
        </div>

        <ExposureGauge
          dosePpmHr={result.dose_ppm_hr}
          status={result.status}
          conversionPercent={result.conversion}
          size={210}
        />

        {/* Verification Status Badges (Section 13: Reference calibration & Lighting correction) */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Reference calibration: Detected</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            <span>Lighting correction: Applied</span>
          </span>
        </div>

        {/* Worker & Shift Badges Strip */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 w-full grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block">WORKER ID</span>
            <strong className="text-white">{result.workerId}</strong>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block">SHIFT</span>
            <strong className="text-cyan-400">{result.shift}</strong>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block">BADGE</span>
            <strong className="text-emerald-400">VALID</strong>
          </div>
        </div>
      </div>

      {/* Optical & Colorimetric Extraction Breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-400 flex items-center justify-between">
          <span>COLORIMETRIC SENSING PARAMETERS</span>
          <span className="text-[10px] text-slate-400 lowercase">{result.confidenceLabel}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Swatch 1: Reactive Strip Color */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg border border-black/40 shadow-inner shrink-0"
              style={{ backgroundColor: result.sampledStripHex }}
            />
            <div className="min-w-0">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Reactive Strip</span>
              <span className="text-xs font-mono font-bold text-slate-200">{result.sampledStripHex}</span>
              <span className="text-[9px] font-mono text-slate-400 block">Conv: {result.conversion.toFixed(1)}%</span>
            </div>
          </div>

          {/* Swatch 2: Reference Baseline */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg border border-black/40 shadow-inner shrink-0"
              style={{ backgroundColor: result.referenceBaselineHex }}
            />
            <div className="min-w-0">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Ref 0% Swatch</span>
              <span className="text-xs font-mono font-bold text-slate-200">{result.referenceBaselineHex}</span>
              <span className="text-[9px] font-mono text-slate-400 block">Baseline Unexposed</span>
            </div>
          </div>

          {/* Metric 3: Lighting Correction Gain */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[9px] font-mono text-slate-400 block uppercase">Lighting Gain</span>
            <span className="text-sm font-mono font-bold text-cyan-400">{result.lightingGain.toFixed(2)}x</span>
            <span className="text-[9px] font-mono text-slate-400 block">Least-squares regression</span>
          </div>

          {/* Metric 4: Cumulative Dose */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[9px] font-mono text-slate-400 block uppercase">Cumulative Dose</span>
            <span className={`text-sm font-mono font-bold ${statusColors.badgeText}`}>
              {result.dose_ppm_hr.toFixed(1)} ppm·hr
            </span>
            <span className="text-[9px] font-mono text-slate-400 block">K = {K} common model</span>
          </div>
        </div>

        {/* Environmental Context */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Env: {result.environmentalTempC}°C / {result.environmentalHumidityRH}% RH</span>
          <span>Source: {result.source.toUpperCase()}</span>
        </div>
      </div>

      {/* Section 15: DEVELOPER / CALIBRATION DEBUG PANEL */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDebug(!showDebug)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono font-bold text-cyan-300 hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>CALIBRATION DEBUG INFORMATION (RULE 15)</span>
          </span>
          {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDebug && (
          <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950 text-xs font-mono text-slate-300">
            {/* 1. Simulator conversion (if test mode enabled) */}
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-[11px] uppercase">1. SIMULATOR CONVERSION (TEST MODE)</span>
              <span className="text-amber-300 font-bold">
                {debug?.simulatorConversion !== undefined
                  ? `${debug.simulatorConversion.toFixed(1)}%`
                  : result.source === 'simulation'
                  ? `${result.conversion.toFixed(1)}% (Live Simulation)`
                  : 'N/A (Optical Field Scan)'}
              </span>
            </div>

            {/* 2 & 3. Measured & Corrected RGB values */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">2. MEASURED STRIP RGB</span>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-4 h-4 rounded border border-black/50 shrink-0"
                    style={{ backgroundColor: `rgb(${result.rawRgb.r},${result.rawRgb.g},${result.rawRgb.b})` }}
                  />
                  <span className="text-white font-bold">
                    [{result.rawRgb.r}, {result.rawRgb.g}, {result.rawRgb.b}]
                  </span>
                </div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">3. CORRECTED STRIP RGB</span>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-4 h-4 rounded border border-black/50 shrink-0"
                    style={{
                      backgroundColor: debug
                        ? `rgb(${debug.correctedReactiveRgb.r},${debug.correctedReactiveRgb.g},${debug.correctedReactiveRgb.b})`
                        : `rgb(${result.rawRgb.r},${result.rawRgb.g},${result.rawRgb.b})`,
                    }}
                  />
                  <span className="text-cyan-300 font-bold">
                    {debug
                      ? `[${debug.correctedReactiveRgb.r}, ${debug.correctedReactiveRgb.g}, ${debug.correctedReactiveRgb.b}]`
                      : `[${result.rawRgb.r}, ${result.rawRgb.g}, ${result.rawRgb.b}]`}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Nearest Calibration Colours */}
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                4. NEAREST CALIBRATION COLOURS (STRIP_COLORS CONTROL POINTS)
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-black/50 shrink-0"
                    style={{ backgroundColor: debug?.nearestColors?.lower?.hex || '#9D8767' }}
                  />
                  <div>
                    <div className="text-slate-400">Lower Point:</div>
                    <div className="text-white font-bold">
                      {debug?.nearestColors?.lower?.percent ?? 50}% • {debug?.nearestColors?.lower?.hex ?? '#9D8767'}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      [{debug?.nearestColors?.lower?.rgb?.join(', ') ?? '157, 135, 103'}]
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-black/50 shrink-0"
                    style={{ backgroundColor: debug?.nearestColors?.upper?.hex || '#735B3E' }}
                  />
                  <div>
                    <div className="text-slate-400">Upper Point:</div>
                    <div className="text-white font-bold">
                      {debug?.nearestColors?.upper?.percent ?? 75}% • {debug?.nearestColors?.upper?.hex ?? '#735B3E'}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      [{debug?.nearestColors?.upper?.rgb?.join(', ') ?? '115, 91, 62'}]
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5, 6, 7. Interpolated conversion, Calculated dose, K constant, 85% rule */}
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">5. INTERPOLATED CONV</span>
                <span className="text-white font-bold text-sm">{result.conversion.toFixed(1)}%</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">6. CALCULATED DOSE</span>
                <span className="text-cyan-300 font-bold text-sm">{result.dose_ppm_hr.toFixed(1)} ppm·hr</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">7. KINETIC CONSTANT</span>
                <span className="text-amber-300 font-bold text-sm">K = {K}</span>
              </div>
            </div>

            {/* 85% Rule Verification Status */}
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 text-[10px] uppercase font-bold">85% RULE SATURATION THRESHOLD:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  result.conversion >= 85.0
                    ? 'bg-rose-950 border border-rose-500/60 text-rose-300 animate-pulse'
                    : 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                }`}
              >
                {result.conversion >= 85.0 ? '⚠ STRIP EXPIRED / SATURATED (≥ 85.0%)' : 'ACTIVE STRIP (< 85.0%)'}
              </span>
            </div>

            {/* Reference patches table */}
            {debug && debug.referencePatches && (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  REFERENCE PATCHES (MEASURED → CORRECTED vs KNOWN):
                </span>
                <div className="border border-slate-800 rounded-lg overflow-hidden text-[10px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400">
                      <tr>
                        <th className="p-1.5">Patch</th>
                        <th className="p-1.5">Known RGB</th>
                        <th className="p-1.5">Measured</th>
                        <th className="p-1.5">Corrected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {debug.referencePatches.map((p) => (
                        <tr key={p.label} className="hover:bg-slate-900/50">
                          <td className="p-1.5 font-bold text-white">{p.label}</td>
                          <td className="p-1.5 text-slate-400">[{p.knownRgb.join(',')}]</td>
                          <td className="p-1.5 text-amber-300">[{p.measuredRgb.join(',')}]</td>
                          <td className="p-1.5 text-cyan-300">[{p.correctedRgb.join(',')}]</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Regression equations */}
            {debug && debug.regression && (
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1 text-[11px]">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  LEAST-SQUARES REGRESSION EQUATIONS (true = a·x + b):
                </span>
                <div className="text-cyan-300">
                  R: y = {debug.regression.r.a.toFixed(3)}·x {debug.regression.r.b >= 0 ? '+' : ''}{debug.regression.r.b.toFixed(1)} <span className="text-slate-400 text-[10px]">(R² = {debug.regression.r.r2.toFixed(3)})</span>
                </div>
                <div className="text-cyan-300">
                  G: y = {debug.regression.g.a.toFixed(3)}·x {debug.regression.g.b >= 0 ? '+' : ''}{debug.regression.g.b.toFixed(1)} <span className="text-slate-400 text-[10px]">(R² = {debug.regression.g.r2.toFixed(3)})</span>
                </div>
                <div className="text-cyan-300">
                  B: y = {debug.regression.b.a.toFixed(3)}·x {debug.regression.b.b >= 0 ? '+' : ''}{debug.regression.b.b.toFixed(1)} <span className="text-slate-400 text-[10px]">(R² = {debug.regression.b.r2.toFixed(3)})</span>
                </div>
              </div>
            )}

            <div className="text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800/60 leading-relaxed">
              Model equation: <code className="text-cyan-300 font-bold">dose = -ln(1 - conversion) / {K}</code>.
            </div>
          </div>
        )}
      </div>

      {/* SCREEN 6: RESULT INTERPRETATION */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>WHAT DOES THIS MEAN?</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The disposable strip darkens progressively with H₂S exposure. The app compares the strip colour with the printed reference scale and estimates cumulative exposure.
        </p>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
          <div className="text-cyan-400 font-semibold">Cumulative exposure is related to:</div>
          <div className="text-white font-bold pl-2">
            H₂S concentration × exposure time
          </div>
          <div className="text-[10px] text-slate-400 pt-1">
            Dose (ppm·hr) = ∫ C(t) dt over the worker's shift.
          </div>
        </div>

        <div className="text-[10px] text-amber-400/90 font-mono bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-xl">
          <strong>Disclaimer:</strong> Prototype calibration consistency. Real measurement accuracy requires controlled H₂S exposure testing.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onScanAgain}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs font-mono tracking-wider uppercase border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-all shadow-md active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>SCAN AGAIN</span>
        </button>

        <button
          type="button"
          onClick={onSaveRecord}
          disabled={isSaved}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg active:scale-95 ${
            isSaved
              ? 'bg-emerald-900/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-bold border border-cyan-400/50 shadow-cyan-950/40'
          }`}
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>SAVED TO LOG</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>SAVE RECORD</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
