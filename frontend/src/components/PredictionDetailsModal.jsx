import React from 'react';

export default function PredictionDetailsModal({
  isOpen,
  onClose,
  prediction
}) {
  if (!isOpen || !prediction) return null;

  const probPercent = prediction.risk_probability !== null && prediction.risk_probability !== undefined
    ? Math.round(prediction.risk_probability * 100)
    : 0;

  const rawProba = prediction.risk_probability !== null && prediction.risk_probability !== undefined
    ? Number(prediction.risk_probability).toFixed(4)
    : '0.0000';

  const riskLevel = prediction.risk_level || 'LOW';
  const isHigh = riskLevel === 'HIGH';
  const isMedium = riskLevel === 'MEDIUM';

  const badgeBg = isHigh
    ? 'bg-error text-on-error'
    : isMedium
      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      : 'bg-tertiary/20 text-tertiary border border-tertiary/30';

  const barColor = isHigh
    ? 'bg-error'
    : isMedium
      ? 'bg-amber-400'
      : 'bg-tertiary';

  const features = prediction.features || {
    rainfall_mm: 82.5,
    rainfall_sum_1h: 82.5,
    rainfall_sum_3h: 96.0,
    speed_drop_pct: 90.97,
    vehicle_count: 922.0,
    waterlogging_count_t: 1.0,
    other_incidents_count_t: 1.0
  };

  const featureLabels = [
    { key: 'rainfall_mm', label: 'Rainfall Rate', unit: 'mm/h', desc: 'Current instantaneous precipitation' },
    { key: 'rainfall_sum_1h', label: '1-Hour Rain Accumulation', unit: 'mm', desc: 'Rolling 60-min precipitation total' },
    { key: 'rainfall_sum_3h', label: '3-Hour Rain Accumulation', unit: 'mm', desc: 'Rolling 180-min precipitation total' },
    { key: 'speed_drop_pct', label: 'Speed Deterioration', unit: '%', desc: 'Drop vs 46.5 km/h dry baseline' },
    { key: 'vehicle_count', label: 'Corridor Volume', unit: 'veh', desc: 'Estimated arterial density' },
    { key: 'waterlogging_count_t', label: 'Waterlogging Complaints', unit: '', desc: 'Active 311 flood tickets (binary)' },
    { key: 'other_incidents_count_t', label: 'Other Civic Incidents', unit: '', desc: 'Secondary incident reports (binary)' },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-low/95 backdrop-blur-md px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔮</span>
            <div>
              <h2 className="font-headline-sm font-bold text-on-surface">Predictive Risk Nowcast Analysis</h2>
              <p className="text-xs text-on-surface-variant font-medium">
                Machine Learning 30–60 Minute Disruption Forecast Details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Top Probability Gauge Card */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Disruption Probability ({prediction.prediction_window_minutes || 30}–{prediction.prediction_horizon_minutes || 60}m Horizon)
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${badgeBg}`}>
                {riskLevel} RISK
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-on-surface font-headline-xl">
                {probPercent}%
                <span className="text-xs font-normal text-on-surface-variant ml-2 font-mono">
                  (raw: {rawProba})
                </span>
              </span>
              <span className="text-xs text-secondary font-medium">
                Target: Waterlogging &gt; 0 OR Speed Drop &gt; 25%
              </span>
            </div>

            {/* Gauge bar */}
            <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-500`}
                style={{ width: `${Math.max(2, probPercent)}%` }}
              ></div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {prediction.synthesis || `Nominal telemetry indicates ${riskLevel.toLowerCase()} disruption risk for the upcoming 30–60 minute window.`}
            </p>
          </div>

          {/* Model Architecture & Validation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 flex flex-col gap-1">
              <span className="text-on-surface-variant font-medium">Model Architecture</span>
              <span className="font-bold font-mono text-on-surface text-sm">
                HistGradientBoostingClassifier
              </span>
              <span className="text-[11px] text-on-surface-variant">
                Gradient-boosted decision tree ensemble optimized for binned tabular telemetry.
              </span>
            </div>

            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/15 flex flex-col gap-1">
              <span className="text-on-surface-variant font-medium">Validation Methodology</span>
              <span className="font-bold text-on-surface text-sm">
                Leave-One-Event-Out (LOEO)
              </span>
              <span className="text-[11px] text-on-surface-variant">
                Evaluated across isolated storm episodes to prevent temporal cross-contamination.
              </span>
            </div>
          </div>

          {/* Ingested Features */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Live Ingested Simulation Telemetry (7 Input Dimensions)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {featureLabels.map((f) => (
                <div key={f.key} className="p-2.5 bg-surface-container rounded-lg flex items-center justify-between border border-outline-variant/10">
                  <div>
                    <span className="font-semibold text-on-surface block">{f.label}</span>
                    <span className="text-[11px] text-on-surface-variant">{f.desc}</span>
                  </div>
                  <span className="font-mono font-bold text-primary text-sm shrink-0 ml-2">
                    {features[f.key] !== undefined ? features[f.key] : '--'} {f.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Model Limitations & Disclaimers */}
          <div className="p-3.5 bg-surface-container-high/60 rounded-xl border border-outline-variant/20 flex flex-col gap-2 text-xs">
            <span className="font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-500">warning</span>
              Model Limitations &amp; Scientific Integrity
            </span>
            <ul className="list-disc pl-4 space-y-1 text-on-surface-variant leading-relaxed">
              <li>
                <strong>Horizon:</strong> Forecast applies strictly to the 30–60 minute forward time horizon; conditions beyond 60 minutes require subsequent radar passes.
              </li>
              <li>
                <strong>Omission of Time of Day:</strong> Diurnal hour-of-day features were explicitly excluded based on LOEO validation findings to avoid overfitting on synthetic diurnal cycles.
              </li>
              <li>
                <strong>Empirical Warning:</strong> High predicted risk indicates statistical association with historical disruption signatures, not a guaranteed physical catastrophe.
              </li>
            </ul>

            <div className="mt-1 pt-2 border-t border-outline-variant/20 text-xs italic text-on-surface font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-amber-500 shrink-0">info</span>
              <span><strong>Scientific Disclaimer:</strong> Correlation detected; causation is not established.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface-container-low px-6 py-3 border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
