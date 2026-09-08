import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

interface BadgeValidityProps {
  badgeId: string;
  expiryDate: string;
  isExpired: boolean;
  compact?: boolean;
}

export const BadgeValidity: React.FC<BadgeValidityProps> = ({
  badgeId,
  expiryDate,
  isExpired,
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${
          isExpired
            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        }`}
      >
        {isExpired ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>⚠ BADGE EXPIRED</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>✓ BADGE VALID</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        isExpired
          ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
          : 'bg-slate-900/80 border-slate-800 text-slate-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
              isExpired
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {isExpired ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="text-xs font-mono font-bold flex items-center gap-1.5">
              <span>DOSIMETER BADGE:</span>
              <span className="text-cyan-400">{badgeId}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Expiry Date: <span className={isExpired ? 'text-amber-400 font-semibold' : 'text-slate-300'}>{expiryDate}</span>
            </div>
          </div>
        </div>

        <div
          className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider border shadow-sm flex items-center gap-1.5 ${
            isExpired
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
          }`}
        >
          {isExpired ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>⚠ BADGE EXPIRED</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ BADGE VALID</span>
            </>
          )}
        </div>
      </div>

      {isExpired && (
        <div className="mt-2.5 pt-2 border-t border-amber-500/20 text-xs text-amber-300 flex items-start gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Safety Violation:</strong> Chemical reagent integrity has passed expiration. Normal colorimetric dosimetry cannot proceed until a fresh unexpired dosimeter is issued.
          </span>
        </div>
      )}
    </div>
  );
};
