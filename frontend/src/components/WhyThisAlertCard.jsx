import React from 'react';

export default function WhyThisAlertCard({
  alert,
  onOpenWhy = () => {}
}) {
  const isAlert = !!alert;
  const spatialDist = alert?.spatial_overlap_km || 0.8;
  const temporalWin = alert?.temporal_overlap_minutes || 20;

  return (
    <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 h-full">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
              Why This Alert?
            </span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold uppercase tracking-wider">
            Correlated
          </span>
        </div>

        {/* Core reason summary */}
        <div>
          <h3 className="text-base font-bold text-on-surface">
            {isAlert ? 'Cross-Domain Spatiotemporal Correlation' : 'Nominal Baseline Coincidence'}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
            {isAlert ? (
              <>
                Independent sensor streams converged within <strong>{spatialDist} km</strong> and a <strong>{temporalWin}-minute</strong> window. Rainfall surge, corridor gridlock, and citizen flood grievances align simultaneously.
              </>
            ) : (
              'All monitored sensor feeds are operating within dry seasonal baselines. No anomalous cross-domain clusters detected.'
            )}
          </p>
        </div>

        {/* Convergence indicators */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-2 bg-surface-container rounded-lg border border-outline-variant/15 flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-mono">Spatial Bounds</span>
            <span className="font-bold text-on-surface">Within {spatialDist} km</span>
          </div>
          <div className="p-2 bg-surface-container rounded-lg border border-outline-variant/15 flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-mono">Temporal Window</span>
            <span className="font-bold text-on-surface">{temporalWin} min span</span>
          </div>
        </div>
      </div>

      {/* Button & Disclaimer */}
      <div className="pt-2 border-t border-outline-variant/15 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant italic">
          <span className="material-symbols-outlined text-[14px] text-amber-500 shrink-0">info</span>
          <span>Correlation detected; causation is not established.</span>
        </div>
        <button
          type="button"
          onClick={onOpenWhy}
          className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer self-start"
        >
          <span>View full evidence &amp; formulas</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
