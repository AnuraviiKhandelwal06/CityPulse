import React, { useState } from 'react';
import PredictionDetailsModal from './PredictionDetailsModal';

export default function PredictiveRiskPanel({
  prediction,
  loading = false,
  error = null
}) {
  const [showDetails, setShowDetails] = useState(false);

  // Graceful Fallback if prediction model is unavailable or failed to load
  if (error || !prediction || prediction.status === 'unavailable' || prediction.risk_level === 'Unavailable') {
    return (
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-4 h-full">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔮</span>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                Predictive Risk
              </span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">
              Offline
            </span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Predictive model currently initializing or offline; baseline incident detection active.
          </p>
        </div>
        <div className="pt-2 border-t border-outline-variant/15 text-[11px] text-on-surface-variant/70">
          Model: HistGradientBoosting
        </div>
      </div>
    );
  }

  const riskLevel = prediction.risk_level || 'LOW';
  const isHigh = riskLevel === 'HIGH';
  const isMedium = riskLevel === 'MEDIUM';

  const badgeBg = isHigh
    ? 'bg-error text-on-error'
    : isMedium
      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
      : 'bg-tertiary/20 text-tertiary border border-tertiary/30';

  const drivers = prediction.risk_drivers && prediction.risk_drivers.length > 0
    ? prediction.risk_drivers
    : ['All streams operating within normal baselines'];

  return (
    <>
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 h-full">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl select-none">🔮</span>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                Predictive Risk
              </span>
            </div>
            <span className={`text-xs px-3 py-0.5 rounded-full font-bold uppercase tracking-wider ${badgeBg}`}>
              {riskLevel}
            </span>
          </div>

          <div>
            <h3 className={`text-2xl font-bold tracking-tight ${isHigh ? 'text-error' : isMedium ? 'text-amber-500' : 'text-tertiary'}`}>
              {riskLevel === 'HIGH' ? 'High Disruption Risk' : riskLevel === 'MEDIUM' ? 'Moderate Risk' : 'Low Disruption Risk'}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Potential disruption in the next 30–60 minutes.
            </p>
          </div>

          {/* Clean Risk Drivers List */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
              Risk drivers:
            </span>
            <div className="flex flex-col gap-1.5 text-xs text-on-surface">
              {drivers.slice(0, 3).map((driver, idx) => {
                let icon = '•';
                const low = driver.toLowerCase();
                if (low.includes('rain') || low.includes('precip')) icon = '🌧';
                else if (low.includes('traffic') || low.includes('speed') || low.includes('velocity')) icon = '🚗';
                else if (low.includes('waterlogging') || low.includes('flood') || low.includes('complaint')) icon = '💧';
                else if (low.includes('density') || low.includes('volume') || low.includes('corridor')) icon = '🚦';

                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm shrink-0">{icon}</span>
                    <span className="font-medium text-xs truncate">{driver}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button & Metadata */}
        <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View prediction details</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
          <span className="text-[10px] text-on-surface-variant/70 font-mono">
            HistGradientBoosting (LOEO)
          </span>
        </div>
      </div>

      {/* Deep Inspection Modal */}
      <PredictionDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        prediction={prediction}
      />
    </>
  );
}
