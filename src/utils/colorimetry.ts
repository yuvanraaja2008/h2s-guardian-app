import { ExposureStatus, ReferenceStep, CalibrationDebugInfo, ReferencePatchAnalysis } from '../types';

// ============================================================================
// 1. REFERENCE SCALE — FIXED CALIBRATION PATCHES
// ============================================================================
// The printed reference scale has EXACTLY these five calibration colours:
// 0%:   RGB(245,245,240), HEX #F5F5F0
// 25%:  RGB(194,190,176), HEX #C2BEB0
// 50%:  RGB(138,133,120), HEX #8A8578
// 75%:  RGB(82,78,66),   HEX #524E42
// 100%: RGB(28,26,20),   HEX #1C1A14
// These are FIXED. They do NOT change with H₂S exposure.
// They are used solely for lighting correction.
export interface ReferencePatch {
  percent: number;
  label: string;
  rgb: [number, number, number];
  hex: string;
}

export const REFERENCE_SCALE_PATCHES: ReferencePatch[] = [
  { percent: 0, label: '0%', rgb: [245, 245, 240], hex: '#F5F5F0' },
  { percent: 25, label: '25%', rgb: [194, 190, 176], hex: '#C2BEB0' },
  { percent: 50, label: '50%', rgb: [138, 133, 120], hex: '#8A8578' },
  { percent: 75, label: '75%', rgb: [82, 78, 66], hex: '#524E42' },
  { percent: 100, label: '100%', rgb: [28, 26, 20], hex: '#1C1A14' },
];

export const REFERENCE_STEPS: ReferenceStep[] = REFERENCE_SCALE_PATCHES.map((p) => ({
  label: p.label,
  percent: p.percent,
  colorHex: p.hex,
  rgb: p.rgb,
}));

// ============================================================================
// 2. REACTIVE H₂S STRIP — PROGRESSION THROUGH BROWN SHADES
// ============================================================================
// The reactive strip visually changes through BROWN shades (not simply black).
// 0%:   RGB(245,241,230), HEX #F5F1E6
// 25%:  RGB(200,187,162), HEX #C8BBA2
// 50%:  RGB(157,135,103), HEX #9D8767
// 75%:  RGB(115,91,62),   HEX #735B3E
// 100%: RGB(74,50,31),    HEX #4A321F
export interface ReactiveControlPoint {
  fraction: number; // 0.0 to 1.0
  percent: number;  // 0 to 100
  rgb: [number, number, number];
  hex: string;
}

export const REACTIVE_STRIP_CONTROL_POINTS: ReactiveControlPoint[] = [
  { fraction: 0.00, percent: 0, rgb: [245, 241, 230], hex: '#F5F1E6' },
  { fraction: 0.25, percent: 25, rgb: [200, 187, 162], hex: '#C8BBA2' },
  { fraction: 0.50, percent: 50, rgb: [157, 135, 103], hex: '#9D8767' },
  { fraction: 0.75, percent: 75, rgb: [115, 91, 62], hex: '#735B3E' },
  { fraction: 1.00, percent: 100, rgb: [74, 50, 31], hex: '#4A321F' },
];

// ============================================================================
// 3. COMMON CALIBRATION MODEL (SHARED BETWEEN SIMULATOR & CAMERA)
// ============================================================================
// Prototype kinetic rate constant:
// conversion = 1 - exp(-K * dose)
// dose = -ln(1 - conversion) / K
// PROTOTYPE MODEL — Real measurement accuracy requires controlled H₂S exposure testing.
export const K = 0.012;
export const MAX_READABLE_CONVERSION = 0.97;

/**
 * Forward model: calculates chemical conversion fraction [0, 1] from cumulative dose (ppm·hr).
 * conversion = 1 - exp(-0.012 * dose)
 */
export function calculateConversionFromDose(dosePpmHr: number): number {
  const safeDose = Math.max(0, dosePpmHr);
  const conversion = 1 - Math.exp(-K * safeDose);
  return Math.max(0, Math.min(0.999999, conversion));
}

/**
 * Inverse model: calculates cumulative dose (ppm·hr) from chemical conversion fraction [0, 1].
 * dose = -ln(1 - conversion) / 0.012
 */
