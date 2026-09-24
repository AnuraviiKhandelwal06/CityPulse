import React, { useState, useEffect } from 'react';

export default function WhatIfSimulatorPage({
  apiFetch = null,
  onNavigate = () => {}
}) {
  // Input parameters
  const [selectedZone, setSelectedZone] = useState('Malviya Nagar');
  const [rainfall, setRainfall] = useState(42);
  const [congestion, setCongestion] = useState(65);
  const [waterlogging, setWaterlogging] = useState(7);
  const [transitDelay, setTransitDelay] = useState(12);

  // Simulation execution state
  const [isRunning, setIsRunning] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState(null); // 'idle' | 'running' | 'complete' | 'error'
  const [result, setResult] = useState(null);
  const [previousResult, setPreviousResult] = useState(null);
  const [error, setError] = useState(null);

  const zonesList = ['Malviya Nagar', 'Connaught Place', 'Saket', 'Nehru Place'];

  // Safe fetch helper
  const safeFetch = async (url) => {
    if (apiFetch) {
      try {
        const res = await apiFetch(url);
        if (res && res.ok) return res;
      } catch (e) {
        // fallback
      }
    }
    try {
      const res = await fetch(`http://127.0.0.1:8000${url}`);
      if (res.ok) return res;
    } catch (e) {
      // fallback
    }
    return fetch(url);
  };

  const executeSimulation = async (overrideParams = null) => {
    const rf = overrideParams ? overrideParams.rainfall : rainfall;
    const cg = overrideParams ? overrideParams.congestion : congestion;
    const wl = overrideParams ? overrideParams.waterlogging : waterlogging;
    const td = overrideParams ? overrideParams.transitDelay : transitDelay;
    const zn = overrideParams ? overrideParams.zone : selectedZone;

    console.log("RUN SIMULATION CLICKED", {
      rainfall: rf,
      traffic: cg,
      waterlogging: wl,
      transitDelay: td,
      selectedZone: zn
    });

    setIsRunning(true);
    setError(null);
    setSimulationStatus('running');

    try {
      const query = `/api/prediction/simulate?rainfall_mm=${rf}&traffic_congestion=${cg}&waterlogging_reports=${wl}&transit_delay_min=${td}&zone=${encodeURIComponent(zn)}`;
      const res = await safeFetch(query);
      if (!res.ok) throw new Error(`API error HTTP ${res.status}`);
      const data = await res.json();

      // Store previous result for delta computation
      if (result) {
        setPreviousResult(result);
      }
      setResult(data);
      setSimulationStatus('complete');
    } catch (err) {
      console.error('[WhatIf] Simulation call failed:', err);
      setError(err.message || 'Simulation execution failed');
      setSimulationStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  // Initial simulation run on mount
  useEffect(() => {
    executeSimulation();
  }, []);

  const handleReset = () => {
    const defaults = {
      rainfall: 0,
      congestion: 25,
      waterlogging: 0,
      transitDelay: 0,
      zone: 'Malviya Nagar'
    };
    setRainfall(defaults.rainfall);
    setCongestion(defaults.congestion);
    setWaterlogging(defaults.waterlogging);
    setTransitDelay(defaults.transitDelay);
    setSelectedZone(defaults.zone);
    executeSimulation(defaults);
  };

  const currentProb = result?.risk_probability !== null && result?.risk_probability !== undefined
    ? Math.round(result.risk_probability * 100)
    : 0;

  const previousProb = previousResult?.risk_probability !== null && previousResult?.risk_probability !== undefined
    ? Math.round(previousResult.risk_probability * 100)
    : null;

  const riskDelta = previousProb !== null ? currentProb - previousProb : null;

  const riskLevel = result?.risk_level || 'LOW';
  const detectionStatus = result?.detection?.status || 'NORMAL';

  const statusColors = {
    NORMAL: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    WATCH: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    CRITICAL: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
  };

  const riskColors = {
    LOW: 'bg-emerald-500 text-white',
    MEDIUM: 'bg-amber-500 text-white',
    HIGH: 'bg-rose-500 text-white'
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[28px]">tune</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-bold font-headline-lg text-on-surface">
                CITYPULSE WHAT-IF SIMULATOR
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-[11px] font-mono font-bold text-primary">
                Simulation / Decision Support
              </span>
            </div>
            <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
              Explore municipal resilience by adjusting environmental and civic conditions. Evaluates synthetic scenarios through the <strong>HistGradientBoosting</strong> nowcast model and multi-source anomaly engine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/25 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Reset Scenario
          </button>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Live Intelligence Response on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Scenario Controls */}
        <div className="lg:col-span-5 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
              Scenario Inputs
            </span>
            <span className="text-xs text-on-surface-variant">Adjust variables below</span>
          </div>

          {/* Zone Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
              Target Corridor / Zone
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {zonesList.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setSelectedZone(z)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                    selectedZone === z
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* Input 1: Rainfall */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <span className="text-base select-none">🌧</span>
                Rainfall Precipitation Rate
              </label>
              <span className="text-xs font-bold font-mono px-2 py-0.5 bg-surface-container rounded-lg text-primary">
                {rainfall} mm/h
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="1"
              value={rainfall}
              onChange={(e) => setRainfall(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
              <span>0 (Dry)</span>
              <span>30 (Moderate)</span>
              <span>75+ (Torrential)</span>
            </div>
          </div>

          {/* Input 2: Traffic Congestion */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <span className="text-base select-none">🚗</span>
                Traffic Congestion Index
              </label>
              <span className="text-xs font-bold font-mono px-2 py-0.5 bg-surface-container rounded-lg text-primary">
                {congestion}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="1"
              value={congestion}
              onChange={(e) => setCongestion(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
              <span>10% (Free Flow)</span>
              <span>50% (Normal Peak)</span>
              <span>90%+ (Gridlock)</span>
            </div>
          </div>

          {/* Input 3: Waterlogging Reports */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <span className="text-base select-none">💧</span>
                Waterlogging Citizen Complaints
              </label>
              <span className="text-xs font-bold font-mono px-2 py-0.5 bg-surface-container rounded-lg text-primary">
                {waterlogging} reports
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={waterlogging}
              onChange={(e) => setWaterlogging(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
              <span>0 (None)</span>
              <span>5 (Emerging)</span>
              <span>20+ (Severe Flash)</span>
            </div>
          </div>

          {/* Input 4: Transit Delay */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <span className="text-base select-none">🚌</span>
                Bus / Transit Corridor Delay
              </label>
              <span className="text-xs font-bold font-mono px-2 py-0.5 bg-surface-container rounded-lg text-primary">
                +{transitDelay} min
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              step="1"
              value={transitDelay}
              onChange={(e) => setTransitDelay(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
              <span>0m (On Time)</span>
              <span>15m (Moderate)</span>
              <span>40m+ (Major)</span>
            </div>
          </div>

          {/* Run Simulation Button */}
          <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => executeSimulation()}
              disabled={isRunning}
              className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold text-sm tracking-wide shadow-md hover:bg-primary/90 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
            >
              <span className={`material-symbols-outlined text-[20px] ${isRunning ? 'animate-spin' : ''}`}>
                {isRunning ? 'sync' : 'play_arrow'}
              </span>
              {isRunning ? 'Running simulation...' : 'RUN SIMULATION'}
            </button>

            {simulationStatus === 'complete' && (
              <div className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1 py-1">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                Simulation complete &bull; Model state updated
              </div>
            )}
          </div>
        </div>

        {/* Right Column: CityPulse Intelligence Response */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {error && (
            <div className="p-4 rounded-xl bg-error/15 border border-error/30 text-error text-xs">
              <strong>Simulation Error:</strong> {error}
            </div>
          )}

          {/* Section 8: Scenario Result Before / After Comparison */}
          {previousProb !== null && (
            <div className="bg-surface-container-low p-4 rounded-2xl border border-primary/30 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                  SCENARIO RESULT
                </span>
                <div className="flex items-center gap-3 text-xs text-on-surface">
                  <span>Previous risk: <strong>{previousProb}%</strong></span>
                  <span>&rarr;</span>
                  <span>New risk: <strong>{currentProb}%</strong></span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                    riskDelta > 0
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : riskDelta < 0
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    Change: {riskDelta > 0 ? `+${riskDelta}%` : `${riskDelta}%`}
                  </span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-0.5">
                <span className="text-[10px] font-mono uppercase text-on-surface-variant">Detection</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${statusColors[detectionStatus] || statusColors.NORMAL}`}>
                  {detectionStatus}
                </span>
              </div>
            </div>
          )}

          {/* Current Scenario Card */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                CURRENT SCENARIO: {result?.zone || selectedZone}
              </span>
              <span className="text-xs font-mono text-tertiary">Real-time Model Synced</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
                <span className="text-[10px] text-on-surface-variant uppercase font-mono">Rainfall</span>
                <span className="text-base font-bold text-on-surface">{result?.scenario?.rainfall_mm ?? rainfall} mm/h</span>
                <span className="text-[10px] text-on-surface-variant">Precipitation rate</span>
              </div>
              <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
                <span className="text-[10px] text-on-surface-variant uppercase font-mono">Traffic</span>
                <span className="text-base font-bold text-on-surface">{result?.scenario?.traffic_congestion_pct ?? congestion}%</span>
                <span className="text-[10px] text-on-surface-variant">Congestion index</span>
              </div>
              <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
                <span className="text-[10px] text-on-surface-variant uppercase font-mono">Civic Reports</span>
                <span className="text-base font-bold text-on-surface">{result?.scenario?.waterlogging_reports ?? waterlogging} reports</span>
                <span className="text-[10px] text-on-surface-variant">Waterlogging tickets</span>
              </div>
              <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
                <span className="text-[10px] text-on-surface-variant uppercase font-mono">Transit Delay</span>
                <span className="text-base font-bold text-on-surface">+{result?.scenario?.transit_delay_min ?? transitDelay} min</span>
                <span className="text-[10px] text-on-surface-variant">Bus headway delay</span>
              </div>
            </div>
          </div>

          {/* Current Detection + Predictive Risk Dual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Current Detection State */}
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono block mb-3">
                  CURRENT DETECTION
                </span>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${statusColors[detectionStatus] || statusColors.NORMAL}`}>
                    {detectionStatus}
                  </div>
                  <span className="text-xs text-on-surface-variant font-mono">
                    Severity: {result?.detection?.severity_score ? Math.round(result.detection.severity_score * 100) : 0}%
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
                  Evaluated using CityPulse multi-source anomaly thresholding and cross-domain severity synthesis.
                </p>
              </div>

              <div className="pt-3 border-t border-outline-variant/15 text-[11px] text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">analytics</span>
                <span>Real-time cross-domain rule engine</span>
              </div>
            </div>

            {/* Predictive Risk (Nowcast ML) */}
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                    PREDICTIVE RISK
                  </span>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${riskColors[riskLevel] || riskColors.LOW}`}>
                    {riskLevel}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-extrabold text-on-surface font-headline-xl">
                    {currentProb}%
                  </span>
                  <span className="text-xs text-on-surface-variant font-mono">
                    disruption probability (30–60m)
                  </span>
                </div>

                <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full ${riskLevel === 'HIGH' ? 'bg-rose-500' : riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(2, currentProb)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/15 text-[11px] text-on-surface-variant flex items-center justify-between">
                <span>Model: HistGradientBoosting</span>
                <span className="font-mono text-primary">Raw: {result?.risk_probability !== null ? result?.risk_probability?.toFixed(4) : '--'}</span>
              </div>
            </div>
          </div>

          {/* Model Risk Drivers Card */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
              Model Risk Drivers
            </span>
            <div className="flex flex-col gap-2">
              {(result?.risk_drivers && result.risk_drivers.length > 0 ? result.risk_drivers : ['Nominal telemetry across all monitored streams']).map((driver, idx) => (
                <div key={idx} className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex items-center gap-3 text-xs md:text-sm text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                  <span className="font-medium">{driver}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
              {result?.synthesis}
            </p>
          </div>

          {/* Scientific Disclaimer */}
          <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/25 shadow-sm flex items-center gap-2 text-xs text-on-surface-variant italic">
            <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0">info</span>
            <span>
              <strong>Scientific Disclaimer:</strong> Simulation / Decision Support only. <strong>Correlation detected; causation is not established.</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
