import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  WorkerProfile,
  DosimeterAnalysisResult,
  ShiftType,
} from './types';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { WorkerSetup } from './components/WorkerSetup';
import { CameraScanner } from './components/CameraScanner';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ResultCard } from './components/ResultCard';
import { HistoryView } from './components/HistoryView';
import { DemoSimulator } from './components/DemoSimulator';
import { DosimeterModal } from './components/DosimeterModal';
import { BleConnectionStatus } from './components/EnvironmentalSensorCard';
import { analyzeDosimeterImage, getBackendConfig, saveBackendConfig, BackendConfig } from './services/dosimeterService';
import { connectToH2SGuardian, disconnectFromH2SGuardian } from './services/bleService';
import { Server, Settings, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [analysisMessage, setAnalysisMessage] = useState<string>('');

  // Modals
  const [modalType, setModalType] = useState<'target' | 'info' | null>(null);

  // Worker Profile State
  const [profile, setProfile] = useState<WorkerProfile>(() => {
    const saved = localStorage.getItem('h2s_worker_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      workerId: 'W001',
      shift: 'Morning',
      badgeId: 'BDG-7049-H2S',
      expiryDate: '2026-12-31',
      isExpired: false,
      department: 'Refinery / Desulfurization Unit 4',
    };
  });

  // Latest scan result
  const [latestResult, setLatestResult] = useState<DosimeterAnalysisResult | null>(() => {
    const saved = localStorage.getItem('h2s_latest_result');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return null;
  });

  // Historical Records
  const [history, setHistory] = useState<DosimeterAnalysisResult[]>(() => {
    const saved = localStorage.getItem('h2s_history_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Demo Mode toggle
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // FastAPI backend configuration modal / status
  const [showBackendConfig, setShowBackendConfig] = useState<boolean>(false);
  const [backendConfig, setBackendStateConfig] = useState<BackendConfig>(getBackendConfig());

  // Environmental ESP32 sensor state
  const [isSensorEnabled, setIsSensorEnabled] = useState(false);
  const [sensorConnectionStatus, setSensorConnectionStatus] = useState<BleConnectionStatus>('off');
  const [sensorTemperature, setSensorTemperature] = useState<number | null>(null);
  const [sensorHumidity, setSensorHumidity] = useState<number | null>(null);
  const [sensorError, setSensorError] = useState<string | null>(null);
  const sensorDeviceIdRef = useRef<string | null>(null);
  const sensorConnectionAttemptRef = useRef(0);

  const handleConnectSensor = async () => {
    const connectionAttempt = ++sensorConnectionAttemptRef.current;
    setSensorConnectionStatus('connecting');
    setSensorError(null);

    try {
      const device = await connectToH2SGuardian(
        (temperature, humidity) => {
          if (sensorConnectionAttemptRef.current !== connectionAttempt) return;
          setSensorTemperature(temperature);
          setSensorHumidity(humidity);
        },
        () => {
          if (sensorConnectionAttemptRef.current !== connectionAttempt) return;
          sensorDeviceIdRef.current = null;
          setSensorConnectionStatus('disconnected');
        }
      );

      if (sensorConnectionAttemptRef.current !== connectionAttempt) {
        await disconnectFromH2SGuardian(device.deviceId);
        return;
      }

      sensorDeviceIdRef.current = device.deviceId;
      setSensorConnectionStatus('connected');
    } catch (error) {
      if (sensorConnectionAttemptRef.current !== connectionAttempt) return;
      setSensorConnectionStatus('error');
      setSensorError(error instanceof Error ? error.message : 'Unable to connect to environmental sensor.');
    }
  };

  const handleDisconnectSensor = async (disableSensor = false) => {
    ++sensorConnectionAttemptRef.current;
    const deviceId = sensorDeviceIdRef.current;
    sensorDeviceIdRef.current = null;
    setSensorConnectionStatus(disableSensor ? 'off' : 'disconnected');
    setSensorTemperature(null);
    setSensorHumidity(null);
    setSensorError(null);
    await disconnectFromH2SGuardian(deviceId || undefined);
  };

  const handleToggleSensor = (enabled: boolean) => {
    setIsSensorEnabled(enabled);
    if (enabled) {
      void handleConnectSensor();
    } else {
      void handleDisconnectSensor(true);
    }
  };

  useEffect(() => {
    return () => {
      ++sensorConnectionAttemptRef.current;
      void disconnectFromH2SGuardian(sensorDeviceIdRef.current || undefined);
    };
  }, []);

  // Save profile to localStorage on change
  useEffect(() => {
    localStorage.setItem('h2s_worker_profile', JSON.stringify(profile));
  }, [profile]);

  // Save history to localStorage on change
  useEffect(() => {
    localStorage.setItem('h2s_history_records', JSON.stringify(history));
  }, [history]);

  // Save latest result to localStorage
  useEffect(() => {
    if (latestResult) {
      localStorage.setItem('h2s_latest_result', JSON.stringify(latestResult));
    }
  }, [latestResult]);

  // Handle Scan button tap
  const handleStartScan = () => {
    if (profile.isExpired) {
      setActiveTab('setup');
      return;
    }
    setIsScanning(true);
  };

  // Perform Image Analysis Pipeline
  const handleAnalyzeCaptured = async (canvas: HTMLCanvasElement) => {
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setAnalysisMessage('Detecting printed calibration reference scale...');

    try {
      const result = await analyzeDosimeterImage({
        canvas,
        workerId: profile.workerId,
        shift: profile.shift,
        badgeId: profile.badgeId,
        environmentalTempC: 25,
        environmentalHumidityRH: 50,
        onProgressStep: (step, msg) => {
          setAnalysisStep(step);
          setAnalysisMessage(msg);
        },
      });

      // Brief finish delay for visual completion
      setTimeout(() => {
        setIsAnalyzing(false);
        setIsScanning(false);
        setLatestResult(result);
        setActiveTab('dashboard');
      }, 700);
    } catch (err) {
      console.error('Analysis error:', err);
      setIsAnalyzing(false);
    }
  };

  // Save result to digital record history
  const handleSaveCurrentResult = () => {
    if (!latestResult) return;
    const exists = history.some((h) => h.id === latestResult.id);
    if (!exists) {
      setHistory([latestResult, ...history]);
    }
  };

  // Load realistic demonstration records for SIH evaluation
  const handleLoadDemoRecords = () => {
    const demoRecords: DosimeterAnalysisResult[] = [
      {
        id: 'REC-940211',
        timestamp: new Date(Date.now() - 3600000 * 28).toISOString(),
        workerId: 'W001',
        shift: 'Morning',
        badgeId: 'BDG-7049-H2S',
        conversion: 65.1,
        dose_ppm_hr: 87.6,
        status: 'WARNING',
        lightingGain: 1.05,
        sampledStripHex: '#6F5442',
        referenceBaselineHex: '#E8E0CA',
        reference100Hex: '#2A1E18',
        rawRgb: { r: 111, g: 84, b: 66 },
        referenceRgb: { r: 232, g: 224, b: 202 },
        confidenceLabel: 'Prototype Colorimetric Estimate',
        source: 'camera',
        environmentalTempC: 26,
        environmentalHumidityRH: 52,
        notes: 'Shift completed near amine treating unit. Strip darkened to medium brown.',
      },
      {
        id: 'REC-939840',
        timestamp: new Date(Date.now() - 3600000 * 52).toISOString(),
        workerId: 'W001',
        shift: 'Night',
        badgeId: 'BDG-7041-H2S',
        conversion: 18.4,
        dose_ppm_hr: 8.2,
        status: 'SAFE',
        lightingGain: 1.12,
        sampledStripHex: '#C5B59E',
        referenceBaselineHex: '#E8E0CA',
        reference100Hex: '#2A1E18',
        rawRgb: { r: 197, g: 181, b: 158 },
        referenceRgb: { r: 232, g: 224, b: 202 },
        confidenceLabel: 'Prototype Colorimetric Estimate',
        source: 'camera',
        environmentalTempC: 22,
        environmentalHumidityRH: 58,
        notes: 'Routine perimeter inspection shift.',
      },
      {
        id: 'REC-938210',
        timestamp: new Date(Date.now() - 3600000 * 76).toISOString(),
        workerId: 'W002',
        shift: 'Afternoon',
        badgeId: 'BDG-7033-H2S',
        conversion: 78.5,
        dose_ppm_hr: 118.0,
        status: 'HIGH',
        lightingGain: 0.98,
        sampledStripHex: '#4E382A',
        referenceBaselineHex: '#E8E0CA',
        reference100Hex: '#2A1E18',
        rawRgb: { r: 78, g: 56, b: 42 },
        referenceRgb: { r: 232, g: 224, b: 202 },
        confidenceLabel: 'Prototype Colorimetric Estimate',
        source: 'camera',
        environmentalTempC: 31,
        environmentalHumidityRH: 64,
        notes: 'Sour water stripper maintenance. Evacuation protocol initiated.',
      },
    ];

    setHistory(demoRecords);
    if (!latestResult) {
      setLatestResult(demoRecords[0]);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear all logged dosimeter history records?')) {
      setHistory([]);
    }
  };

  // Profile save handler
  const handleSaveProfile = (newProfile: WorkerProfile) => {
    setProfile(newProfile);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center antialiased selection:bg-cyan-500 selection:text-white p-0 lg:p-6 select-none">
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-6">
        
        {/* LEFT SIDEBAR (Visible on Desktop lg:) */}
        <aside className="hidden lg:flex flex-col w-[280px] gap-4 shrink-0 justify-between">
          <div className="space-y-4">
            {/* Brand Card */}
            <div className="sleek-brand-card">
              <div className="text-lg font-black text-cyan-400 tracking-wider">H₂S GUARDIAN</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                Industrial Exposure Monitor
              </div>
            </div>

            {/* Environmental Data Card */}
            <div className="sleek-card">
              <div className="sleek-card-title">Environmental Data</div>
              <div className="sleek-stat-row">
                <span className="sleek-stat-label">Temperature</span>
                <span className="sleek-stat-value">24.8 °C</span>
              </div>
              <div className="sleek-stat-row">
                <span className="sleek-stat-label">Humidity</span>
                <span className="sleek-stat-value">52.4 % RH</span>
              </div>
              <div className="sleek-stat-row">
                <span className="sleek-stat-label">Pressure</span>
                <span className="sleek-stat-value">101.2 kPa</span>
              </div>
            </div>

            {/* Analysis Pipeline Card */}
            <div className="sleek-card">
              <div className="sleek-card-title">Analysis Pipeline</div>
              <div className={`sleek-pipeline-step ${latestResult || isScanning ? 'done' : ''}`}>
                <div className="sleek-step-dot" />
                <div className="text-xs">Image Capture</div>
              </div>
              <div className={`sleek-pipeline-step ${latestResult ? 'done' : ''}`}>
                <div className="sleek-step-dot" />
                <div className="text-xs">Reference Detection</div>
              </div>
              <div className={`sleek-pipeline-step ${latestResult ? 'done' : ''}`}>
                <div className="sleek-step-dot" />
                <div className="text-xs">Lighting Correction</div>
              </div>
              <div className={`sleek-pipeline-step ${latestResult ? 'done' : ''}`}>
                <div className="sleek-step-dot" />
                <div className="text-xs">Dose Calculation</div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-relaxed px-2 font-mono">
            Prototype decision-support system. Not a certified replacement for industrial gas detectors.
          </div>
        </aside>

        {/* CENTER COLUMN: Mobile Device Frame (Mobile Fluid, Desktop Bezel) */}
        <div className="w-full max-w-md lg:w-[360px] h-screen lg:h-[720px] lg:max-h-[calc(100vh-48px)] flex flex-col sleek-phone-frame relative overflow-hidden shrink-0 border-x lg:border-[12px] border-slate-800 lg:border-[#1F2937]">
          
          {/* Global Industrial Safety Header */}
          <Header
            isDemoMode={isDemoMode}
            onToggleDemo={() => {
              const next = !isDemoMode;
              setIsDemoMode(next);
              if (next) setActiveTab('demo');
            }}
            onShowInfoModal={() => setModalType('info')}
          />

          {/* Sub-Header Industrial Status Bar */}
          <div className="px-4 py-1.5 sleek-glass border-b border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>OPTICAL DOSIMETER v2.6</span>
            </div>

            <button
              type="button"
              onClick={() => setShowBackendConfig(!showBackendConfig)}
              className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <Server className="w-3 h-3" />
              <span>{backendConfig.useRemoteBackend ? 'FastAPI Remote' : 'Client Vision'}</span>
            </button>
          </div>

          {/* Backend FastAPI Config Drawer (Collapsible) */}
          {showBackendConfig && (
            <div className="p-3 bg-slate-900 border-b border-cyan-500/30 text-xs font-mono space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-bold uppercase">FASTAPI BACKEND SERVICE</span>
                <button
                  type="button"
                  onClick={() => setShowBackendConfig(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-slate-300">
                Configure Python FastAPI microservice URL for OpenCV computer vision processing:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={backendConfig.apiUrl}
                  onChange={(e) => {
                    const updated = { ...backendConfig, apiUrl: e.target.value };
                    setBackendStateConfig(updated);
                    saveBackendConfig(updated);
                  }}
                  placeholder="http://localhost:8000/api/analyze-strip"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={backendConfig.useRemoteBackend}
                  onChange={(e) => {
                    const updated = { ...backendConfig, useRemoteBackend: e.target.checked };
                    setBackendStateConfig(updated);
                    saveBackendConfig(updated);
                  }}
                  className="accent-cyan-400"
                />
                <span>Attempt remote FastAPI before client-side fallback</span>
              </label>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 px-4 py-4 overflow-y-auto">
            {/* CAMERA SCANNER SCREEN (Full prominence when scanning) */}
            {isScanning ? (
              <div className="relative">
                {isAnalyzing ? (
                  <div className="py-6">
                    <AnalysisProgress
                      currentStepIndex={analysisStep}
                      stepMessage={analysisMessage}
                    />
                  </div>
                ) : (
                  <CameraScanner
                    onBack={() => setIsScanning(false)}
                    onAnalyzeCaptured={handleAnalyzeCaptured}
                    isAnalyzing={isAnalyzing}
                  />
                )}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* TAB 1: DASHBOARD */}
                {activeTab === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <Dashboard
                      profile={profile}
                      latestResult={latestResult}
                      isSensorEnabled={isSensorEnabled}
                      sensorConnectionStatus={sensorConnectionStatus}
                      sensorTemperature={sensorTemperature}
                      sensorHumidity={sensorHumidity}
                      sensorError={sensorError}
                      onToggleSensor={handleToggleSensor}
                      onConnectSensor={() => void handleConnectSensor()}
                      onDisconnectSensor={() => void handleDisconnectSensor()}
                      onScanClick={handleStartScan}
                      onSetupClick={() => setActiveTab('setup')}
                      onOpenDemo={() => setActiveTab('demo')}
                      onViewBadgeTarget={() => setModalType('target')}
                    />

                    {/* If there is an active/latest result, show the detailed result card below */}
                    {latestResult && (
                      <div className="pt-2 border-t border-white/5">
                        <ResultCard
                          result={latestResult}
                          onScanAgain={handleStartScan}
                          onSaveRecord={handleSaveCurrentResult}
                          isSaved={history.some((h) => h.id === latestResult.id)}
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 2: WORKER SETUP */}
                {activeTab === 'setup' && (
                  <motion.div
                    key="setup"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <WorkerSetup
                      profile={profile}
                      onSaveProfile={handleSaveProfile}
                      onContinueToScan={handleStartScan}
                    />
                  </motion.div>
                )}

                {/* TAB 3: HISTORY VIEW */}
                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HistoryView
                      records={history}
                      onSelectRecord={(rec) => {
                        setLatestResult(rec);
                        setActiveTab('dashboard');
                      }}
                      onClearHistory={handleClearHistory}
                      onLoadDemoRecords={handleLoadDemoRecords}
                    />
                  </motion.div>
                )}

                {/* TAB 4: DEMO / SIMULATOR MODE */}
                {activeTab === 'demo' && (
                  <motion.div
                    key="demo"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DemoSimulator
                      profile={profile}
                      onApplySimulatedResult={(simRes) => {
                        setLatestResult(simRes);
                        setActiveTab('dashboard');
                      }}
                    />
                  </motion.div>
                )}

                {/* TAB 5: PROFILE & SETTINGS */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <WorkerSetup
                      profile={profile}
                      onSaveProfile={handleSaveProfile}
                      onContinueToScan={handleStartScan}
                    />

                    {/* Test target badge inspection shortcut */}
                    <div className="sleek-card space-y-2">
                      <div className="text-xs font-mono font-bold uppercase text-cyan-400">
                        VIRTUAL CALIBRATION TARGET
                      </div>
                      <p className="text-xs text-slate-300">
                        Display or inspect the calibrated reference dosimeter card for camera optical alignment:
                      </p>
                      <button
                        type="button"
                        onClick={() => setModalType('target')}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-mono text-xs font-bold transition-all"
                      >
                        OPEN TEST TARGET BADGE
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </main>

          {/* Global Bottom Navigation (Visible except during active camera scanning) */}
          {!isScanning && (
            <BottomNav
              activeTab={activeTab}
              onTabChange={(tab) => {
                if (tab === 'scan') {
                  handleStartScan();
                } else {
                  setActiveTab(tab);
                }
              }}
              hasExpiredBadge={profile.isExpired}
            />
          )}

          {/* Interactive Modals */}
          <DosimeterModal
            isOpen={modalType !== null}
            type={modalType || 'info'}
            onClose={() => setModalType(null)}
          />
        </div>

        {/* RIGHT SIDEBAR (Visible on Desktop lg:) */}
        <aside className="hidden lg:flex flex-col w-[280px] gap-4 shrink-0 justify-between">
          <div className="space-y-4">
            {/* Latest Dosage Card */}
            <div className="sleek-card">
              <div className="sleek-card-title">Latest Dosage</div>
              <div className="sleek-dosage-display">
                <div className="sleek-dosage-value text-white">
                  {latestResult ? latestResult.dose_ppm_hr.toFixed(1) : '0.0'}
                </div>
                <div className="sleek-dosage-unit">ppm·hr</div>
              </div>
              
              <div className="mb-4">
                <span className={`sleek-status-badge ${
                  (latestResult?.status || 'SAFE') === 'SAFE'
                    ? 'safe'
                    : (latestResult?.status || 'SAFE') === 'WARNING'
                    ? 'warning'
                    : 'danger'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {latestResult?.status || 'SAFE'}
                </span>
              </div>

              <div className="flex justify-center">
                <div className="sleek-circular-gauge">
                  <div className="sleek-gauge-val text-white">
                    {latestResult ? `${latestResult.conversion.toFixed(0)}%` : '0%'}
                  </div>
                  <div className="text-[10px] text-slate-400">Conversion</div>
                </div>
              </div>
            </div>

            {/* Worker Session Card */}
            <div className="sleek-card">
              <div className="sleek-card-title">Worker Session</div>
              <div className="sleek-stat-row">
                <span className="sleek-stat-label">Worker ID</span>
                <span className="sleek-stat-value">{profile.workerId}</span>
              </div>
              <div className="sleek-stat-row">
                <span className="sleek-stat-label">Shift</span>
                <span className="sleek-stat-value">{profile.shift}</span>
              </div>
              <div className="sleek-stat-row">
                <span className="sleek-stat-label">Badge Status</span>
                <span
                  className="sleek-stat-value"
                  style={{ color: profile.isExpired ? 'var(--amber)' : 'var(--green)' }}
                >
                  {profile.isExpired ? 'Expired' : 'Active'}
                </span>
              </div>
            </div>

            {/* H2S Science Card */}
            <div className="sleek-card">
              <div className="sleek-card-title">H₂S Science</div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                The strip darkens via chemical reaction:
                <code className="text-cyan-400 block my-1.5 font-mono text-[10px]">
                  Pb(CH₃COO)₂ + H₂S → PbS + 2CH₃COOH
                </code>
                Lead acetate paper turns from white to brownish-black.
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