export function calculateDoseFromFraction(fraction: number): number {
  const safeC = Math.max(0, Math.min(MAX_READABLE_CONVERSION, fraction));
  if (safeC <= 0.00001) return 0.0;
  const dose = -Math.log(1 - safeC) / K;
  return Math.max(0, Number(dose.toFixed(1)));
}

/**
 * Inverse model: calculates cumulative dose (ppm·hr) from chemical conversion percent [0, 100].
 */
export function calculateDoseFromPercent(percent: number): number {
  return calculateDoseFromFraction(percent / 100);
}

/**
 * Universal inverse model: accepts either fraction [0, 1] or percent [0, 100].
 * If isPercent is explicitly provided, follows that flag.
 * Otherwise, values > 1.0 are treated as percent (e.g. 5.8 -> 5.8%),
 * while values <= 1.0 are treated as fraction [0, 1].
 */
export function calculateDoseFromConversion(
  conversionInput: number,
  isPercent?: boolean
): number {
  if (isPercent === true) {
    return calculateDoseFromPercent(conversionInput);
  }
  if (isPercent === false) {
    return calculateDoseFromFraction(conversionInput);
  }
  const fraction = conversionInput > 1.0 ? conversionInput / 100 : conversionInput;
  return calculateDoseFromFraction(fraction);
}

/**
 * Simulator helper: converts concentration and exposure time into cumulative dose and conversion.
 * dose = concentration * time
 * conversion = 1 - exp(-0.012 * dose)
 */
export function calculateConversionFromExposure(
  concentrationPpm: number,
  hours: number,
  _tempC: number = 25,
  _humidityRH: number = 50
): { dosePpmHr: number; conversion: number; conversionFraction: number } {
  const safeConc = Math.max(0, concentrationPpm);
  const safeHours = Math.max(0, hours);
  const dosePpmHr = Number((safeConc * safeHours).toFixed(1));
  const conversionFraction = calculateConversionFromDose(dosePpmHr);
  const conversion = Number((conversionFraction * 100).toFixed(1));
  return {
    dosePpmHr,
    conversion,
    conversionFraction,
  };
}

// ============================================================================
// 4. REACTIVE BROWN STRIP COLOUR INTERPOLATION & INVERSION
// ============================================================================

export interface BrownCalibrationDetails {
  conversionFraction: number;
  conversionPercent: number;
  lowerPoint: ReactiveControlPoint;
  upperPoint: ReactiveControlPoint;
  interpolatedConversion: number;
  calculatedDose: number;
  isExpired85: boolean;
  distSq: number;
}

/**
 * Detailed calibration analysis: projects brown RGB onto the STRIP_COLORS control points,
 * identifies the nearest calibration colors, interpolates conversion, and computes dose (K=0.012).
 */
export function getBrownCalibrationDetails(rgb: {
  r: number;
  g: number;
  b: number;
}): BrownCalibrationDetails {
  const pts = REACTIVE_STRIP_CONTROL_POINTS;
  let bestDistSq = Infinity;
  let bestFraction = 0;
  let bestIdx = 0;

  for (let i = 0; i < pts.length - 1; i++) {
    const A = pts[i].rgb;
    const B = pts[i + 1].rgb;
    const Vx = B[0] - A[0];
    const Vy = B[1] - A[1];
    const Vz = B[2] - A[2];
    const VlenSq = Vx * Vx + Vy * Vy + Vz * Vz;

    if (VlenSq === 0) continue;

    const APx = rgb.r - A[0];
    const APy = rgb.g - A[1];
    const APz = rgb.b - A[2];

    const dot = APx * Vx + APy * Vy + APz * Vz;
    const t = Math.max(0, Math.min(1, dot / VlenSq));

    const Qx = A[0] + t * Vx;
    const Qy = A[1] + t * Vy;
    const Qz = A[2] + t * Vz;

    const dx = rgb.r - Qx;
    const dy = rgb.g - Qy;
    const dz = rgb.b - Qz;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestFraction = (i + t) / (pts.length - 1);
      bestIdx = i;
    }
  }

  const fraction = Math.max(0, Math.min(1.0, bestFraction));
  const conversionPercent = Number((fraction * 100).toFixed(1));
  const calculatedDose = calculateDoseFromConversion(fraction);
  const isExpired85 = conversionPercent >= 85.0;

  return {
    conversionFraction: fraction,
    conversionPercent,
    lowerPoint: pts[bestIdx],
    upperPoint: pts[bestIdx + 1],
    interpolatedConversion: conversionPercent,
    calculatedDose,
    isExpired85,
    distSq: bestDistSq,
  };
}

