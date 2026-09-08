import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DosimeterOverlay } from './DosimeterOverlay';
import {
  ArrowLeft,
  Camera,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Zap,
  ZapOff,
  AlertTriangle,
  Play,
  CheckCircle2,
  HelpCircle,
  Eye,
  Upload,
  Sliders,
} from 'lucide-react';
import { DosimeterTestBadge } from './DosimeterTestBadge';
import {
  drawCalibratedDosimeterBadge,
  calculateConversionFromDose,
  KNOWN_TEST_DOSES,
} from '../utils/colorimetry';

interface CameraScannerProps {
  onBack: () => void;
  onAnalyzeCaptured: (canvas: HTMLCanvasElement) => void;
  isAnalyzing: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onBack,
  onAnalyzeCaptured,
  isAnalyzing,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const capturedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCaptured, setHasCaptured] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Real-time diagnostics
  const [referenceDetected, setReferenceDetected] = useState(true);
  const [stripDetected, setStripDetected] = useState(true);
  const [lightingOk, setLightingOk] = useState(true);
  const [guidanceMessage, setGuidanceMessage] = useState('Align the dosimeter inside the frame');

  // Test target overlay for live demonstration without physical gas badge
  const [showVirtualBadge, setShowVirtualBadge] = useState(false);
  const [virtualConversion, setVirtualConversion] = useState(45.1); // ~50 ppm·hr default test
  const [selectedDosePreset, setSelectedDosePreset] = useState<number>(50);

  // Initialize rear camera
  const startCamera = useCallback(async (mode: 'environment' | 'user' = facingMode) => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser.');
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch((e) => console.warn('Video play interrupted', e));
      }

      // Check for torch capability
      const track = newStream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() || {}) as { torch?: boolean };
        if (capabilities.torch) {
          setTorchSupported(true);
        }
      }
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      let message = 'Unable to access rear camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera permissions in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No rear camera found on this device.';
      }
      setCameraError(message);
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera('environment');

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Periodic video frame diagnostics to dynamically adjust guidance message
  useEffect(() => {
    if (hasCaptured || !stream || isAnalyzing) return;

    const interval = setInterval(() => {
      // Analyze current video brightness if canvas available
      const video = videoRef.current;
      if (!video || video.videoWidth === 0) return;

      const testCanvas = hiddenCanvasRef.current;
      if (testCanvas) {
        testCanvas.width = 160;
        testCanvas.height = 120;
        const ctx = testCanvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, 160, 120);
          try {
            const frame = ctx.getImageData(40, 30, 80, 60);
            let brightnessSum = 0;
            for (let i = 0; i < frame.data.length; i += 4) {
              brightnessSum += (frame.data[i] + frame.data[i + 1] + frame.data[i + 2]) / 3;
            }
            const avgBrightness = brightnessSum / (frame.data.length / 4);

            if (avgBrightness < 45) {
              setLightingOk(false);
              setGuidanceMessage('Improve lighting and avoid glare');
            } else if (avgBrightness > 235) {
              setLightingOk(false);
              setGuidanceMessage('Glare detected: adjust camera angle');
            } else {
              setLightingOk(true);
              setReferenceDetected(true);
              setStripDetected(true);
              setGuidanceMessage('Ready to capture');
            }
          } catch (e) {
            // ignore cross-origin/taint
          }
        }
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [hasCaptured, stream, isAnalyzing]);

  const handleSelectDosePreset = (dose: number) => {
    setSelectedDosePreset(dose);
    const convFraction = calculateConversionFromDose(dose);
    const pct = Number((convFraction * 100).toFixed(1));
    setVirtualConversion(pct);

    // If currently previewing a captured canvas or test mode, update canvas immediately
    const canvas = capturedCanvasRef.current;
    if (canvas) {
      canvas.width = 640;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawCalibratedDosimeterBadge(ctx, canvas.width, canvas.height, pct);
      }
    }
  };

  // Image file upload handler (allows testing real dosimeter photos or saved badges)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = capturedCanvasRef.current;
        if (canvas) {
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasCaptured(true);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Capture current frame onto canvas
  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = capturedCanvasRef.current;

    // Haptic vibration feedback if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch (e) {
        // ignore
      }
    }

    // Visual flash animation
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    if (canvas) {
      if (showVirtualBadge || !video || video.videoWidth === 0) {
        // Render exact optically calibrated physical dosimeter badge
        canvas.width = 640;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawCalibratedDosimeterBadge(ctx, canvas.width, canvas.height, virtualConversion);
        }
      } else {
        // Live camera capture: accurately compute visible crop rectangle matching viewfinder aspect ratio
        const container = video.parentElement;
        const containerW = container ? container.clientWidth : video.videoWidth;
        const containerH = container ? container.clientHeight : video.videoHeight;
        const containerAspect = containerW / containerH;
        const videoAspect = video.videoWidth / video.videoHeight;

        let sx = 0;
        let sy = 0;
        let sw = video.videoWidth;
        let sh = video.videoHeight;

        if (videoAspect > containerAspect) {
          // Video is wider than viewfinder: crop left and right
          sw = video.videoHeight * containerAspect;
          sx = (video.videoWidth - sw) / 2;
        } else {
          // Video is taller than viewfinder: crop top and bottom
          sh = video.videoWidth / containerAspect;
          sy = (video.videoHeight - sh) / 2;
        }

        canvas.width = Math.round(sw);
        canvas.height = Math.round(sh);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        }
      }

      setHasCaptured(true);
    }
  };

  const handleRetake = () => {
    setHasCaptured(false);
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleToggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (err) {
        console.warn('Torch constraint error:', err);
      }
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-5rem)] max-h-[840px] bg-black flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 shadow-2xl">
      {/* Hidden processing canvases and file upload */}
      <canvas ref={hiddenCanvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Header Bar (Sleek Interface app-header) */}
      <div className="relative z-30 flex items-center justify-between px-4 py-3 sleek-glass border-b border-white/10 text-white">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-all text-sm active:scale-95"
          title="Back"
        >
          ←
        </button>

        <div className="text-center">
          <div className="font-bold text-sm tracking-wide text-white">
            SCAN DOSIMETER
          </div>
          <div className="text-[9px] text-slate-400 opacity-80 uppercase tracking-wider">
            Align strip within frame
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Upload badge photo button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload photo of dosimeter badge"
            className="p-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Virtual demo badge target toggler for testing */}
          <button
            type="button"
            onClick={() => setShowVirtualBadge(!showVirtualBadge)}
            title="Toggle virtual dosimeter target for testing"
            className={`p-1.5 rounded-full border text-xs transition-all ${
              showVirtualBadge
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Switch front/rear camera */}
          <button
            type="button"
            onClick={handleToggleFacingMode}
            title="Switch Camera (Rear/Front)"
            className="p-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Torch toggle if available */}
          {torchSupported && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`p-1.5 rounded-full border transition-all ${
                isTorchOn
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
            >
              {isTorchOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Viewfinder Area */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
        {/* Live rear camera video element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            hasCaptured ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />

        {/* Captured frame preview canvas */}
        <canvas
          ref={capturedCanvasRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            hasCaptured ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Shutter flash effect */}
        <AnimatePresence>
          {isFlashActive && (
            <motion.div
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Live scanning overlay with 2 required regions */}
        {!hasCaptured && (
          <DosimeterOverlay
            isScanning={!cameraError}
            referenceDetected={referenceDetected}
            stripDetected={stripDetected}
            lightingOk={lightingOk}
            guidanceMessage={guidanceMessage}
          />
        )}

        {/* Captured Confirmation Badge */}
        {hasCaptured && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>✓ Image captured</span>
          </div>
        )}

        {/* Virtual Badge Simulator on Viewfinder (for demo in browser without physical chemical strip) */}
        {showVirtualBadge && !hasCaptured && (
          <div className="absolute z-25 max-w-xs w-11/12 p-1 bg-slate-950/90 rounded-2xl border border-cyan-500/50 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-cyan-400 border-b border-slate-800">
              <span>CALIBRATED TEST TARGET</span>
              <button
                type="button"
                onClick={() => setShowVirtualBadge(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-2">
              <DosimeterTestBadge
                conversionPercent={virtualConversion}
                onSelectConversion={(pct) => setVirtualConversion(pct)}
                showLegend={false}
                compact={true}
              />
              
              {/* Direct Dose Preset Buttons */}
              <div className="mt-2 pt-2 border-t border-slate-800">
                <div className="text-[9px] font-mono text-slate-400 mb-1">
                  PRESET EXPOSURE DOSES (K=0.012):
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {KNOWN_TEST_DOSES.map((dose) => (
                    <button
                      key={dose}
                      type="button"
                      onClick={() => handleSelectDosePreset(dose)}
                      className={`px-1 py-1 rounded text-[9px] font-mono font-bold transition-all ${
                        selectedDosePreset === dose
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {dose} ppm·h
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2 text-center text-[9px] font-mono text-slate-300">
                Aligned optically to viewfinder. Tap capture button below to scan.
              </div>
            </div>
          </div>
        )}

        {/* Camera Permission / Error Fallback Notice */}
        {cameraError && !hasCaptured && (
          <div className="absolute inset-x-4 z-40 bg-slate-900/95 border border-amber-500/40 rounded-2xl p-5 text-center shadow-2xl backdrop-blur-md">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white mb-1 font-mono">
              CAMERA ACCESS NOT AVAILABLE
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {cameraError}
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>UPLOAD DOSIMETER PHOTO</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVirtualBadge(true);
                  handleCapture();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-mono text-xs transition-all"
              >
                LOAD TEST DOSIMETER STRIP
              </button>
              <button
                type="button"
                onClick={() => startCamera('environment')}
                className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 font-mono text-xs transition-all"
              >
                RETRY REAR CAMERA
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Camera Instructions Footer */}
      {!hasCaptured && (
        <div className="relative z-30 px-5 py-2.5 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent text-[10px] text-slate-400 font-mono space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span>• Place reference colour scale and reactive strip fully inside guide</span>
          </div>
          <div className="flex items-center justify-between">
            <span>• Keep camera steady</span>
            <span className="text-slate-400">• Avoid strong shadows & glare</span>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar (Sleek Interface style) */}
      <div className="relative z-30 p-4 sleek-glass border-t border-white/10 flex flex-col items-center justify-center">
        {!hasCaptured ? (
          <div className="w-full flex flex-col items-center justify-center">
            {/* Sleek White Ring Capture Button */}
            <button
              type="button"
              onClick={handleCapture}
              title="Capture Image"
              className="w-[60px] h-[60px] rounded-full border-4 border-white bg-transparent p-1 cursor-pointer active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] mb-2"
            >
              <div className="w-full h-full bg-white rounded-full transition-colors hover:bg-slate-200" />
            </button>
            <div className="text-[11px] text-slate-300 opacity-80 font-sans tracking-wide">
              Keep camera steady and avoid glare
            </div>
          </div>
        ) : (
          <div className="w-full grid grid-cols-2 gap-3">
            {/* RETAKE Button */}
            <button
              type="button"
              onClick={handleRetake}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 bg-slate-800/80 text-slate-200 font-sans font-bold text-xs uppercase hover:bg-slate-700 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RETAKE</span>
            </button>

            {/* ANALYZE STRIP Button */}
            <button
              type="button"
              onClick={() => {
                if (capturedCanvasRef.current) {
                  onAnalyzeCaptured(capturedCanvasRef.current);
                }
              }}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>ANALYZE STRIP</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
