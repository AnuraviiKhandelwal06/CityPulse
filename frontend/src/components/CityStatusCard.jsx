import React from 'react';

export default function CityStatusCard({
  alert,
  summary,
  incident,
  onOpenWhy = () => {},
  onBroadcast = () => {},
  onReroute = () => {}
}) {
  const isCritical = alert?.severity === 'CRITICAL' || incident?.severityLabel === 'Critical' || (incident?.severityScore >= 80);
  const isEmerging = alert?.severity === 'MEDIUM' || incident?.severityLabel === 'Moderate' || (incident?.severityScore >= 40 && incident?.severityScore < 80);

  const statusLabel = isCritical
    ? 'CRITICAL DISRUPTION'
    : isEmerging
      ? 'EMERGING ANOMALY'
      : 'ALL SYSTEMS NOMINAL';

  const statusColor = isCritical
    ? 'text-error'
    : isEmerging
      ? 'text-amber-500'
      : 'text-tertiary';

  const statusBadgeBg = isCritical
    ? 'bg-error text-on-error'
    : isEmerging
      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
      : 'bg-tertiary/20 text-tertiary border border-tertiary/30';

  const statusIcon = isCritical ? '🔴' : isEmerging ? '🟡' : '🟢';

  const zone = alert?.zone || incident?.zone || 'Malviya Nagar Underpass';
  
  const description = alert?.explanation || summary?.summary || incident?.sector ||
    (isCritical
      ? 'Heavy rainfall is coinciding with severe traffic congestion and rising waterlogging reports.'
      : 'All monitored corridors and telemetry feeds are operating within dry seasonal baselines.');

  const confidenceScore = alert?.confidence
    ? Math.round(alert.confidence * 100)
    : (incident?.confidenceScore || 95);

  const severityScore = alert?.severity_score
    ? Math.round(alert.severity_score * 100)
    : (incident?.severityScore || 86);

  return (
    <div
      className={`w-full p-5 rounded-2xl border transition-all duration-300 shadow-md ${
        isCritical
          ? 'bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border-error/50 shadow-error/10'
          : 'bg-surface-container-low border-outline-variant/30'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Information Stack */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* Top Label & Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
              City Status
            </span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadgeBg}`}>
              <span>{statusIcon}</span>
              <span>{statusLabel}</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>Confidence: {confidenceScore}%</span>
            </div>
            {isCritical && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container/30 text-error text-xs font-semibold border border-error/30">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
                <span>Severity: {severityScore}%</span>
              </div>
            )}
          </div>

          {/* Primary Location Headline */}
          <h1 className="text-xl md:text-2xl font-bold font-headline-lg text-on-surface tracking-tight">
            {zone}
          </h1>

          {/* Plain Human Explanation */}
          <p className="text-sm md:text-base text-on-surface-variant leading-relaxed max-w-4xl">
            {description}
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenWhy}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer hover:shadow-md"
            title="Inspect evidence breakdown and mathematical calculations"
          >
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            <span>Why is this happening?</span>
          </button>

          <button
            type="button"
            onClick={onBroadcast}
            className="px-3.5 py-2.5 rounded-xl bg-error/15 hover:bg-error/25 text-error font-semibold text-xs md:text-sm border border-error/30 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Broadcast emergency civil defense notice"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            <span className="hidden sm:inline">Broadcast Alert</span>
          </button>

          <button
            type="button"
            onClick={onReroute}
            className="px-3.5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-semibold text-xs md:text-sm border border-outline-variant/30 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Engage dynamic traffic signal pre-emption"
          >
            <span className="material-symbols-outlined text-[18px]">alt_route</span>
            <span className="hidden sm:inline">Reroute Traffic</span>
          </button>
        </div>
      </div>
    </div>
  );
}