/**
 * Interpolates piecewise linearly between the 5 brown reactive strip control points.
 * Takes either a fraction [0, 1] or percent [0, 100].
 */
export function getSimulatedStripColor(conversionFractionOrPercent: number): {
  hex: string;
  r: number;
  g: number;
  b: number;
} {
  const c = Math.max(
    0,
    Math.min(
      1.0,
      conversionFractionOrPercent > 1
        ? conversionFractionOrPercent / 100
        : conversionFractionOrPercent
    )
  );

  const pts = REACTIVE_STRIP_CONTROL_POINTS;
  const scaled = c * (pts.length - 1);
  const idx = Math.min(Math.floor(scaled), pts.length - 2);
  const fraction = scaled - idx;

  const startColor = pts[idx].rgb;
  const endColor = pts[idx + 1].rgb;

  const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * fraction);
  const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * fraction);
  const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * fraction);

  return {
    hex: rgbToHex(r, g, b),
    r,
    g,
    b,
  };
}

/**
 * Camera inversion: projects corrected reactive strip RGB onto the brown progression segments
 * to estimate conversion fraction [0, 1].
 */
export function estimateConversionFromBrownRgb(rgb: {
  r: number;
  g: number;
  b: number;
}): number {
  return getBrownCalibrationDetails(rgb).conversionFraction;
}

// ============================================================================
// 5. REFERENCE-SCALE LIGHTING CORRECTION (LEAST SQUARES REGRESSION)
// ============================================================================
// true = a * measured + b per RGB channel
export interface LightingRegression {
  a: number;
  b: number;
  r2: number; // Coefficient of determination (1.0 = perfect match)
}

export function calculateLinearRegression(
  measured: number[],
  known: number[]
): LightingRegression {
  const n = measured.length;
  if (n === 0) return { a: 1.0, b: 0.0, r2: 1.0 };

  let sumM = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumM += measured[i];
    sumY += known[i];
  }
  const meanM = sumM / n;
  const meanY = sumY / n;

  let cov = 0;
  let varM = 0;
  for (let i = 0; i < n; i++) {
    const dm = measured[i] - meanM;
    const dy = known[i] - meanY;
    cov += dm * dy;
    varM += dm * dm;
  }

  if (varM < 1e-4) {
    return { a: 1.0, b: 0.0, r2: 1.0 };
  }

  let a = cov / varM;
  let b = meanY - a * meanM;

  // Safeguard against physical extremes
  if (!Number.isFinite(a) || a <= 0) {
    a = 1.0;
    b = 0.0;
  } else {
    a = Math.max(0.1, Math.min(4.0, a));
    b = Math.max(-150, Math.min(150, b));
  }

  // Calculate R^2 (coefficient of determination)
  let sst = 0;
  let sse = 0;
  for (let i = 0; i < n; i++) {
    sst += (known[i] - meanY) ** 2;
    const pred = a * measured[i] + b;
    sse += (known[i] - pred) ** 2;
  }
  const r2 = sst > 1e-4 ? Math.max(0, Math.min(1.0, 1 - sse / sst)) : 1.0;

  return { a, b, r2: Number(r2.toFixed(3)) };
}

// Exposure status classification according to industrial safety guidelines
export function getExposureStatus(dosePpmHr: number): ExposureStatus {
  if (dosePpmHr < 10.0) return 'SAFE';
  if (dosePpmHr <= 100.0) return 'WARNING';
  return 'HIGH';
}

export function getStatusColor(status: ExposureStatus): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  glowColor: string;
  hex: string;
} {
  switch (status) {
    case 'SAFE':
      return {
        badgeBg: 'bg-emerald-500/15',
        badgeText: 'text-emerald-400',
        badgeBorder: 'border-emerald-500/30',
        glowColor: 'shadow-emerald-500/20',
        hex: '#10b981',
      };
    case 'WARNING':
      return {
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-400',
        badgeBorder: 'border-amber-500/30',
        glowColor: 'shadow-amber-500/20',
        hex: '#f59e0b',
      };
    case 'HIGH':
      return {
        badgeBg: 'bg-rose-500/15',
        badgeText: 'text-rose-400',
        badgeBorder: 'border-rose-500/30',
        glowColor: 'shadow-rose-500/20',
        hex: '#ef4444',
      };
  }
}

