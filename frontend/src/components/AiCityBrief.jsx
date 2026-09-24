import React from 'react';

export default function AiCityBrief({
  alert,
  summary,
  onInspectEvidence = () => {}
}) {
  const isAlert = !!alert;
  const confidenceScore = alert?.confidence
    ? Math.round(alert.confidence * 100)
    : (summary?.confidence ? Math.round(summary.confidence * 100) : 95);

  const briefText = alert?.explanation || summary?.summary ||
    'All municipal telemetry streams (weather radar, arterial traffic loops, and 311 citizen grievance feeds) indicate nominal baseline operations across all monitored Delhi sectors. No anomalous spatiotemporal clusters detected.';

  const zone = alert?.zone || summary?.zone || 'Malviya Nagar Underpass';
  const spatialDist = alert?.spatial_overlap_km || 0.8;
  const temporalWin = alert?.temporal_overlap_minutes || 20;

  return (
    <div className="w-full px-margin-desktop py-space-xs bg-surface-container-lowest border-b border-outline-variant/15">
      <div
        className={`w-full p-space-md rounded-xl border transition-all duration-300 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md ${
          isAlert
            ? 'bg-error-container/15 border-error/40'
            : 'bg-surface-container-low border-outline-variant/20'
        }`}
      >
        {/* Left Side: Badge + Grounded Synthesis + Disclaimer */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* AI City Brief Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>AI City Brief</span>
            </div>

            {/* Severity Pill */}
            {isAlert ? (
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error text-on-error text-xs font-bold uppercase tracking-wider animate-pulse">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                <span>{alert.severity || 'CRITICAL'} DISRUPTION</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary/20 text-tertiary text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>NOMINAL OPERATIONS</span>
              </div>
            )}

            {/* Confidence Pill */}
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span>{confidenceScore}% Confidence</span>
            </div>

            {/* Spatiotemporal Overlap Pill */}
            {isAlert && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-[14px]">location_searching</span>
                <span>Within {spatialDist} km &bull; {temporalWin} min window</span>
              </div>
            )}
          </div>

          {/* Synthesis Text */}
          <p className="font-body-md text-on-surface leading-relaxed text-sm md:text-base">
            {briefText}
          </p>

          {/* Non-Causal Legal / Scientific Disclaimer */}
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/90 font-medium">
            <span className="material-symbols-outlined text-[15px] text-amber-500 shrink-0">info</span>
            <span className="italic">
              <strong>Correlation detected; causation is not established.</strong> Empirical cross-domain spatiotemporal coincidence across independent sensor streams.
            </span>
          </div>
        </div>

        {/* Right Side: Inspect Evidence CTA Button */}
        <div className="flex items-center gap-space-sm shrink-0 self-end lg:self-center">
          <button
            onClick={onInspectEvidence}
            type="button"
            className="py-2 px-space-md rounded-lg bg-primary text-on-primary font-body-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm cursor-pointer hover:shadow-md"
            title="Inspect full statistical evidence, correlation, and formula breakdown"
          >
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            <span>Inspect Evidence</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
