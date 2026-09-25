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

  const isAiGenerated = Boolean(alert?.is_ai_generated || summary?.is_ai_generated);
  const statusMessage = alert?.ai_status_message || summary?.ai_status_message ||
    (!isAiGenerated ? "AI summary temporarily unavailable — showing evidence-based CityPulse summary." : null);

  const briefText = isAlert
    ? (alert?.explanation ||
      "Heavy rainfall is coinciding with severe traffic congestion and increased waterlogging reports around Malviya Nagar Underpass. The signals occurred within the same time and geographic window, indicating a potential multi-domain disruption.")
    : (summary?.summary ||
      "All municipal telemetry streams (weather radar, arterial traffic loops, and 311 citizen grievance feeds) indicate nominal baseline operations across all monitored Delhi sectors. No anomalous spatiotemporal clusters detected.");

  return (
    <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 h-full">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
              AI City Brief
            </span>
            {isAiGenerated ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono font-semibold">
                AI Generated
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono">
                Evidence Engine
              </span>
            )}
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface border border-outline-variant/20">
            {confidenceScore}% confidence
          </span>
        </div>

        {/* Fallback notification when LLM is unavailable */}
        {!isAiGenerated && statusMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-600 dark:text-amber-400">
            <span className="material-symbols-outlined text-[15px] shrink-0">info</span>
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Human explanation text */}
        <p className="text-sm text-on-surface leading-relaxed font-body-md">
          "{briefText}"
        </p>
      </div>

      {/* Footer with Disclaimer & CTA */}
      <div className="pt-2 border-t border-outline-variant/15 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant italic">
          <span className="material-symbols-outlined text-[14px] text-amber-500 shrink-0">info</span>
          <span>Correlation detected; causation is not established.</span>
        </div>
        <button
          type="button"
          onClick={onInspectEvidence}
          className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer self-start"
        >
          <span>View supporting evidence</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