// Saturation warnings per 85% rule
export function getSaturationInfo(conversionFractionOrPercent: number): {
  isNearing: boolean;
  isSaturated: boolean;
  isExpired85: boolean;
  message: string;
} {
  const percent = conversionFractionOrPercent > 1.0 ? conversionFractionOrPercent : conversionFractionOrPercent * 100;
  if (percent >= 85.0) {
    return {
      isNearing: true,
      isSaturated: true,
      isExpired85: true,
      message: '⚠ STRIP EXPIRED / SATURATED (Conversion ≥ 85%)',
    };
  }
  return {
    isNearing: false,
    isSaturated: false,
    isExpired85: false,
    message: 'Strip within active readable range (< 85%)',
  };
}

// Convert RGB to HEX string
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Convert HEX to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to perceptual Luminance (CIE 1931 standard)
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const sR = r / 255;
  const sG = g / 255;
  const sB = b / 255;
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

// Comprehensive analysis result
export interface LightingCorrectionResult {
  gain: number;
  correctedRgb: { r: number; g: number; b: number };
  detectedConversion: number; // 0 to 100 (%)
  conversionFraction: number; // 0.0 to 1.0
  dosePpmHr: number;
  status: ExposureStatus;
  saturationInfo: {
    isNearing: boolean;
    isSaturated: boolean;
    message: string;
  };
  debugInfo: CalibrationDebugInfo;
}

/**
 * Colorimetric analysis pipeline:
 * camera image -> detect reference scale -> lighting correction (true = a * measured + b)
 * -> apply to reactive strip -> estimate conversion -> calculate dose (K = 0.012)
 */
