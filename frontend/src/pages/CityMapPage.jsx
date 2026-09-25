import React, { useState } from 'react';
import Map from '../components/Map';

export default function CityMapPage({
  zones = [],
  currentAlert = null,
  incident = null,
  onOpenWhy = () => {}
}) {
  const [selectedZone, setSelectedZone] = useState(null);

  // Default active zone if none explicitly selected
  const activeZone = selectedZone || (zones.length > 0 ? zones[0] : {
    id: 'malviya-nagar',
    name: 'Malviya Nagar Hotspot',
    lat: 28.5355,
    lon: 77.2065,
    severity: 'CRITICAL',
    severity_score: 0.86,
    confidence: 0.92,
    summary: 'Severe Congestion 88% • Heavy Rain 82.5mm/h • 19 Flooding Reports',
    speed: '4.2 km/h',
    rain: '82.5 mm/h',
    reports: 19
  });

  const isCritical = activeZone.severity === 'CRITICAL' || activeZone.severity_score >= 0.8;
  const isMedium = activeZone.severity === 'MEDIUM' || (activeZone.severity_score >= 0.4 && activeZone.severity_score < 0.8);

  const badgeBg = isCritical
    ? 'bg-error text-on-error'
    : isMedium
      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
      : 'bg-tertiary/20 text-tertiary border border-tertiary/30';

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/25 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">map</span>
          </div>
          <div>
            <h1 className="text-xl font-bold font-headline-lg text-on-surface">City Situational Map</h1>
            <p className="text-xs text-on-surface-variant font-medium">
              Real-time multi-stream geographic fusion across monitored Delhi corridors
            </p>
          </div>
        </div>

        {/* Quick Zone Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-mono uppercase text-on-surface-variant mr-1">Hotspots:</span>
          {zones.map((z) => {
            const isSelected = activeZone.id === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setSelectedZone(z)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/20'
                }`}
              >
                {z.name?.split(' ')[0] || z.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map + Side Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Full-bleed Map View */}
        <div className="lg:col-span-8">
          <Map
            zones={zones}
            onSelectZone={(z) => setSelectedZone(z)}
          />
        </div>

        {/* Selected Zone Telemetry Inspector */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                Zone Telemetry Inspector
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${badgeBg}`}>
                {activeZone.severity || 'Normal'}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold font-headline-sm text-on-surface">
                {activeZone.name || activeZone.zone || 'Malviya Nagar Hotspot'}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {activeZone.summary || 'Correlated multi-source zone telemetry'}
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
                <span className="text-[10px] text-on-surface-variant uppercase font-mono">Speed</span>
                <span className="font-bold text-error text-sm">{activeZone.speed || '4.2 km/h'}</span>
              </div>
              <div className="p-2.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
                <span className="text-[10px] text-on-surface-variant uppercase font-mono">Rain</span>
                <span className="font-bold text-primary text-sm">{activeZone.rain || '82.5 mm/h'}</span>
              </div>
              <div className="p-2.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
                <span className="text-[10px] text-on-surface-variant uppercase font-mono">311 Calls</span>
                <span className="font-bold text-secondary text-sm">{activeZone.reports || 19}</span>
              </div>
            </div>

            {/* Decoupled Scoring */}
            <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/15 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Severity Score:</span>
                <span className="font-bold text-error">
                  {Math.round((activeZone.severity_score || 0.86) * 100)}% ({activeZone.severity || 'Critical'})
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-error rounded-full transition-all"
                  style={{ width: `${Math.round((activeZone.severity_score || 0.86) * 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="text-on-surface-variant">Confidence Rating:</span>
                <span className="font-bold text-primary">
                  {Math.round((activeZone.confidence || 0.92) * 100)}% (Multi-Stream)
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.round((activeZone.confidence || 0.92) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={onOpenWhy}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                <span>Inspect Evidence for this Zone</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => alert('Civil Defense Alert broadcast dispatched to local authorities.')}
                  className="py-2 px-2.5 rounded-xl bg-error/15 hover:bg-error/25 text-error text-xs font-semibold border border-error/25 transition-colors cursor-pointer text-center"
                >
                  Broadcast Alert
                </button>
                <button
                  type="button"
                  onClick={() => alert('Dynamic traffic signal pre-emption active on Malviya Outer Corridors.')}
                  className="py-2 px-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/25 transition-colors cursor-pointer text-center"
                >
                  Reroute Traffic
                </button>
              </div>
            </div>
          </div>

          {/* Spatial Bounds Card */}
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/25 shadow-sm text-xs flex flex-col gap-2 text-on-surface-variant">
            <span className="font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">radar</span>
              GIS Geo-Clustering Protocol
            </span>
            <p className="leading-relaxed text-[11px]">
              Zones evaluate spatial clustering via spherical Haversine distance (&le; 2.0 km radius threshold). Contributing events in Malviya Nagar cluster within 0.8 km of the underpass junction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
