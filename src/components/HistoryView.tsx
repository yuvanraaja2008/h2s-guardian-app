import React, { useState } from 'react';
import { DosimeterAnalysisResult, ShiftType } from '../types';
import { getStatusColor } from '../utils/colorimetry';
import {
  Calendar,
  Clock,
  User,
  Shield,
  Trash2,
  TrendingUp,
  BarChart3,
  FileText,
  Filter,
  Sparkles,
  ChevronRight,
  Database,
} from 'lucide-react';

interface HistoryViewProps {
  records: DosimeterAnalysisResult[];
  onSelectRecord: (record: DosimeterAnalysisResult) => void;
  onClearHistory: () => void;
  onLoadDemoRecords: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onSelectRecord,
  onClearHistory,
  onLoadDemoRecords,
}) => {
  const [filterShift, setFilterShift] = useState<string>('ALL');

  const filteredRecords = records.filter((rec) => {
    if (filterShift === 'ALL') return true;
    return rec.shift === filterShift;
  });

  // Calculate shift stats
  const shiftStats: Record<ShiftType, { count: number; totalDose: number; maxDose: number }> = {
    Morning: { count: 0, totalDose: 0, maxDose: 0 },
    Afternoon: { count: 0, totalDose: 0, maxDose: 0 },
    Night: { count: 0, totalDose: 0, maxDose: 0 },
  };

  records.forEach((r) => {
    if (shiftStats[r.shift]) {
      shiftStats[r.shift].count += 1;
      shiftStats[r.shift].totalDose += r.dose_ppm_hr;
      if (r.dose_ppm_hr > shiftStats[r.shift].maxDose) {
        shiftStats[r.shift].maxDose = r.dose_ppm_hr;
      }
    }
  });

  const maxHistoricalDose = Math.max(10, ...records.map((r) => r.dose_ppm_hr));

  return (
    <div className="space-y-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
            SCREEN 7 — AUDIT LOGS
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            EXPOSURE HISTORY
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              title="Clear stored records"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-all text-xs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">
              NO DOSIMETER RECORDS LOGGED
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              No chemical strip scans have been saved to local digital storage yet. Complete a dosimeter scan or enable demo records for evaluation.
            </p>
          </div>
          <button
            type="button"
            onClick={onLoadDemoRecords}
            className="py-2.5 px-4 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-400/40 text-cyan-300 font-mono font-semibold text-xs tracking-wide transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>LOAD DEMO SHIFT LOGS</span>
          </button>
        </div>
      ) : (
        <>
          {/* Trends & Shift Analytics Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-cyan-400">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                <span>SHIFT DOSIMETRY DISTRIBUTION</span>
              </span>
              <span className="text-[10px] text-slate-400 lowercase">{records.length} total entries</span>
            </div>

            {/* Dose by shift distribution bar chart */}
            <div className="grid grid-cols-3 gap-2">
              {(['Morning', 'Afternoon', 'Night'] as ShiftType[]).map((sh) => {
                const stat = shiftStats[sh];
                const avg = stat.count > 0 ? (stat.totalDose / stat.count).toFixed(1) : '0.0';
                return (
                  <div key={sh} className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">{sh}</span>
                    <span className="text-sm font-mono font-bold text-white mt-0.5 block">{avg}</span>
                    <span className="text-[9px] font-mono text-cyan-400 block">avg ppm·hr ({stat.count})</span>
                  </div>
                );
              })}
            </div>

            {/* Visual Mini Timeline Sparkline */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                <span>WEEKLY EXPOSURE TREND</span>
                <span>MAX: {maxHistoricalDose.toFixed(1)} ppm·hr</span>
              </div>
              <div className="h-16 flex items-end gap-1.5 bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
                {records.slice(-10).map((rec, i) => {
                  const colors = getStatusColor(rec.status);
                  const barHeight = Math.max(12, Math.min(100, (rec.dose_ppm_hr / maxHistoricalDose) * 100));
                  return (
                    <div
                      key={rec.id + i}
                      onClick={() => onSelectRecord(rec)}
                      className="flex-1 flex flex-col items-center cursor-pointer group h-full justify-end"
                      title={`${rec.workerId} (${rec.shift}): ${rec.dose_ppm_hr} ppm·hr`}
                    >
                      <div
                        className="w-full rounded-t transition-all group-hover:brightness-125"
                        style={{
                          height: `${barHeight}%`,
                          backgroundColor: colors.hex,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-1">
                <span>Earliest logged</span>
                <span>Recent scan</span>
              </div>
            </div>
          </div>

          {/* Shift Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {['ALL', 'Morning', 'Afternoon', 'Night'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterShift(tab)}
                className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition-all ${
                  filterShift === tab
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Records List Cards */}
          <div className="space-y-2.5">
            {filteredRecords.map((record) => {
              const statusColors = getStatusColor(record.status);
              const formattedDate = new Date(record.timestamp).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={record.id}
                  onClick={() => onSelectRecord(record)}
                  className={`bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-3.5 transition-all cursor-pointer shadow-md group active:scale-[0.99]`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* Strip Color indicator */}
                      <div
                        className="w-8 h-10 rounded-md border border-black/40 shadow-inner shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: record.sampledStripHex }}
                        title={`Strip: ${record.sampledStripHex}`}
                      >
                        <span className="text-[7px] font-mono text-white mix-blend-difference font-bold">
                          {record.conversion.toFixed(0)}%
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white">
                            {record.workerId}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                            {record.shift}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span>Conv: {record.conversion.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-white">
                          {record.dose_ppm_hr.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">ppm·hr</span>
                        </div>
                        <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${statusColors.badgeBg} ${statusColors.badgeText} ${statusColors.badgeBorder}`}>
                          {record.status}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