export function performColorimetricAnalysis(
  sampledStripRgb: { r: number; g: number; b: number },
  sampled0PercentRefRgb?: { r: number; g: number; b: number },
  sampled100PercentRefRgb?: { r: number; g: number; b: number },
  allMeasuredPatches?: { r: number; g: number; b: number }[]
): LightingCorrectionResult {
  const truePatches = REFERENCE_SCALE_PATCHES;

  // Build the 5 measured reference patches
  let measuredPatches: { r: number; g: number; b: number }[] = [];

  if (allMeasuredPatches && allMeasuredPatches.length === 5) {
    measuredPatches = allMeasuredPatches;
  } else if (sampled0PercentRefRgb && sampled100PercentRefRgb) {
    // Interpolate 5 patches from measured 0% and 100%
    measuredPatches = [
      sampled0PercentRefRgb,
      {
        r: Math.round(sampled0PercentRefRgb.r * 0.75 + sampled100PercentRefRgb.r * 0.25),
        g: Math.round(sampled0PercentRefRgb.g * 0.75 + sampled100PercentRefRgb.g * 0.25),
        b: Math.round(sampled0PercentRefRgb.b * 0.75 + sampled100PercentRefRgb.b * 0.25),
      },
      {
        r: Math.round(sampled0PercentRefRgb.r * 0.5 + sampled100PercentRefRgb.r * 0.5),
        g: Math.round(sampled0PercentRefRgb.g * 0.5 + sampled100PercentRefRgb.g * 0.5),
        b: Math.round(sampled0PercentRefRgb.b * 0.5 + sampled100PercentRefRgb.b * 0.5),
      },
      {
        r: Math.round(sampled0PercentRefRgb.r * 0.25 + sampled100PercentRefRgb.r * 0.75),
        g: Math.round(sampled0PercentRefRgb.g * 0.25 + sampled100PercentRefRgb.g * 0.75),
        b: Math.round(sampled0PercentRefRgb.b * 0.25 + sampled100PercentRefRgb.b * 0.75),
      },
      sampled100PercentRefRgb,
    ];
  } else if (sampled0PercentRefRgb) {
    // Proportional gain scaling based on 0% patch
    const gainR = truePatches[0].rgb[0] / Math.max(10, sampled0PercentRefRgb.r);
    const gainG = truePatches[0].rgb[1] / Math.max(10, sampled0PercentRefRgb.g);
    const gainB = truePatches[0].rgb[2] / Math.max(10, sampled0PercentRefRgb.b);
    measuredPatches = truePatches.map((p) => ({
      r: Math.round(p.rgb[0] / gainR),
      g: Math.round(p.rgb[1] / gainG),
      b: Math.round(p.rgb[2] / gainB),
    }));
  } else {
    measuredPatches = truePatches.map((p) => ({
      r: p.rgb[0],
      g: p.rgb[1],
      b: p.rgb[2],
    }));
  }

  // Calculate per-channel least-squares linear regression: true = a * measured + b
  const regR = calculateLinearRegression(
    measuredPatches.map((p) => p.r),
    truePatches.map((p) => p.rgb[0])
  );
  const regG = calculateLinearRegression(
    measuredPatches.map((p) => p.g),
    truePatches.map((p) => p.rgb[1])
  );
  const regB = calculateLinearRegression(
    measuredPatches.map((p) => p.b),
    truePatches.map((p) => p.rgb[2])
  );

  // Apply correction to reactive strip if reference scale is valid
  const r2Avg = (regR.r2 + regG.r2 + regB.r2) / 3;
  const isDecreasing =
    measuredPatches[0].r >= measuredPatches[2].r &&
    measuredPatches[2].r >= measuredPatches[4].r;
  const isReferenceScaleValid = r2Avg >= 0.65 && isDecreasing;

  let correctedR = sampledStripRgb.r;
  let correctedG = sampledStripRgb.g;
  let correctedB = sampledStripRgb.b;

  if (isReferenceScaleValid) {
    correctedR = Math.max(0, Math.min(255, Math.round(regR.a * sampledStripRgb.r + regR.b)));
    correctedG = Math.max(0, Math.min(255, Math.round(regG.a * sampledStripRgb.g + regG.b)));
    correctedB = Math.max(0, Math.min(255, Math.round(regB.a * sampledStripRgb.b + regB.b)));
  }

  const correctedStripRgb = { r: correctedR, g: correctedG, b: correctedB };

  // Generate debug records for all 5 reference patches
  const referencePatchAnalysis: ReferencePatchAnalysis[] = truePatches.map((tp, idx) => {
    const mp = measuredPatches[idx];
    const cr = Math.max(0, Math.min(255, Math.round(regR.a * mp.r + regR.b)));
    const cg = Math.max(0, Math.min(255, Math.round(regG.a * mp.g + regG.b)));
    const cb = Math.max(0, Math.min(255, Math.round(regB.a * mp.b + regB.b)));
    return {
      label: tp.label,
      percent: tp.percent,
      knownRgb: tp.rgb,
      measuredRgb: [mp.r, mp.g, mp.b],
      correctedRgb: [cr, cg, cb],
    };
  });

  // Estimate conversion and nearest calibration colors from brown reactive strip
  const calibDetails = getBrownCalibrationDetails(correctedStripRgb);
  const conversionFraction = calibDetails.conversionFraction;
  const detectedConversion = calibDetails.conversionPercent;
  const dosePpmHr = calibDetails.calculatedDose;
  const status = getExposureStatus(dosePpmHr);
  const saturationInfo = getSaturationInfo(detectedConversion);

  const avgGain = Number(((regR.a + regG.a + regB.a) / 3).toFixed(2));

  const debugInfo: CalibrationDebugInfo = {
    capturedReactiveRgb: sampledStripRgb,
    correctedReactiveRgb: correctedStripRgb,
    referencePatches: referencePatchAnalysis,
    regression: {
      r: regR,
      g: regG,
      b: regB,
    },
    calculatedConversion: detectedConversion,
    calculatedDose: dosePpmHr,
    saturationNote: saturationInfo.message,
    prototypeFormula: `dose = -ln(1 - conv) / ${K}`,
    nearestColors: {
      lower: {
        percent: calibDetails.lowerPoint.percent,
        rgb: calibDetails.lowerPoint.rgb,
        hex: calibDetails.lowerPoint.hex,
      },
      upper: {
        percent: calibDetails.upperPoint.percent,
        rgb: calibDetails.upperPoint.rgb,
        hex: calibDetails.upperPoint.hex,
      },
    },
    kValue: K,
    isExpired85: calibDetails.isExpired85,
    interpolatedConversion: calibDetails.interpolatedConversion,
  };

  return {
    gain: avgGain,
    correctedRgb: correctedStripRgb,
    detectedConversion,
    conversionFraction,
    dosePpmHr,
    status,
    saturationInfo,
    debugInfo,
  };
}

