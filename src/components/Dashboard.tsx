import React from 'react';
import { WorkerProfile, DosimeterAnalysisResult, ExposureStatus } from '../types';
import { getStatusColor } from '../utils/colorimetry';
import { BleConnectionStatus, EnvironmentalSensorCard } from './EnvironmentalSensorCard';
import {
  Shield,
  Camera,
  Activity,
  FileSpreadsheet,
  Thermometer,
  Droplets,
  AlertCircle,
  Clock,
  User,
  Sliders,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface DashboardProps {
  profile: WorkerProfile;
  latestResult: DosimeterAnalysisResult | null;
  isSensorEnabled: boolean;
  sensorConnectionStatus: BleConnectionStatus;
  sensorTemperature: number | null;
  sensorHumidity: number | null;
  sensorError: string | null;
  onToggleSensor: (enabled: boolean) => void;
  onConnectSensor: () => void;
  onDisconnectSensor: () => void;
  onScanClick: () => void;
  onSetupClick: () => void;
  onOpenDemo: () => void;
  onViewBadgeTarget: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  latestResult,
  isSensorEnabled,
  sensorConnectionStatus,
  sensorTemperature,
  sensorHumidity,
  sensorError,
  onToggleSensor,
  onConnectSensor,
  onDisconnectSensor,
  onScanClick,
  onSetupClick,
  onOpenDemo,
  onViewBadgeTarget,
}) => {
  // Current status values (defaulting to latest result or 0.0 SAFE)
  const currentStatus: ExposureStatus = latestResult?.status || 'SAFE';
  const cumulativeDose = latestResult?.dose_ppm_hr || 0.0;
  const statusColors = getStatusColor(currentStatus);

  return (
    <div className="space-y-4 select-none">
      {/* App Subtitle Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
            PASSIVE EXPOSURE DOSIMETRY
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            SHIFT MONITORING
          </h2>
        </div>

        {/* Environmental Telemetry Capsule */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-full text-[10px] font-mono text-slate-300">
          <div className="flex items-center gap-1 text-amber-400">
            <Thermometer className="w-3 h-3" />
            <span>25°C</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-blue-400">
            <Droplets className="w-3 h-3" />
            <span>50% RH</span>
          </div>
        </div>
      </div>

      <EnvironmentalSensorCard
        isSensorEnabled={isSensorEnabled}
        connectionStatus={sensorConnectionStatus}
        temperature={sensorTemperature}
        humidity={sensorHumidity}
        errorMessage={sensorError}
        onToggleEnabled={onToggleSensor}
        onConnect={onConnectSensor}
        onDisconnect={onDisconnectSensor}
      />

      {/* Large Status Card (Sleek Interface style) */}
      <div className="sleek-card relative overflow-hidden">
        {/* Subtle radial ambient illumination */}
        <div
          className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: statusColors.hex }}
        />

        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-sans font-bold tracking-wider text-slate-400 uppercase">
              CURRENT STATUS
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors.badgeBg} ${statusColors.badgeText} border ${statusColors.badgeBorder}`}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors.hex }} />
                {currentStatus}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-sans text-slate-400 uppercase block">
              Cumulative Exposure
            </span>
            <div className="flex items-baseline justify-end gap-1 mt-0.5">
              <span className="text-3xl font-black font-mono text-white tracking-tight">
                {cumulativeDose.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-400">ppm·hr</span>
            </div>
          </div>
        </div>

        {/* Worker, Shift, Badge Info Strip */}
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Worker</span>
            <strong className="text-white text-sm font-mono">{profile.workerId}</strong>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Shift</span>
            <strong className="text-cyan-400 text-sm font-mono">{profile.shift}</strong>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Badge</span>
            <strong className={profile.isExpired ? 'text-amber-400 text-sm font-mono' : 'text-emerald-400 text-sm font-mono'}>
              {profile.isExpired ? 'EXPIRED' : 'ACTIVE'}
            </strong>
          </div>
        </div>

        {/* Expired warning if applicable */}
        {profile.isExpired && (
          <div className="mt-3 p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Badge expired! Replace before scanning.</span>
            </div>
            <button
              type="button"
              onClick={onSetupClick}
              className="text-[10px] underline font-mono text-amber-300 hover:text-white"
            >
              Update
            </button>
          </div>
        )}
      </div>

      {/* Prominent SCAN DOSIMETER Button (Sleek Interface Cyan Accent) */}
      <button
        type="button"
        onClick={onScanClick}
        disabled={profile.isExpired}
        className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${
          profile.isExpired
            ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
        }`}
      >
        <Camera className="w-5 h-5 text-slate-950" />
        <span>SCAN DOSIMETER</span>
        <ArrowRight className="w-4 h-4 text-slate-950" />
      </button>

      {/* Quick Access Utility Links */}
      <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
        <button
          type="button"
          onClick={onOpenDemo}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-amber-400 transition-all font-semibold"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Demo Simulator</span>
        </button>

        <button
          type="button"
          onClick={onViewBadgeTarget}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-cyan-400 transition-all font-semibold"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Inspect Badge Target</span>
        </button>
      </div>

      {/* Three Core Feature Cards */}
      <div className="space-y-2.5">
        {/* Card 1: Cumulative Exposure */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Cumulative Exposure
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Measures estimated concentration × time exposure (ppm·hr) derived from chemical precipitation kinetics.
            </p>
          </div>
        </div>

        {/* Card 2: Camera Analysis */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Camera Analysis
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Reads the colorimetric strip using the smartphone camera as a digital reader with printed reference scale normalization.
            </p>
          </div>
        </div>

        {/* Card 3: Digital Record */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Digital Record
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Stores worker ID, shift, and cumulative exposure history with traceable colorimetric telemetry for safety compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Environmental Kinetic Compensation Banner */}
      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
        <span className="text-slate-300 font-semibold font-mono block text-[10px] uppercase mb-0.5">
          ENVIRONMENTAL REACTION KINETICS
        </span>
        Temperature and humidity can affect colorimetric reaction kinetics. Environmental compensation requires experimental calibration.
      </div>

      {/* Required Prototype Disclaimer */}
      <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-[10px] text-slate-400 text-center font-mono italic">
        "Prototype decision-support system. Not a certified replacement for industrial gas detectors."
      </div>
    </div>
  );
};
