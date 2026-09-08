import React, { useState } from 'react';
import { WorkerProfile, ShiftType } from '../types';
import { BadgeValidity } from './BadgeValidity';
import {
  User,
  Clock,
  Shield,
  Calendar,
  ArrowRight,
  AlertTriangle,
  Building,
  CheckCircle2,
} from 'lucide-react';

interface WorkerSetupProps {
  profile: WorkerProfile;
  onSaveProfile: (profile: WorkerProfile) => void;
  onContinueToScan: () => void;
  onBack?: () => void;
}

export const WorkerSetup: React.FC<WorkerSetupProps> = ({
  profile,
  onSaveProfile,
  onContinueToScan,
  onBack,
}) => {
  const [workerId, setWorkerId] = useState(profile.workerId);
  const [shift, setShift] = useState<ShiftType>(profile.shift);
  const [badgeId, setBadgeId] = useState(profile.badgeId);
  const [expiryDate, setExpiryDate] = useState(profile.expiryDate);
  const [department, setDepartment] = useState(profile.department || 'Refinery / Gas Plant');

  // Check validity: expired if date < current date
  const isExpired = new Date(expiryDate) < new Date(new Date().toDateString());

  const handleApply = (newExpiry?: string) => {
    const exp = newExpiry || expiryDate;
    const expired = new Date(exp) < new Date(new Date().toDateString());
    onSaveProfile({
      workerId: workerId.trim() || 'W001',
      shift,
      badgeId: badgeId.trim() || 'BDG-7049-H2S',
      expiryDate: exp,
      isExpired: expired,
      department,
    });
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) return;
    handleApply();
    onContinueToScan();
  };

  // Quick preset helper to demonstrate expired vs valid badge for SIH presentation
  const setTestExpiredBadge = () => {
    const pastDate = '2026-08-15';
    setExpiryDate(pastDate);
    handleApply(pastDate);
  };

  const setTestValidBadge = () => {
    const futureDate = '2026-12-31';
    setExpiryDate(futureDate);
    handleApply(futureDate);
  };

  return (
    <div className="space-y-4 select-none">
      {/* Title */}
      <div>
        <div className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
          SCREEN 2 — INDUSTRIAL BADGE DISPATCH
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
          WORKER & DOSIMETER SETUP
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Verify worker credentials and check colorimetric badge expiration before shift monitoring.
        </p>
      </div>

      {/* Live Badge Validity Card */}
      <BadgeValidity
        badgeId={badgeId}
        expiryDate={expiryDate}
        isExpired={isExpired}
      />

      {/* Input Form */}
      <form onSubmit={handleContinue} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
        {/* Worker ID Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Worker ID</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              placeholder="e.g. W001"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 transition-all uppercase"
            />
            <div className="absolute right-3 top-2.5 text-[10px] font-mono text-slate-400 uppercase">
              REQUIRED
            </div>
          </div>
        </div>

        {/* Shift Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Shift</span>
          </label>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as ShiftType)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
          >
            <option value="Morning">Morning (06:00 - 14:00)</option>
            <option value="Afternoon">Afternoon (14:00 - 22:00)</option>
            <option value="Night">Night (22:00 - 06:00)</option>
          </select>
        </div>

        {/* Badge ID Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Badge ID</span>
          </label>
          <input
            type="text"
            value={badgeId}
            onChange={(e) => setBadgeId(e.target.value)}
            placeholder="BDG-7049-H2S"
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>

        {/* Badge Expiry Date Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Badge Expiry Date</span>
            </label>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <button
                type="button"
                onClick={setTestValidBadge}
                className="text-cyan-400 hover:underline"
              >
                Set Valid
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={setTestExpiredBadge}
                className="text-amber-400 hover:underline"
              >
                Test Expired
              </button>
            </div>
          </div>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => {
              setExpiryDate(e.target.value);
              handleApply(e.target.value);
            }}
            required
            className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none transition-all ${
              isExpired ? 'border-amber-500/70 text-amber-200' : 'border-slate-700 focus:border-cyan-400'
            }`}
          />
        </div>

        {/* Department Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Industrial Zone / Unit</span>
          </label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Warning if expired */}
        {isExpired && (
          <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Action Blocked:</strong> Colorimetric analysis cannot proceed with an expired dosimeter strip. Please replace with a valid, unexpired unit.
            </div>
          </div>
        )}

        {/* Button: CONTINUE TO SCAN */}
        <button
          type="submit"
          disabled={isExpired}
          className={`w-full py-3.5 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
            isExpired
              ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 border border-cyan-400/50 shadow-cyan-950/40'
          }`}
        >
          <span>CONTINUE TO SCAN</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