// ============================================================================
// 8. MANDATORY SELF-TEST & CONSISTENCY TEST ENGINE
// ============================================================================
export interface MandatorySelfTestResult {
  targetConversion: number; // e.g. 53.0
  targetDose: number; // ppm·hr
  stripRgb: { r: number; g: number; b: number; hex: string };
  recoveredConversion: number; // e.g. 53.0
  recoveredDose: number; // ppm·hr
  errorPercentagePoints: number; // absolute difference in percentage points
  passed: boolean; // error <= 2.0 percentage points
  isExpired85: boolean; // conversion >= 85.0
  ruleStatus: string; // 'ACTIVE (< 85%)' vs '⚠ STRIP EXPIRED / SATURATED'
}

export const MANDATORY_SELF_TEST_CONVERSIONS = [0, 25, 50, 53, 60, 75, 84.9, 85, 86, 90];

export function runMandatorySelfTest(): MandatorySelfTestResult[] {
  return MANDATORY_SELF_TEST_CONVERSIONS.map((pct) => {
    const fraction = pct / 100;
    const targetDose = fraction < 0.999 ? -Math.log(1 - fraction) / K : 0;
    const stripRgb = getSimulatedStripColor(pct);
    const recoveredFraction = estimateConversionFromBrownRgb(stripRgb);
    const recoveredConversion = Number((recoveredFraction * 100).toFixed(1));
    const recoveredDose = calculateDoseFromConversion(recoveredFraction);
    const errorPercentagePoints = Number(Math.abs(recoveredConversion - pct).toFixed(2));
    const passed = errorPercentagePoints <= 2.0;
    const isExpired85 = pct >= 85.0;

    return {
      targetConversion: pct,
      targetDose: Number(targetDose.toFixed(1)),
      stripRgb,
      recoveredConversion,
      recoveredDose,
      errorPercentagePoints,
      passed,
      isExpired85,
      ruleStatus: isExpired85 ? '⚠ STRIP EXPIRED / SATURATED' : 'ACTIVE (< 85%)',
    };
  });
}

export interface CalibrationTestPoint {
  expectedDose: number;
  conversionFraction: number;
  conversionPercent: number;
  stripRgb: { r: number; g: number; b: number; hex: string };
  stripHex: string;
  calculatedConversion: number;
  calculatedDose: number;
  difference: number;
}

export const KNOWN_TEST_DOSES = [0, 1, 5, 10, 25, 50, 75, 100];

export function runCalibrationConsistencyTest(): CalibrationTestPoint[] {
  return KNOWN_TEST_DOSES.map((expectedDose) => {
    // 1. Calculate conversion using K = 0.012
    const conversionFraction = calculateConversionFromDose(expectedDose);
    // 2. Generate corresponding brown reactive-strip colour
    const stripRgb = getSimulatedStripColor(conversionFraction);
    // 3. Pass that colour through camera-analysis conversion logic
    const calculatedFraction = estimateConversionFromBrownRgb(stripRgb);
    // 4. Calculate dose using K = 0.012
    const calculatedDose = calculateDoseFromConversion(calculatedFraction);
    const difference = Number(Math.abs(calculatedDose - expectedDose).toFixed(2));

    return {
      expectedDose,
      conversionFraction,
      conversionPercent: Number((conversionFraction * 100).toFixed(1)),
      stripRgb,
      stripHex: stripRgb.hex,
      calculatedConversion: calculatedFraction,
      calculatedDose,
      difference,
    };
  });
}

/**
 * Renders an optically calibrated physical dosimeter badge directly onto a canvas context.
 * Patches and reactive strip are positioned at normalized coordinates matching the camera guide:
 * - Upper reference scale: refCenterY = height * 0.38, X offsets: [0.32, 0.41, 0.50, 0.59, 0.68] * width
 * - Lower reactive strip: stripCenterX = width * 0.5, stripCenterY = height * 0.65
 */
