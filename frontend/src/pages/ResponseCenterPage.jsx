import React, { useState, useEffect } from 'react';

export default function ResponseCenterPage({
  apiFetch = null,
  onNavigate = () => {},
  currentStep = 4,
  onOpenWhy = () => {}
}) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeMessage, setActiveMessage] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [rerouteResult, setRerouteResult] = useState(null);

  const safeFetch = async (url, options = {}) => {
    if (apiFetch) return apiFetch(url, options);
    try {
      const res = await fetch(`http://127.0.0.1:8000${url}`, options);
      if (res.ok) return res;
    } catch (e) {
      // Fallback
    }
    return fetch(url, options);
  };

  const fetchContext = async () => {
    try {
      const res = await safeFetch('/api/response/context');
      if (res.ok) {
        const data = await res.json();
        setContext(data);
        if (data.action_history) {
          setActionHistory(data.action_history);
        }
      }
    } catch (err) {
      console.error('[ResponseCenterPage] Failed to fetch context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, [currentStep]);

  const handleExecuteAction = async (actionType) => {
    setActionLoading(true);
    setActiveMessage(null);
    try {
      const res = await safeFetch('/api/response/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: actionType,
          zone: context?.situation?.zone || 'Malviya Nagar Underpass'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveMessage(data.message);
        if (data.action) {
          setActionHistory((prev) => [data.action, ...prev]);
          if (actionType === 'simulate_reroute') {
            setRerouteResult(data.action);
          }
        }
        await fetchContext();
      }
    } catch (err) {
      console.error('[ResponseCenterPage] Action execution failed:', err);
      setActiveMessage('Action simulation could not be executed.');
    } finally {
      setActionLoading(false);
    }
  };

  const sit = context?.situation;
  const reroute = context?.reroute_simulation;
  const corridors = context?.nearby_corridors || [];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-primary text-2xl">crisis_alert</span>
              <h1 className="text-xl md:text-2xl font-bold text-on-surface">Response Center</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                Simulation / Decision Support
              </span>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Synthesizes real-time situation intelligence into simulated municipal countermeasures. Evaluate tactical broadcasts, monitor adjacent corridors, verify multi-stream evidence, and simulate arterial traffic rerouting deltas. All actions function strictly as decision support simulation; no live infrastructure commands are transmitted.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface border border-outline-variant/25 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
              {sit?.alert_active ? `${sit.severity} Alert Active` : 'Baseline Monitoring'}
            </span>
            <button
              type="button"
              onClick={() => onNavigate('ask')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">forum</span>
              <span>Ask CityPulse</span>
            </button>
          </div>
        </div>

        {/* Operational Progression Indicator */}
        <div className="mt-5 pt-4 border-t border-outline-variant/15 flex flex-wrap items-center gap-2 text-xs font-bold text-on-surface-variant">
          <span className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface">
            1. OBSERVE
          </span>
          <span className="text-outline-variant">&rarr;</span>
          <span className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface">
            2. UNDERSTAND
          </span>
          <span className="text-outline-variant">&rarr;</span>
          <span className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface">
            3. PREDICT
          </span>
          <span className="text-outline-variant">&rarr;</span>
          <span className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface">
            4. SIMULATE
          </span>
          <span className="text-outline-variant">&rarr;</span>
          <span className="px-2.5 py-1 rounded-lg bg-primary text-on-primary shadow-sm font-black">
            5. RESPOND
          </span>
        </div>
      </div>

      {/* Action Notification Toast Banner */}
      {activeMessage && (
        <div className="p-4 rounded-xl bg-tertiary/10 border border-tertiary/30 text-tertiary text-xs md:text-sm font-semibold flex items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{activeMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveMessage(null)}
            className="text-on-surface-variant hover:text-on-surface text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Active Situation Summary Card */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/15 pb-4">
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Active Municipal Situation
            </span>
            <h2 className="text-lg md:text-xl font-bold text-on-surface mt-0.5">
              {sit?.zone || 'Malviya Nagar Underpass'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                sit?.severity === 'CRITICAL'
                  ? 'bg-error/10 text-error border-error/20'
                  : sit?.severity === 'HIGH'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  : 'bg-tertiary/10 text-tertiary border-tertiary/20'
              }`}
            >
              Severity: {sit?.severity || 'LOW'} ({Math.round((sit?.severity_score || 0.1) * 100)}%)
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              Confidence: {Math.round((sit?.confidence || 0.95) * 100)}%
            </span>
          </div>
        </div>

        {/* Real-time Telemetry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15">
            <span className="text-[10px] text-on-surface-variant font-medium block">Precipitation Rate</span>
            <span className="text-sm md:text-base font-bold text-primary mt-1 block">
              {sit?.signals?.rainfall || '0.0 mm/h'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15">
            <span className="text-[10px] text-on-surface-variant font-medium block">Arterial Congestion</span>
            <span className="text-sm md:text-base font-bold text-error mt-1 block">
              {sit?.signals?.congestion || '38%'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15">
            <span className="text-[10px] text-on-surface-variant font-medium block">Average Velocity</span>
            <span className="text-sm md:text-base font-bold text-on-surface mt-1 block">
              {sit?.signals?.average_speed || '46.5 km/h'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15">
            <span className="text-[10px] text-on-surface-variant font-medium block">311 Complaints</span>
            <span className="text-sm md:text-base font-bold text-secondary mt-1 block">
              {sit?.signals?.civic_reports || '0 reports'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15 col-span-2 md:col-span-1">
            <span className="text-[10px] text-on-surface-variant font-medium block">ML Nowcast Risk</span>
            <span className="text-sm md:text-base font-bold text-tertiary mt-1 block">
              {sit?.nowcast?.risk_level || 'LOW'} ({sit?.nowcast?.risk_probability || 10}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant italic pt-1">
          <span className="material-symbols-outlined text-[14px] text-primary">info</span>
          <span>{sit?.disclaimer || 'Correlation detected; causation is not established.'}</span>
        </div>
      </div>

      {/* 3. Four Simulated Tactical Response Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h2 className="text-base md:text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">smart_toy</span>
            <span>Simulated Tactical Response Actions</span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Decision-support sandbox actions. Select an action below to evaluate projected impact without affecting live systems.
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-on-surface-variant bg-surface-container border border-outline-variant/20 self-start sm:self-auto">
          Sandbox Simulation Mode
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Action 1: Broadcast Civic Alert */}
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">campaign</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">1. Broadcast Civic Advisory</h3>
                <span className="text-[11px] text-on-surface-variant">Public Warning & Variable Message Signs (Simulated)</span>
              </div>
            </div>
            <p className="text-xs text-on-surface leading-relaxed">
              Dispatches automated warnings across citizen mobile notification channels and variable message signboards (VMS) on Outer Ring Road to advise commuters to avoid underpass flooding corridors.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleExecuteAction('broadcast_alert')}
            disabled={actionLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>Simulate Broadcast Dispatch</span>
          </button>
        </div>

        {/* Action 2: Monitor Nearby Corridors */}
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">radar</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">2. Monitor Nearby Zones</h3>
                <span className="text-[11px] text-on-surface-variant">Dynamic Haversine Distance Watch (&lt; 5 km)</span>
              </div>
            </div>
            <p className="text-xs text-on-surface leading-relaxed">
              Places adjacent corridors within 5 km on high-frequency 60-second surveillance to track arterial queue propagation and identify safe diversion channels.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleExecuteAction('monitor_nearby')}
            disabled={actionLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-tertiary">visibility</span>
            <span>Simulate Nearby Corridor Watch</span>
          </button>
        </div>

        {/* Action 3: Review Evidence */}
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">3. Review Evidence Dossier</h3>
                <span className="text-[11px] text-on-surface-variant">Multi-Source Cross-Stream Corroboration</span>
              </div>
            </div>
            <p className="text-xs text-on-surface leading-relaxed">
              Inspect independent radar precipitation rates, inductive loop velocity deceleration, and citizen 311 flood grievances corroborating this incident.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExecuteAction('review_evidence')}
              disabled={actionLoading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
              <span>Compile Audit</span>
            </button>
            <button
              type="button"
              onClick={onOpenWhy}
              className="py-2.5 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold text-xs border border-primary/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Why Panel</span>
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            </button>
          </div>
        </div>

        {/* Action 4: Simulate Traffic Reroute (-20% Congestion) */}
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">alt_route</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">4. Simulate Traffic Reroute</h3>
                <span className="text-[11px] text-on-surface-variant">-20% Congestion Evaluated via ML</span>
              </div>
            </div>
            <p className="text-xs text-on-surface leading-relaxed">
              Simulates diverting 20% arterial volume via adjacent corridors. Uses the trained HistGradientBoosting model to calculate the exact predicted disruption probability delta.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExecuteAction('simulate_reroute')}
              disabled={actionLoading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Simulate -20% Reroute</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('simulate')}
              className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
              title="Open full interactive scenario in What-If Simulator"
            >
              <span>What-If</span>
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Traffic Reroute Impact Analysis Card (Before vs. After Delta) */}
      {reroute && (
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/15 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">compare_arrows</span>
                <h3 className="text-base md:text-lg font-bold text-on-surface">
                  Simulated Traffic Reroute Impact Analysis
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Evaluates predicted disruption probability delta when 20% vehicular volume is diverted.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-tertiary/10 text-tertiary border border-tertiary/20 self-start sm:self-auto">
              ML Model Evaluated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Before Reroute */}
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-error uppercase tracking-wider">
                Current Condition (Baseline)
              </span>
              <div className="space-y-1.5 mt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Congestion:</span>
                  <span className="font-bold text-on-surface font-mono">{reroute.baseline_congestion}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Velocity:</span>
                  <span className="font-bold text-on-surface font-mono">{sit?.signals?.average_speed || '4.2 km/h'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">ML Risk Probability:</span>
                  <span className="font-bold text-error font-mono">{reroute.baseline_probability_pct}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Risk Level:</span>
                  <span className="font-bold text-error">{reroute.baseline_risk_level}</span>
                </div>
              </div>
            </div>

            {/* Simulated Reroute Impact */}
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider">
                Post-Reroute Simulation (-20%)
              </span>
              <div className="space-y-1.5 mt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Congestion:</span>
                  <span className="font-bold text-tertiary font-mono">{reroute.rerouted_congestion}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Estimated Velocity:</span>
                  <span className="font-bold text-tertiary font-mono">{reroute.estimated_speed_kmh} km/h</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">ML Risk Probability:</span>
                  <span className="font-bold text-tertiary font-mono">{reroute.rerouted_probability_pct}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Risk Level:</span>
                  <span className="font-bold text-tertiary">{reroute.rerouted_risk_level}</span>
                </div>
              </div>
            </div>

            {/* Calculated Risk Delta */}
            <div className="p-4 rounded-xl bg-tertiary/10 border border-tertiary/30 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider block">
                  Probability Drop (Delta)
                </span>
                <span className="text-3xl font-black text-tertiary font-mono block mt-1">
                  {reroute.probability_delta_pct}%
                </span>
                <span className="text-xs text-on-surface mt-1 block">
                  Reduction in compound disruption risk probability.
                </span>
              </div>
              <span className="text-[11px] text-tertiary/90 font-medium block mt-3 pt-2 border-t border-tertiary/20">
                Recommended: Divert traffic via Saket (1.4 km) and South Extension (4.1 km).
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container/60 border border-outline-variant/15 text-xs text-on-surface leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong>Decision Guidance: </strong> {reroute.synthesis}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('simulate')}
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all shrink-0 cursor-pointer flex items-center gap-1 self-start sm:self-center"
            >
              <span>Explore in What-If</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Nearby Corridors Dynamic Distance Table */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">near_me</span>
            <h3 className="text-base md:text-lg font-bold text-on-surface">
              Adjacent Corridor Diversion Viability
            </h3>
          </div>
          <span className="text-xs text-on-surface-variant">
            Origin: Malviya Nagar Hotspot
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-outline-variant/20 text-on-surface-variant">
                <th className="py-2.5 px-3 font-semibold">Corridor Name</th>
                <th className="py-2.5 px-3 font-semibold">Distance (Haversine)</th>
                <th className="py-2.5 px-3 font-semibold">Current Flow</th>
                <th className="py-2.5 px-3 font-semibold">Speed</th>
                <th className="py-2.5 px-3 font-semibold">Risk Level</th>
                <th className="py-2.5 px-3 font-semibold">Diversion Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {corridors.map((c, idx) => (
                <tr key={idx} className="hover:bg-surface-container transition-colors">
                  <td className="py-3 px-3 font-bold">{c.name}</td>
                  <td className="py-3 px-3 font-mono text-primary font-semibold">{c.distance_km} km</td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-semibold ${
                        c.congestion >= 70 ? 'text-error' : c.congestion >= 45 ? 'text-amber-500' : 'text-tertiary'
                      }`}
                    >
                      {c.congestion}% ({c.status})
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">{c.speed_kmh} km/h</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.risk_level === 'HIGH'
                          ? 'bg-error/10 text-error'
                          : c.risk_level === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-tertiary/10 text-tertiary'
                      }`}
                    >
                      {c.risk_level}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                        c.recommendation.includes('Viable')
                          ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant/20'
                      }`}
                    >
                      {c.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Action History Audit Trail */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            <h3 className="text-base md:text-lg font-bold text-on-surface">Response Audit Trail</h3>
          </div>
          <span className="text-xs text-on-surface-variant">Session Action History</span>
        </div>

        <div className="space-y-2.5">
          {actionHistory.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                  task_alt
                </span>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">{item.action_name}</h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                    {item.details}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary/10 text-tertiary border border-tertiary/20">
                  {item.status}
                </span>
                <span className="text-[10px] font-mono text-on-surface-variant">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
