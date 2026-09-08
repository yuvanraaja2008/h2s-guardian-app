import React from 'react';
import { LayoutDashboard, Camera, History, UserCheck, Sliders } from 'lucide-react';

export type TabType = 'dashboard' | 'setup' | 'scan' | 'history' | 'profile' | 'demo';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasExpiredBadge?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  hasExpiredBadge = false,
}) => {
  return (
    <nav className="w-full h-[70px] sleek-glass border-t border-white/10 px-3 flex items-center justify-around shrink-0 z-40 select-none">
      {/* 1. Dashboard */}
      <button
        type="button"
        onClick={() => onTabChange('dashboard')}
        className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] transition-all ${
          activeTab === 'dashboard'
            ? 'opacity-100 text-cyan-400 font-bold'
            : 'opacity-50 text-slate-300 hover:opacity-80'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] uppercase tracking-wider font-mono">Dash</span>
      </button>

      {/* 2. Central Prominent SCAN Button */}
      <button
        type="button"
        onClick={() => onTabChange('scan')}
        className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] transition-all relative ${
          activeTab === 'scan'
            ? 'opacity-100 text-cyan-400 font-bold'
            : 'opacity-60 text-slate-300 hover:opacity-90'
        }`}
        title="Scan Dosimeter Strip"
      >
        <div className={`p-1.5 rounded-full transition-all ${
          activeTab === 'scan'
            ? 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
            : 'bg-slate-800/80 text-slate-300'
        }`}>
          <Camera className="w-5 h-5" />
        </div>
        <span className="text-[10px] uppercase tracking-wider font-mono">Scan</span>
      </button>

      {/* 3. History / Log */}
      <button
        type="button"
        onClick={() => onTabChange('history')}
        className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] transition-all ${
          activeTab === 'history'
            ? 'opacity-100 text-cyan-400 font-bold'
            : 'opacity-50 text-slate-300 hover:opacity-80'
        }`}
      >
        <History className="w-5 h-5" />
        <span className="text-[10px] uppercase tracking-wider font-mono">Log</span>
      </button>

      {/* 4. Profile / Setup */}
      <button
        type="button"
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] transition-all relative ${
          activeTab === 'profile' || activeTab === 'setup'
            ? 'opacity-100 text-cyan-400 font-bold'
            : 'opacity-50 text-slate-300 hover:opacity-80'
        }`}
      >
        <div className="relative">
          <UserCheck className="w-5 h-5" />
          {hasExpiredBadge && (
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
          )}
        </div>
        <span className="text-[10px] uppercase tracking-wider font-mono">User</span>
      </button>
    </nav>
  );
};
