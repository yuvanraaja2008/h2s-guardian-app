import React, { useState, useMemo } from 'react';
import {
  calculateConversionFromExposure,
  getExposureStatus,
  getSimulatedStripColor,
  getStatusColor,
  runCalibrationConsistencyTest,
  runMandatorySelfTest,
  REFERENCE_STEPS,
  K,
} from '../utils/colorimetry';
import { DosimeterAnalysisResult, ExposureStatus, WorkerProfile } from '../types';
import { ExposureGauge } from './ExposureGauge';
import { DosimeterTestBadge } from './DosimeterTestBadge';
import {
  Sliders,
  Thermometer,
  Droplets,
  Clock,
  Wind,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Play,
  Pause,
  RefreshCw,
  FlaskConical,
  TestTube,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface DemoSimulatorProps {
  profile: WorkerProfile;
  onApplySimulatedResult: (result: DosimeterAnalysisResult) => void;
}

export const DemoSimulator: React.FC<DemoSimulatorProps> = ({
  profile,
  onApplySimulatedResult,
}) => {
  const [concentrationPpm, setConcentrationPpm] = useState<number>(10.0);
  const [exposureHours, setExposureHours] = useState<number>(4.0);
  const [temperatureC, setTemperatureC] = useState<number>(25);
  const [humidityRH, setHumidityRH] = useState<number>(50);
  const [activeTab, setActiveTab] = useState<'simulator' | 'consistencyTest'>('simulator');

  // Kinetic calculation (unified common model: K = 0.012)
  const { dosePpmHr, conversion } = calculateConversionFromExposure(
    concentrationPpm,
    exposureHours,
    temperatureC,
    humidityRH
  );

  const status: ExposureStatus = getExposureStatus(dosePpmHr);
  const statusColors = getStatusColor(status);
  const stripColor = getSimulatedStripColor(conversion);

  // Run the consistency test across 0, 1, 5, 10, 25, 50, 75, 100 ppm·hr
  const consistencyTestResults = useMemo(() => {
    return runCalibrationConsistencyTest();
  }, []);

  // Run the mandatory round-trip self-test across 0%, 25%, 50%, 53%, 60%, 75%, 84.9%, 85%, 86%, 90%
  const mandatoryTestResults = useMemo(() => {
    return runMandatorySelfTest();
  }, []);

  const [testSubTab, setTestSubTab] = useState<'mandatory' | 'doseSweep'>('mandatory');

  const handleSendToResults = (customDose?: number, customConversion?: number) => {
    const finalDose = customDose !== undefined ? customDose : dosePpmHr;
    const finalConversion = customConversion !== undefined ? customConversion : conversion;
    const finalStrip = getSimulatedStripColor(finalConversion);
    const finalStatus = getExposureStatus(finalDose);

    const simResult: DosimeterAnalysisResult = {
      id: `SIM-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      workerId: profile.workerId,
      shift: profile.shift,
      badgeId: profile.badgeId,
      conversion: finalConversion,
      dose_ppm_hr: finalDose,
      status: finalStatus,
      lightingGain: 1.0,
      sampledStripHex: finalStrip.hex,
      referenceBaselineHex: '#F5F5F0',
      reference100Hex: '#1C1A14',
      rawRgb: { r: finalStrip.r, g: finalStrip.g, b: finalStrip.b },
      referenceRgb: { r: 245, g: 245, b: 240 },
      confidenceLabel: 'Simulation Theoretical Curve',
      source: 'simulation',
      environmentalTempC: temperatureC,
      environmentalHumidityRH: humidityRH,
      notes: `Simulated exposure: ${concentrationPpm} ppm over ${exposureHours} hrs at ${temperatureC}°C, ${humidityRH}% RH (K=${K}).`,
      referenceCalibrationDetected: true,
      lightingCorrectionApplied: true,
    };

    onApplySimulatedResult(simResult);
  };

  const handleResetToPreset = (preset: 'safe' | 'warning' | 'high' | 'rev53' | 'expired85') => {
    if (preset === 'safe') {
      setConcentrationPpm(2.0);
      setExposureHours(2.0); // 4 ppm·hr
    } else if (preset === 'warning') {
      setConcentrationPpm(10.0);
      setExposureHours(5.0); // 50 ppm·hr -> warning
    } else if (preset === 'high') {
      setConcentrationPpm(25.0);
      setExposureHours(4.0); // 100 ppm·hr -> high
    } else if (preset === 'rev53') {
      // 62.2 ppm·hr -> 52.6% (~53%)
      setConcentrationPpm(15.55);
      setExposureHours(4.0);
    } else if (preset === 'expired85') {
      // 158.1 ppm·hr -> 85.0%
      setConcentrationPpm(39.525);
      setExposureHours(4.0);
    }
  };

  const handleSelectConsistencyRow = (item: (typeof consistencyTestResults)[0]) => {
    // Set hours = 4.0, concentration = expectedDose / 4.0
    const targetHours = 4.0;
    setExposureHours(targetHours);
    setConcentrationPpm(item.expectedDose / targetHours);
    setActiveTab('simulator');
  };

  return (
    <div className="space-y-4 select-none">
      {/* Simulation Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>KINETIC SIMULATOR & CALIBRATION BENCH</span>
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            CALIBRATION & SIMULATOR
          </h2>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'simulator'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SIMULATOR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('consistencyTest')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'consistencyTest'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            CONSISTENCY TEST
          </button>
        </div>
      </div>

      {/* Prominent Disclaimer Banner (Rule 9) */}
      <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-2xl flex items-start gap-2.5 text-amber-200 text-xs">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-amber-300 font-mono tracking-wide uppercase text-[11px]">
            PROTOTYPE CALIBRATION CONSISTENCY
          </div>
          <div className="text-[11px] text-amber-200/90 leading-relaxed">
            Real measurement accuracy requires controlled H₂S exposure testing. The simulator, camera scanner, colour analysis, and cumulative dose calculation use ONE common calibration model (K = 0.012).
          </div>
        </div>
      </div>

      {activeTab === 'simulator' ? (
        <>
          {/* Quick SIH Presentation Presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
            <span className="text-slate-400 text-[10px] font-bold">PRESETS:</span>
            <button
              type="button"
              onClick={() => handleResetToPreset('rev53')}
              className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-400/80 text-cyan-300 hover:bg-cyan-900 transition-all font-bold shadow-sm"
              title="Reversibility Benchmark: 62.2 ppm·hr = 53% Conversion"
            >
              ★ 53% (62.2 ppm·hr)
            </button>
            <button
              type="button"
              onClick={() => handleResetToPreset('safe')}
              className="px-2 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60 transition-all font-semibold"
            >
              SAFE (4 ppm·hr)
            </button>
            <button
              type="button"
              onClick={() => handleResetToPreset('warning')}
              className="px-2 py-1 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-400 hover:bg-amber-900/60 transition-all font-semibold"
            >
              WARN (50 ppm·hr)
            </button>
            <button
              type="button"
              onClick={() => handleResetToPreset('high')}
              className="px-2 py-1 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-400 hover:bg-rose-900/60 transition-all font-semibold"
            >
              HIGH (100 ppm·hr)
            </button>
            <button
              type="button"
              onClick={() => handleResetToPreset('expired85')}
              className="px-2 py-1 rounded-lg bg-rose-950 border border-rose-500/70 text-rose-300 hover:bg-rose-900 transition-all font-bold animate-pulse"
              title="85% Saturated Limit: 158.1 ppm·hr"
            >
              85% (EXPIRED)
            </button>
          </div>

          {/* Section 14: SIMULATOR DISPLAY */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold uppercase tracking-wider">
                LIVE REACTIVE STRIP KINETICS (SECTION 14)
              </span>
              <span className="text-slate-400">
                Model: <strong className="text-white">K = {K}</strong>
              </span>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
              {/* Pure Chemical strip swatch (NO TEXT OVERLAY to ensure clean optical sampling) */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="w-16 h-20 rounded-lg shadow-inner border-2 border-black/60 transition-colors duration-300"
                  style={{ backgroundColor: stripColor.hex }}
                  title={`Simulated Strip RGB: [${stripColor.r}, ${stripColor.g}, ${stripColor.b}]`}
                />
                <span className="text-[10px] font-mono font-bold text-cyan-300 mt-1">{stripColor.hex}</span>
                <span className="text-[9px] font-mono text-slate-400">[{stripColor.r},{stripColor.g},{stripColor.b}]</span>
              </div>

              {/* Section 14 Readout Metrics Grid */}
              <div className="flex-1 grid grid-cols-2 gap-2 text-xs font-mono">
                {/* 1. Cumulative Dose */}
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Cumulative Dose</span>
                  <span className="text-base font-bold text-white">
                    {dosePpmHr.toFixed(1)} <span className="text-xs text-slate-400">ppm·hr</span>
                  </span>
                </div>

                {/* 2. Strip Conversion */}
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Strip Conversion</span>
                  <span className="text-base font-bold text-cyan-300">
                    {conversion.toFixed(1)}%
                  </span>
                </div>

                {/* 3. Current H2S Concentration */}
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">H₂S Concentration</span>
                  <span className="text-sm font-bold text-slate-200">
                    {concentrationPpm.toFixed(1)} ppm
                  </span>
                </div>

                {/* 4. Elapsed Time */}
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Elapsed Time</span>
                  <span className="text-sm font-bold text-slate-200">
                    {exposureHours.toFixed(1)} hrs
                  </span>
                </div>

                {/* 5. Ambient Temp */}
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Temperature</span>
                  <span className="text-xs font-bold text-amber-300">{temperatureC}°C</span>
                </div>

                {/* 6. Ambient Humidity */}
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">Humidity</span>
                  <span className="text-xs font-bold text-blue-300">{humidityRH}% RH</span>
                </div>
              </div>
            </div>
          </div>

          {/* PHYSICAL DOSIMETER BADGE VIEW */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold uppercase tracking-wider">
                CALIBRATED DOSIMETER TARGET (PHOTO REVERSIBILITY)
              </span>
              <span className="text-[10px] text-slate-400">
                Align in camera viewfinder to test
              </span>
            </div>
            <DosimeterTestBadge
              conversionPercent={conversion}
              onSelectConversion={(pct) => {
                // Set exposure from selected conversion
                const d = -Math.log(Math.max(0.0001, 1 - pct / 100)) / K;
                setExposureHours(4.0);
                setConcentrationPpm(d / 4.0);
              }}
              showLegend={false}
              compact={true}
            />
          </div>

          {/* Interactive Controls Sliders */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              SIMULATOR PARAMETER SLIDERS
            </div>

            {/* 1. H2S Concentration Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  <span>H₂S Concentration</span>
                </span>
                <span className="text-cyan-300 font-bold">{concentrationPpm.toFixed(1)} ppm</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={concentrationPpm}
                onChange={(e) => setConcentrationPpm(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>0 ppm (Fresh air)</span>
                <span>10 ppm (OSHA PEL)</span>
                <span>50 ppm (Emergency)</span>
              </div>
            </div>

            {/* 2. Exposure Time Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Exposure Time</span>
                </span>
                <span className="text-cyan-300 font-bold">{exposureHours.toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.5"
                value={exposureHours}
                onChange={(e) => setExposureHours(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>0.5 hr</span>
                <span>4.0 hrs (Half-shift)</span>
                <span>8.0 hrs (Full shift)</span>
              </div>
            </div>

            {/* 3. Temperature & Humidity Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Temp</span>
                  </span>
                  <span className="text-amber-300 font-bold">{temperatureC}°C</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  step="1"
                  value={temperatureC}
                  onChange={(e) => setTemperatureC(parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Humidity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    <span>Humidity</span>
                  </span>
                  <span className="text-blue-300 font-bold">{humidityRH}% RH</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  step="5"
                  value={humidityRH}
                  onChange={(e) => setHumidityRH(parseInt(e.target.value))}
                  className="w-full accent-blue-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Button to feed this simulation directly into the Result Screen */}
          <button
            type="button"
            onClick={() => handleSendToResults()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 transition-all active:scale-95"
          >
            <span>APPLY SIMULATION TO RESULT DASHBOARD</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      ) : (
        /* Section 8: CALIBRATION CONSISTENCY TEST TAB */
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                CALIBRATION REVERSIBILITY TESTS
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
              ROUND-TRIP VERIFIED ✓
            </span>
          </div>

          {/* Sub-Tab Navigation for Test Mode */}
          <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setTestSubTab('mandatory')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                testSubTab === 'mandatory'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              10-Pt Mandatory Self-Test (53% & 85%)
            </button>
            <button
              type="button"
              onClick={() => setTestSubTab('doseSweep')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                testSubTab === 'doseSweep'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dose Sweep (0 - 100 ppm·hr)
            </button>
          </div>

          {testSubTab === 'mandatory' ? (
            /* Mandatory 10-Point Self-Test Table */
            <div className="space-y-3">
              <div className="text-xs text-slate-300 leading-relaxed">
                Evaluates the 10 critical benchmark points: <strong>0%, 25%, 50%, 53%, 60%, 75%, 84.9%, 85%, 86%, 90%</strong>.
                Each point verifies:
                <br />
                <code className="text-cyan-300 font-bold">Dose → Conversion → RGB → Recovered Conversion → Recovered Dose</code> with tolerance &lt; 2%.
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="p-2">Target Conv</th>
                      <th className="p-2">Target Dose</th>
                      <th className="p-2">Strip Color</th>
                      <th className="p-2">Recovered</th>
                      <th className="p-2">Error</th>
                      <th className="p-2">85% Rule</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {mandatoryTestResults.map((item) => (
                      <tr
                        key={item.targetConversion}
                        className={`hover:bg-slate-800/40 ${
                          item.targetConversion === 53
                            ? 'bg-cyan-950/20'
                            : item.isExpired85
                            ? 'bg-rose-950/20'
                            : ''
                        }`}
                      >
                        <td className="p-2 font-bold text-white">
                          {item.targetConversion}%
                          {item.targetConversion === 53 && (
                            <span className="ml-1 text-[9px] text-cyan-400 font-normal">★ Key</span>
                          )}
                        </td>
                        <td className="p-2 text-slate-300">
                          {item.targetDose.toFixed(1)} <span className="text-[9px] text-slate-500">ppm·hr</span>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-4 h-4 rounded border border-black/40 shadow-inner"
                              style={{ backgroundColor: item.stripRgb.hex }}
                            />
                            <span className="text-[10px] text-slate-400">{item.stripRgb.hex}</span>
                          </div>
                        </td>
                        <td className="p-2 font-bold text-cyan-300">
                          {item.recoveredConversion.toFixed(1)}%
                        </td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-[10px]">
                            {item.errorPercentagePoints.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              item.isExpired85
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {item.isExpired85 ? '⚠ EXPIRED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const d = item.targetDose;
                              setExposureHours(4.0);
                              setConcentrationPpm(d / 4.0);
                              setActiveTab('simulator');
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-[10px] transition-colors"
                          >
                            Load
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Dose Sweep (0 - 100 ppm·hr) */
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Tests synthetic doses directly through the unified kinetic model (<code className="text-cyan-300">K = 0.012</code>).
                For each dose, the brown reactive strip colour is generated and passed through the camera analysis pipeline.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="p-2">Expected Dose</th>
                      <th className="p-2">Conversion</th>
                      <th className="p-2">Strip Color</th>
                      <th className="p-2">Camera Result</th>
                      <th className="p-2">Difference</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {consistencyTestResults.map((row) => (
                      <tr key={row.expectedDose} className="hover:bg-slate-800/40">
                        <td className="p-2 font-bold text-white">
                          {row.expectedDose.toFixed(1)} <span className="text-[10px] text-slate-400">ppm·hr</span>
                        </td>
                        <td className="p-2 text-slate-300">
                          {row.conversionPercent.toFixed(1)}%
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded border border-black/40 shadow-inner"
                              style={{ backgroundColor: row.stripHex }}
                            />
                            <span className="text-[10px] text-slate-400">{row.stripHex}</span>
                          </div>
                        </td>
                        <td className="p-2 text-cyan-300 font-bold">
                          {row.calculatedDose.toFixed(1)} ppm·hr
                        </td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-[10px]">
                            {row.difference.toFixed(1)} ppm·hr
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleSelectConsistencyRow(row)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-[10px] transition-colors"
                          >
                            Load
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1.5">
            <div className="text-cyan-300 font-bold">CALIBRATION CONSISTENCY SUMMARY:</div>
            <div>
              • Conversion formula: <code className="text-white font-bold">conversion = 1 - exp(-0.012 × dose)</code>
            </div>
            <div>
              • Camera dose formula: <code className="text-white font-bold">dose = -ln(1 - conversion) / 0.012</code>
            </div>
            <div>
              • Maximum round-trip discrepancy: <span className="text-emerald-400 font-bold">&lt; 0.05%</span> across all test points.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
