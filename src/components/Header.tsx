import React from 'react';
import { Shield, Sparkles, Sliders, Info, HelpCircle } from 'lucide-react';

interface HeaderProps {
  isDemoMode: boolean;
  onToggleDemo: () => void;
  onShowInfoModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDemoMode,
  onToggleDemo,
  onShowInfoModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0b101b]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Treatment */}
        <div className="flex items-center gap-2.5">
          {/* Logo Mark: Shield + Gas Molecule Graphic */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[10px] bg-[#0b101b] flex items-center justify-center relative overflow-hidden">
              <Shield className="w-5 h-5 text-cyan-400" />
              {/* Central H2S Sulfur/Hydrogen bond dot */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee]" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold font-mono tracking-tight text-white flex items-center gap-0.5">
                <span>H₂S</span>
                <span className="text-cyan-400">GUARDIAN</span>
              </h1>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                SIH-DOS
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[190px] font-mono">
              AI-Assisted Exposure Dosimeter
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Demo Mode Pill */}
          <button
            type="button"
            onClick={onToggleDemo}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border transition-all ${
              isDemoMode
                ? 'bg-amber-500/20 border-amber-400/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Demo Simulator Mode"
          >
            <Sliders className="w-3 h-3 text-current" />
            <span>{isDemoMode ? 'DEMO ON' : 'DEMO'}</span>
          </button>

          {/* Info Modal Button */}
          <button
            type="button"
            onClick={onShowInfoModal}
            className="p-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-cyan-300 transition-all"
            title="Principle & Scientific Disclaimer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
