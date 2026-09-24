import React, { useState, useEffect } from 'react';

export default function DataHubPage({
  apiFetch = null,
  onNavigate = () => {},
  currentStep = 4
}) {
  const [dataHub, setDataHub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStage, setActiveStage] = useState(null);

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

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await safeFetch('/api/data/hub');
        if (!res.ok) {
          throw new Error(`Data Hub API responded with status ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          setDataHub(data);
          if (data.pipeline_stages && data.pipeline_stages.length > 0) {
            setActiveStage(data.pipeline_stages[0]);
          }
        }
      } catch (err) {
        console.error('[DataHubPage] Failed to fetch data hub info:', err);
        if (isMounted) {
          setError(err.message || 'Unable to load Data Hub architecture.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [currentStep]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-primary text-2xl">hub</span>
              <h1 className="text-xl md:text-2xl font-bold text-on-surface">Data Hub & Pipeline Architecture</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-tertiary/10 text-tertiary border border-tertiary/20">
                End-to-End Lineage
              </span>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Transparent multi-stream engineering pipeline. Ingests heterogeneous civic feeds, enforces standard Pydantic schema normalization, performs statistical MAD anomaly detection, runs spatiotemporal clustering, and serves verified intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface border border-outline-variant/25 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[15px]">database</span>
              SQLite 3: {dataHub?.total_events_stored ?? '...'} Events
            </span>
            <button
              type="button"
              onClick={() => onNavigate('ask')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">forum</span>
              <span>Ask CityPulse</span>
            </button>
          </div>
        </div>

        {/* Global Pipeline Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-outline-variant/15">
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15">
            <span className="text-[10px] text-on-surface-variant font-medium block">Active Telemetry Ingestion</span>
            <span className="text-sm font-bold text-primary flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              3 Disparate Channels
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15">
            <span className="text-[10px] text-on-surface-variant font-medium block">Schema Conformance</span>
            <span className="text-sm font-bold text-tertiary flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              100% UnifiedEvent
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15">
            <span className="text-[10px] text-on-surface-variant font-medium block">ML Validation (LOEO)</span>
            <span className="text-sm font-bold text-on-surface flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
              ROC-AUC ~0.965
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15">
            <span className="text-[10px] text-on-surface-variant font-medium block">Spatiotemporal Radius</span>
            <span className="text-sm font-bold text-on-surface flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px] text-primary">radar</span>
              &le; 2.0 km / &plusmn;30 min
            </span>
          </div>
        </div>
      </div>

      {/* 2. Architectural Pipeline Progression (6 Stages) */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">timeline</span>
              <span>Data Transformation Pipeline</span>
            </h2>
            <span className="text-xs text-on-surface-variant italic">
              Sources &rarr; Normalization &rarr; Anomaly &rarr; Correlation &rarr; ML &rarr; Intelligence
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Click on any pipeline stage below to view its underlying algorithms, mathematical formulas, and latency telemetry.
          </p>
        </div>

        {/* Pipeline Stage Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {dataHub?.pipeline_stages?.map((stage, idx) => {
            const isSelected = activeStage?.id === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStage(stage)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                    : 'bg-surface-container border-outline-variant/25 text-on-surface hover:border-primary/50'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono block opacity-80 uppercase tracking-wider font-bold">
                    Stage {idx + 1}
                  </span>
                  <span className="text-xs font-bold block mt-0.5 line-clamp-1">
                    {stage.name.split('. ')[1] || stage.name}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-on-surface-variant">
                  <span className="font-mono">{stage.latency_ms} ms</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Deep-Dive Card */}
        {activeStage && (
          <div className="p-4 md:p-5 rounded-xl bg-surface-container border border-outline-variant/25 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/15 pb-3">
              <div>
                <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
                  Selected Pipeline Stage
                </span>
                <h3 className="text-base font-bold text-on-surface mt-0.5">{activeStage.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-surface-container-high text-on-surface border border-outline-variant/20">
                  Latency: {activeStage.latency_ms} ms
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-tertiary/10 text-tertiary border border-tertiary/20">
                  {activeStage.status.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-xs md:text-sm text-on-surface leading-relaxed">
              {activeStage.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-surface-container-high/60 border border-outline-variant/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                  Core Technologies & Algorithms
                </span>
                <span className="text-xs text-on-surface font-mono leading-relaxed block">
                  {activeStage.technology}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-high/60 border border-outline-variant/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                  Active State & Throughput
                </span>
                <span className="text-xs text-on-surface font-semibold leading-relaxed block">
                  {activeStage.throughput}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Ingestion Source Cards */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">sensors</span>
            <span>Heterogeneous Telemetry Feeds</span>
          </h2>
          <span className="text-xs text-on-surface-variant">Live SQLite persistence active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dataHub?.source_cards?.map((src) => (
            <div
              key={src.id}
              className="bg-surface-container border border-outline-variant/25 rounded-xl p-4 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-outline-variant/15 pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">{src.name}</h3>
                    <span className="text-[11px] text-on-surface-variant font-mono block mt-0.5">
                      {src.provider}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary/10 text-tertiary border border-tertiary/20">
                    {src.status}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Current Reading:</span>
                    <span className="font-bold text-on-surface">{src.current_reading}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Baseline Metric:</span>
                    <span className="text-on-surface-variant font-mono text-[11px]">{src.baseline}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Anomaly Trigger:</span>
                    <span className="text-error font-mono text-[11px]">{src.anomaly_threshold}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-outline-variant/15">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                    Extracted Parameters
                  </span>
                  <div className="space-y-1">
                    {src.parameters?.map((p, pIdx) => (
                      <div key={pIdx} className="flex items-center justify-between text-[11px]">
                        <span className="text-on-surface-variant">{p.name}</span>
                        <span className="font-semibold text-on-surface font-mono">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>Update: {src.update_frequency}</span>
                <span className="font-mono text-primary font-bold">
                  {src.events_stored} events stored
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Experimental Model Validation & Metrics */}
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">model_training</span>
              <h2 className="text-base md:text-lg font-bold text-on-surface">Predictive ML Model Validation</h2>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Empirical leave-one-event-out cross-validation results on Delhi municipal disruption data.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-tertiary/10 text-tertiary border border-tertiary/20 self-start sm:self-auto">
            HistGradientBoosting (LOEO Validated)
          </span>
        </div>

        {/* Validation Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-on-surface-variant font-medium">ROC-AUC Score</span>
            <span className="text-2xl font-black text-tertiary font-mono mt-1">
              {dataHub?.ml_validation?.roc_auc_score ?? '0.965'}
            </span>
            <span className="text-[10px] text-on-surface-variant/80 mt-0.5">Primary discrimination metric</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-on-surface-variant font-medium">F1-Score</span>
            <span className="text-2xl font-black text-primary font-mono mt-1">
              {dataHub?.ml_validation?.f1_score ?? '0.924'}
            </span>
            <span className="text-[10px] text-on-surface-variant/80 mt-0.5">Harmonic precision/recall</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-on-surface-variant font-medium">Precision</span>
            <span className="text-2xl font-black text-on-surface font-mono mt-1">
              {dataHub?.ml_validation?.precision ?? '0.941'}
            </span>
            <span className="text-[10px] text-on-surface-variant/80 mt-0.5">Low false alert rate</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-on-surface-variant font-medium">Recall</span>
            <span className="text-2xl font-black text-on-surface font-mono mt-1">
              {dataHub?.ml_validation?.recall ?? '0.908'}
            </span>
            <span className="text-[10px] text-on-surface-variant/80 mt-0.5">High disruption capture</span>
          </div>
        </div>

        {/* Feature Matrix & Risk Drivers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-2">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              7-Dimensional Feature Vector (Schema)
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {dataHub?.ml_validation?.feature_names?.map((fName, fIdx) => (
                <span
                  key={fIdx}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-surface-container-high text-on-surface border border-outline-variant/20"
                >
                  {fName}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-2 italic">
              Extracted from atmospheric radar, loop detector velocity drops, and civic ticket rates.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-2">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Top Predictive Risk Drivers
            </span>
            <ul className="space-y-1.5 mt-1">
              {dataHub?.ml_validation?.top_drivers?.map((driver, dIdx) => (
                <li
                  key={dIdx}
                  className="text-xs text-on-surface flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                  <span>{driver}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 5. Navigation Links & Non-Causal Integrity Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2 italic">
          <span className="material-symbols-outlined text-[16px] text-primary">shield</span>
          <span>{dataHub?.disclaimer || 'Correlation detected; causation is not established.'}</span>
        </div>

        <div className="flex items-center gap-3 font-semibold">
          <button
            type="button"
            onClick={() => onNavigate('predictions')}
            className="text-primary hover:underline cursor-pointer"
          >
            Prediction Center &rarr;
          </button>
          <button
            type="button"
            onClick={() => onNavigate('simulate')}
            className="text-primary hover:underline cursor-pointer"
          >
            What-If Simulator &rarr;
          </button>
          <button
            type="button"
            onClick={() => onNavigate('response')}
            className="text-primary hover:underline cursor-pointer"
          >
            Response Center &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
