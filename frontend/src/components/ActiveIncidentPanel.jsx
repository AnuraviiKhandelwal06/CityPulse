import React from 'react';

export default function ActiveIncidentPanel({
  incident,
  onOpenWhy = () => {},
  onBroadcast = () => {},
  onReroute = () => {}
}) {
  const data = incident || {
    zone: 'Malviya Nagar Underpass',
    sector: 'South Delhi Sector • Correlated multi-source disruption',
    alertType: 'Critical Alert',
    severityScore: 86,
    severityLabel: 'Critical',
    confidenceScore: 92,
    confidenceLabel: 'High',
    waterDepth: '18–24 cm at underpass',
    vehicleSpeed: '4.2 km/h (Gridlock)',
    citizenReports: '14 reports in 30 min'
  };

  return (
    <div className="bg-surface-container-low p-space-md rounded-xl border-2 border-error/40 shadow-lg flex flex-col gap-space-md relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
          <span className="font-body-sm text-body-sm font-bold text-error uppercase tracking-wider">
            Active Incident Spotlight
          </span>
        </div>
        <span className="font-body-sm text-body-sm px-space-xs py-0.5 rounded bg-error/20 text-error font-semibold">
          {data.alertType || 'Critical Alert'}
        </span>
      </div>

      <div>
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          {data.zone}
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {data.sector}
        </p>
      </div>

      {/* Two Separate Scores: Severity and Confidence */}
      <div className="grid grid-cols-2 gap-space-sm">
        <div className="bg-surface-container p-space-sm rounded-lg flex flex-col gap-1">
          <span className="font-body-sm text-body-sm text-on-surface-variant">Severity Score</span>
          <div className="flex items-baseline gap-1">
            <span className="font-headline-sm text-headline-sm text-error font-bold">
              {data.severityScore}%
            </span>
            <span className="text-error font-body-sm font-semibold">
              {data.severityLabel}
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-error rounded-full transition-all duration-500"
              style={{ width: `${data.severityScore}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-surface-container p-space-sm rounded-lg flex flex-col gap-1">
          <span className="font-body-sm text-body-sm text-on-surface-variant">Confidence</span>
          <div className="flex items-baseline gap-1">
            <span className="font-headline-sm text-headline-sm text-primary font-bold">
              {data.confidenceScore}%
            </span>
            <span className="text-primary font-body-sm font-semibold">
              {data.confidenceLabel}
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${data.confidenceScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Evidence Stats */}
      <div className="space-y-1.5 text-body-sm text-on-surface-variant bg-surface-container p-space-sm rounded-lg">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-on-surface">
            <span className="w-2 h-2 rounded-full bg-error"></span>
            Water Depth:
          </span>
          <span className="text-error font-semibold">{data.waterDepth}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-on-surface">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Vehicle Speed:
          </span>
          <span className="text-primary font-semibold">{data.vehicleSpeed}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-on-surface">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            Citizen Reports:
          </span>
          <span className="text-secondary font-semibold">{data.citizenReports}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-space-xs pt-1">
        <button
          className="w-full py-2.5 px-space-md rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-headline-sm text-body-md font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
          type="button"
          onClick={onOpenWhy}
        >
          <span>View 'Why?' Evidence Breakdown</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>

        <div className="grid grid-cols-2 gap-space-xs">
          <button
            className="py-1.5 px-space-sm rounded-lg bg-error/20 hover:bg-error/30 text-error font-body-sm font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
            type="button"
            onClick={onBroadcast}
          >
            <span className="material-symbols-outlined text-[16px]">campaign</span>
            <span>Broadcast Alert</span>
          </button>
          <button
            className="py-1.5 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
            type="button"
            onClick={onReroute}
          >
            <span className="material-symbols-outlined text-[16px]">alt_route</span>
            <span>Reroute Traffic</span>
          </button>
        </div>
      </div>
    </div>
  );
}
