export type ExposureStatus = 'SAFE' | 'WARNING' | 'HIGH';

export type ShiftType = 'Morning' | 'Afternoon' | 'Night';

export interface WorkerProfile {
  workerId: string;
  shift: ShiftType;
  badgeId: string;
  expiryDate: string; // YYYY-MM-DD
  isExpired: boolean;
  department: string;
}

export interface ReferencePatchAnalysis {
  label: string;
  percent: number;
  knownRgb: [number, number, number];
  measuredRgb: [number, number, number];
  correctedRgb: [number, number, number];
}

export interface ChannelRegression {
  a: number;
  b: number;
  r2: number;
}

export interface CalibrationDebugInfo {
  capturedReactiveRgb: { r: number; g: number; b: number };
  correctedReactiveRgb: { r: number; g: number; b: number };
  referencePatches: ReferencePatchAnalysis[];
  regression: {
    r: ChannelRegression;
    g: ChannelRegression;
    b: ChannelRegression;
  };
  calculatedConversion: number; // 0 to 100 (%)
  calculatedDose: number; // ppm·hr
  saturationNote: string;
  prototypeFormula: string;
  // Debug Panel requirements
  simulatorConversion?: number;
  nearestColors: {
    lower: { percent: number; rgb: [number, number, number]; hex: string };
    upper: { percent: number; rgb: [number, number, number]; hex: string };
  };
  kValue: number;
  isExpired85: boolean;
  interpolatedConversion: number;
}

export interface DosimeterAnalysisResult {
  id: string;
  timestamp: string;
  workerId: string;
  shift: ShiftType;
  badgeId: string;
  conversion: number; // 0 to 100 (%)
  dose_ppm_hr: number; // Cumulative exposure in ppm·hr
  status: ExposureStatus;
  lightingGain: number; // Optical compensation multiplier
  sampledStripHex: string;
  referenceBaselineHex: string;
  reference100Hex: string;
  rawRgb: { r: number; g: number; b: number };
  referenceRgb: { r: number; g: number; b: number };
  confidenceLabel: string;
  source: 'camera' | 'simulation' | 'api';
  environmentalTempC: number;
  environmentalHumidityRH: number;
  notes?: string;
  // Calibration & Lighting Correction Verification
  referenceCalibrationDetected?: boolean;
  lightingCorrectionApplied?: boolean;
  debugInfo?: CalibrationDebugInfo;
}

export interface ReferenceStep {
  label: string;
  percent: number;
  colorHex: string;
  rgb: [number, number, number];
}

export interface DosimeterApiPayload {
  image_base64?: string;
  worker_id: string;
  badge_id: string;
  shift: string;
  environmental_temp_c?: number;
  environmental_humidity_rh?: number;
}

export interface DosimeterApiResponse {
  conversion: number;
  dose_ppm_hr: number;
  status: ExposureStatus;
  lighting_correction_factor?: number;
  analysis_timestamp?: string;
}
