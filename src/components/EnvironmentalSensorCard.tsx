import React from 'react';
import {
  Thermometer,
  Droplets,
  Bluetooth,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export type BleConnectionStatus =
  | 'off'
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface EnvironmentalSensorCardProps {
  isSensorEnabled: boolean;
  connectionStatus: BleConnectionStatus;
  temperature: number | null;
  humidity: number | null;
  errorMessage: string | null;
  onToggleEnabled: (enabled: boolean) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const EnvironmentalSensorCard: React.FC<EnvironmentalSensorCardProps> = ({
  isSensorEnabled,
  connectionStatus,
  temperature,
  humidity,
  errorMessage,
  onToggleEnabled,
  onConnect,
  onDisconnect,
}) => {
  return (
    <div className="sleek-card border border-slate-800/90 relative overflow-hidden">
      {/* Ambient background glow when connected */}
      {connectionStatus === 'connected' && (
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-15 bg-cyan-400 pointer-events-none" />
      )}

      {/* Header with Title and Toggle Switch */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
              connectionStatus === 'connected'
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              ENVIRONMENTAL SENSOR
            </h3>
            <span className="text-[10px] font-mono text-slate-400 block">
              DHT11 via ESP32 BLE
            </span>
          </div>
        </div>

        {/* ON / OFF Toggle Switch Control */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-mono font-bold tracking-wider ${
              isSensorEnabled ? 'text-cyan-400' : 'text-slate-500'
            }`}
          >
            [{isSensorEnabled ? ' ON ' : ' OFF '}]
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isSensorEnabled}
            onClick={() => onToggleEnabled(!isSensorEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 cursor-pointer ${
              isSensorEnabled ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
            title={isSensorEnabled ? 'Turn OFF Environmental Sensor' : 'Turn ON Environmental Sensor'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${
                isSensorEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Body: State-dependent views */}
      <div className="pt-3">
        {/* State 1: Sensor OFF */}
        {!isSensorEnabled && (
          <div className="py-2 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Sensor OFF</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
              Toggle ON to discover and connect to the ESP32 DHT11 sensor.
            </p>
          </div>
        )}

        {/* Sensor ON States */}
        {isSensorEnabled && (
          <div className="space-y-3">
            {/* Status indicator row */}
            <div className="flex items-center justify-between">
              {/* Connected State */}
              {connectionStatus === 'connected' && (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Connected
                  </span>
                </div>
              )}

              {/* Connecting State */}
              {connectionStatus === 'connecting' && (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Connecting
                  </span>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin ml-1" />
                </div>
              )}

              {/* Disconnected State */}
              {connectionStatus === 'disconnected' && (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    Disconnected
                  </span>
                </div>
              )}

              {/* Error State */}
              {connectionStatus === 'error' && (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                  <span className="text-xs font-mono font-bold text-rose-400">
                    Error
                  </span>
                </div>
              )}

              {/* Disconnect button when connected */}
              {connectionStatus === 'connected' && (
                <button
                  type="button"
                  onClick={onDisconnect}
                  className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-rose-300 transition-colors px-2 py-1 rounded bg-slate-800/80 border border-slate-700 hover:border-rose-500/40"
                >
                  Disconnect
                </button>
              )}
            </div>

            {/* Live Telemetry Display (Connected) */}
            {connectionStatus === 'connected' && (
              <div className="grid grid-cols-2 gap-3">
                {/* Temperature Block */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Temperature</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-white tracking-tight">
                    {temperature !== null ? temperature.toFixed(1) : '--'}
                    <span className="text-xs font-mono text-amber-400 font-bold ml-1">°C</span>
                  </div>
                </div>

                {/* Humidity Block */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Humidity</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-white tracking-tight">
                    {humidity !== null ? humidity.toFixed(1) : '--'}
                    <span className="text-xs font-mono text-cyan-400 font-bold ml-1">% RH</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message Display */}
            {connectionStatus === 'error' && errorMessage && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-sans">{errorMessage}</span>
              </div>
            )}

            {/* Connect / Retry Button (when disconnected or error) */}
            {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
              <button
                type="button"
                onClick={onConnect}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bluetooth className="w-4 h-4" />
                <span>CONNECT SENSOR</span>
              </button>
            )}

            {/* Searching / Connecting State Button */}
            {connectionStatus === 'connecting' && (
              <button
                type="button"
                disabled
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-400 font-bold font-mono text-xs uppercase tracking-wider cursor-wait flex items-center justify-center gap-2 border border-slate-700"
              >
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>SEARCHING FOR ESP32...</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