export function drawCalibratedDosimeterBadge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  conversionFractionOrPercent: number,
  options?: {
    lightingGain?: number;
    badgeId?: string;
  }
): void {
  const gain = options?.lightingGain ?? 1.0;
  const badgeId = options?.badgeId ?? 'BDG-7049-H2S';

  // 1. Industrial setting backdrop
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, width, height);

  // 2. Physical Badge Housing (Proportioned to fit phone/viewfinder frame)
  const cardW = Math.min(width * 0.82, 380);
  const cardH = Math.min(height * 0.78, 540);
  const cardX = (width - cardW) / 2;
  const cardY = (height - cardH) / 2;

  // Badge body with rounded corners and double border
  ctx.save();
  ctx.fillStyle = '#111827';
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 16);
  ctx.fill();
  ctx.stroke();

  // Interior border line
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cardX + 8, cardY + 8, cardW - 16, cardH - 16, 12);
  ctx.stroke();

  // Badge Header
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('H₂S PERSONAL DOSIMETER', cardX + 16, cardY + 28);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(badgeId, cardX + cardW - 16, cardY + 28);

  // Fiducial crosshairs on lower corners
  const drawCross = (cx: number, cy: number) => {
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx, cy + 8);
    ctx.stroke();
  };
  drawCross(cardX + 20, cardY + cardH - 24);
  drawCross(cardX + cardW - 20, cardY + cardH - 24);

  // 3. Reference Scale Section (refCenterY = height * 0.38)
  const refCenterY = Math.floor(height * 0.38);
  const patchXOffsets = [0.32, 0.41, 0.50, 0.59, 0.68];
  const patchW = Math.max(26, Math.floor(width * 0.078));
  const patchH = Math.max(36, Math.floor(height * 0.084));

  // Outer bezel for reference scale
  const scaleBoxW = Math.floor(width * 0.48);
  const scaleBoxH = patchH + 28;
  const scaleBoxX = (width - scaleBoxW) / 2;
  const scaleBoxY = refCenterY - patchH / 2 - 14;
  ctx.fillStyle = '#030712';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(scaleBoxX, scaleBoxY, scaleBoxW, scaleBoxH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CALIBRATION REFERENCE SCALE (PRINTED)', width * 0.5, scaleBoxY + 11);

  // Draw 5 Reference Scale Patches
  REFERENCE_SCALE_PATCHES.forEach((patch, idx) => {
    const px = Math.floor(width * patchXOffsets[idx]);
    const py = refCenterY;
    const left = px - patchW / 2;
    const top = py - patchH / 2 + 6;

    const r = Math.max(0, Math.min(255, Math.round(patch.rgb[0] * gain)));
    const g = Math.max(0, Math.min(255, Math.round(patch.rgb[1] * gain)));
    const b = Math.max(0, Math.min(255, Math.round(patch.rgb[2] * gain)));

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(left, top, patchW, patchH);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(left, top, patchW, patchH);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${patch.percent}%`, px, top + patchH + 9);
  });

  // 4. Reactive Strip Section (stripCenterX = width * 0.5, stripCenterY = height * 0.65)
  const stripCenterX = Math.floor(width * 0.5);
  const stripCenterY = Math.floor(height * 0.65);
  const stripW = Math.max(130, Math.floor(width * 0.40));
  const stripH = Math.max(50, Math.floor(height * 0.092));

  // Bezel container for reactive strip
  const bezelW = stripW + 24;
  const bezelH = stripH + 28;
  const bezelX = stripCenterX - bezelW / 2;
  const bezelY = stripCenterY - bezelH / 2;
  ctx.fillStyle = '#030712';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bezelX, bezelY, bezelW, bezelH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('REACTIVE SENSING ELEMENT (PbS)', stripCenterX, bezelY + 11);

  // Compute exact strip color
  const stripColor = getSimulatedStripColor(conversionFractionOrPercent);
  const sr = Math.max(0, Math.min(255, Math.round(stripColor.r * gain)));
  const sg = Math.max(0, Math.min(255, Math.round(stripColor.g * gain)));
  const sb = Math.max(0, Math.min(255, Math.round(stripColor.b * gain)));

  const sLeft = stripCenterX - stripW / 2;
  const sTop = stripCenterY - stripH / 2 + 5;

  ctx.fillStyle = `rgb(${sr},${sg},${sb})`;
  ctx.fillRect(sLeft, sTop, stripW, stripH);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.strokeRect(sLeft, sTop, stripW, stripH);

  // Subtle substrate texture indicator
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sLeft, stripCenterY + 4);
  ctx.lineTo(sLeft + stripW, stripCenterY + 4);
  ctx.stroke();

  // Footer notes
  ctx.fillStyle = '#64748b';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ALIGN BOTH WINDOWS IN VIEWFINDER FOR PRECISION COLORIMETRY', width * 0.5, cardY + cardH - 12);

  ctx.restore();
}

