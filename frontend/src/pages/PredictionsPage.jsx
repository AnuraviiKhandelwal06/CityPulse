import React, { useState, useEffect } from 'react';

export default function PredictionsPage({
  currentStep = 4,
  apiFetch = null,
  onNavigate = () => {}
}) {
  const [selectedZone, setSelectedZone] = useState('Malviya Nagar');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Safe fetch helper ensuring both Vite proxy and direct 127.0.0.1 work
  const safeFetch = async (url) => {
    if (apiFetch) return apiFetch(url);
    try {
      const res = await fetch(`http://127.0.0.1:8000${url}`);
      if (res.ok) return res;
    } catch (e) {
      // Fallback to relative path via Vite dev proxy
    }
    return fetch(url);
  };

  // Fetch prediction from actual ML model whenever zone or currentStep changes
  useEffect(() => {
    let isMounted = true;
    const fetchPrediction = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryUrl = `/api/prediction?zone=${encodeURIComponent(selectedZone)}&step=${currentStep}`;
        console.log(`[PredictionsPage] Requesting ML prediction: zone=${selectedZone}, step=${currentStep}`);
        const res = await safeFetch(queryUrl);

        if (!res.ok) {
          throw new Error(`Prediction API responded with HTTP status ${res.status}`);
        }

        const data = await res.json();
        console.log('[PredictionsPage] Received model prediction payload:', data);

        if (isMounted) {
          if (data.status === 'unavailable' || data.risk_level === 'Unavailable') {
            setError(data.message || 'Predictive model currently unavailable on server');
            setPrediction(null);
          } else {
            setPrediction(data);
          }
        }
      } catch (err) {
        console.error('[PredictionsPage] Failed to fetch prediction:', err);
        if (isMounted) {
          setError(err.message || 'Failed to connect to Prediction API');
          setPrediction(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPrediction();
    return () => { isMounted = false; };
  }, [selectedZone, currentStep]);

  const zonesList = ['Malviya Nagar', 'Connaught Place', 'Saket', 'Nehru Place'];

  // Handle Loading State
  if (loading && !prediction) {
    return (
      <div className="flex flex-col gap-6">
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
            <span className="font-bold text-sm text-on-surface">Running HistGradientBoosting inference...</span>
            <span className="text-xs text-on-surface-variant font-mono">Consuming step {currentStep} telemetry for {selectedZone}</span>
          </div>
        </div>
      </div>
    );
  }

  // Handle Error / Model Unavailable State (No fake numbers!)
  if (error || !prediction) {
    return (
      <div className="flex flex-col gap-6">
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/15 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[24px]">error</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-headline-lg text-on-surface">
                Prediction Center
              </h1>
              <p className="text-xs text-error font-medium">
                Predictive model unavailable: {error || 'Model did not return a valid probability'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('overview')}
              className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/25 transition-colors cursor-pointer"
            >
              &larr; Back to Overview
            </button>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-surface-container-low border border-error/30 flex flex-col items-center justify-center text-center gap-3">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold text-on-surface">HistGradientBoosting Model Unavailable</h2>
          <p className="text-xs text-on-surface-variant max-w-lg leading-relaxed">
            The machine learning nowcasting model could not complete inference for <strong>{selectedZone}</strong> at simulation step <strong>{currentStep}</strong>.
            Current incident detection and multi-stream correlation remain fully operational.
          </p>
          <div className="p-3 bg-surface-container rounded-xl font-mono text-[11px] text-error border border-error/20 max-w-md text-left">
            <strong>Technical Error:</strong> {error || 'Connection to /api/prediction failed'}
          </div>
        </div>
      </div>
    );
  }

  // Real Prediction values directly from the model
  const rawProba = prediction.risk_probability !== null && prediction.risk_probability !== undefined
    ? Number(prediction.risk_probability)
    : 0.0;

  const probPercent = Math.round(rawProba * 100);
  const formattedRawProba = rawProba.toFixed(4);

  const riskLevel = prediction.risk_level || 'LOW';
  const isHigh = riskLevel === 'HIGH';
  const isMedium = riskLevel === 'MEDIUM';

  const badgeBg = isHigh
    ? 'bg-error text-on-error'
    : isMedium
      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
      : 'bg-tertiary/20 text-tertiary border border-tertiary/30';

  const barColor = isHigh
    ? 'bg-error'
    : isMedium
      ? 'bg-amber-400'
      : 'bg-tertiary';

  const features = prediction.features || {};

  const featureRows = [
    { name: 'rainfall_mm', label: 'Rainfall Rate', val: features.rainfall_mm, unit: 'mm/h', desc: 'Current precipitation' },
    { name: 'rainfall_sum_1h', label: '1-Hour Rain Accumulation', val: features.rainfall_sum_1h, unit: 'mm', desc: 'Rolling 60m accumulation' },
    { name: 'rainfall_sum_3h', label: '3-Hour Rain Accumulation', val: features.rainfall_sum_3h, unit: 'mm', desc: 'Rolling 180m accumulation' },
    { name: 'speed_drop_pct', label: 'Speed Deterioration', val: features.speed_drop_pct, unit: '%', desc: 'Drop vs 46.5 km/h baseline' },
    { name: 'vehicle_count', label: 'Corridor Volume', val: features.vehicle_count, unit: 'veh', desc: 'Arterial density estimate' },
    { name: 'waterlogging_count_t', label: 'Waterlogging Complaints', val: features.waterlogging_count_t, unit: '', desc: 'Active 311 flood tickets (binary)' },
    { name: 'other_incidents_count_t', label: 'Other Civic Incidents', val: features.other_incidents_count_t, unit: '', desc: 'Secondary incidents (binary)' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">online_prediction</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl md:text-2xl font-bold font-headline-lg text-on-surface">
                Prediction Center
              </h1>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-[11px] font-mono font-semibold text-primary">
                Simulation Step {currentStep} (T+{currentStep * 5}m)
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">
              30–60 minute forward disruption risk computed by HistGradientBoosting GBDT ensemble
            </p>
          </div>
        </div>

        {/* Zone Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-on-surface-variant uppercase">Target Zone:</span>
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/20">
            {zonesList.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setSelectedZone(z)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedZone === z
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Probability Gauge + Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Probability Gauge Card */}
        <div className="lg:col-span-6 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                Disruption Probability ({prediction.prediction_window_minutes || 30}–{prediction.prediction_horizon_minutes || 60}m Forward Window)
              </span>
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${badgeBg}`}>
                {riskLevel} RISK
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <span className="text-4xl md:text-5xl font-extrabold text-on-surface font-headline-xl">
                {probPercent}%
                <span className="text-xs font-normal text-on-surface-variant ml-2 font-mono">
                  (raw: {formattedRawProba})
                </span>
              </span>
              <span className="text-xs text-secondary font-medium">
                Target: Flood &gt; 0 OR Speed Drop &gt; 25%
              </span>
            </div>

            {/* Gauge bar */}
            <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden mt-1">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-700`}
                style={{ width: `${Math.max(2, probPercent)}%` }}
              ></div>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed mt-2">
              {prediction.synthesis || `Live signals for ${selectedZone} at step ${currentStep} indicate ${riskLevel.toLowerCase()} disruption risk over the next 30–60 minutes.`}
            </p>
          </div>

          {/* Model Specs */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-outline-variant/15 text-xs">
            <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
              <span className="text-[10px] text-on-surface-variant uppercase font-mono">Algorithm</span>
              <span className="font-bold text-on-surface">HistGradientBoosting</span>
              <span className="text-[10px] text-on-surface-variant">Scikit-learn GBDT</span>
            </div>
            <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
              <span className="text-[10px] text-on-surface-variant uppercase font-mono">Validation</span>
              <span className="font-bold text-on-surface">Leave-One-Event-Out</span>
              <span className="text-[10px] text-on-surface-variant">Storm episode cross-validation</span>
            </div>
          </div>
        </div>

        {/* Right Column: Associated Risk Drivers Card */}
        <div className="lg:col-span-6 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                Contributing Risk Drivers ({selectedZone})
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {prediction.risk_drivers?.length || 0} Key Factors
              </span>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              {(prediction.risk_drivers && prediction.risk_drivers.length > 0 ? prediction.risk_drivers : ['Nominal telemetry across all monitored streams']).map((driver, idx) => {
                let icon = '•';
                const low = driver.toLowerCase();
                if (low.includes('rain') || low.includes('precip')) icon = '🌧';
                else if (low.includes('traffic') || low.includes('speed') || low.includes('velocity')) icon = '🚗';
                else if (low.includes('waterlogging') || low.includes('flood') || low.includes('complaint')) icon = '💧';
                else if (low.includes('density') || low.includes('volume') || low.includes('corridor')) icon = '🚦';

                return (
                  <div key={idx} className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex items-center gap-3">
                    <span className="text-xl shrink-0 select-none">{icon}</span>
                    <span className="text-xs md:text-sm font-semibold text-on-surface leading-tight">
                      {driver}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15 text-xs text-on-surface-variant leading-relaxed">
            <span className="font-bold text-on-surface block mb-1">
              How the Nowcast Operates:
            </span>
            The model consumes raw signals at simulation step {currentStep} to compute the posterior probability that significant traffic collapse (&gt; 25% drop) or citizen waterlogging tickets will occur during the future 30 to 60 minute window.
          </div>
        </div>
      </div>

      {/* 7-Dimensional Ingested Features Table */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
            Live Feature Matrix (7 Dimensions Passed to Model)
          </span>
          <span className="text-xs text-on-surface-variant font-mono">Zone: {selectedZone} | Step: {currentStep}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {featureRows.map((f) => (
            <div key={f.name} className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col justify-between gap-1">
              <div>
                <span className="text-[10px] font-mono uppercase text-on-surface-variant block">{f.name}</span>
                <span className="font-bold text-xs text-on-surface mt-0.5 block">{f.label}</span>
              </div>
              <div className="pt-2 border-t border-outline-variant/10 flex items-baseline justify-between">
                <span className="text-[10px] text-on-surface-variant truncate max-w-[130px]">{f.desc}</span>
                <span className="font-mono font-bold text-primary text-sm">
                  {f.val !== undefined ? f.val : '--'} {f.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Disclaimer */}
      <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/25 shadow-sm flex items-center gap-2 text-xs text-on-surface-variant italic">
        <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0">info</span>
        <span>
          <strong>Scientific Disclaimer:</strong> High nowcast probability indicates historical statistical pattern alignment. <strong>Correlation detected; causation is not established.</strong>
        </span>
      </div>
    </div>
  );
}
