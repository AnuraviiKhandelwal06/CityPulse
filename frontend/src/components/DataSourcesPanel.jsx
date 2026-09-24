import React, { useState } from 'react';

export default function DataSourcesPanel({ sources, onOpenDataHub = () => {} }) {
  const [expandedId, setExpandedId] = useState(null);

  const defaultSources = [
    {
      id: 'weather',
      shortName: 'Weather',
      fullName: 'Open-Meteo Cloudburst Doppler Grid',
      status: 'Connected',
      metricLabel: 'Precipitation Rate',
      metricValue: '82.5 mm/h',
      updateFreq: 'Every 60s',
      latency: '24ms',
      telemetry: 'Station 104 • Precipitation, Wind, Radar Reflectivity',
      online: true,
    },
    {
      id: 'traffic',
      shortName: 'Traffic',
      fullName: 'Arterial Inductive Loops & TomTom Feed',
      status: 'Connected',
      metricLabel: 'Corridor Congestion',
      metricValue: '88% (4.2 km/h)',
      updateFreq: 'Every 30s',
      latency: '18ms',
      telemetry: 'Malviya Outer Ring Corridors • 16 Active Loop Sensors',
      online: true,
    },
    {
      id: 'civic',
      shortName: 'Civic Reports',
      fullName: 'Municipal 311 Grievance Dispatch Feed',
      status: 'Connected',
      metricLabel: 'Grievance Volume',
      metricValue: '19 active calls',
      updateFreq: 'Live stream',
      latency: '42ms',
      telemetry: 'Verified Geo-tagged citizen reports • Category: Waterlogging',
      online: true,
    },
  ];

  const data = sources && sources.length > 0 ? sources.map(s => {
    const match = defaultSources.find(d => d.id === s.id);
    return {
      ...match,
      ...s,
      shortName: match?.shortName || s.name,
      fullName: s.name || match?.fullName,
      metricValue: s.metricValue || match?.metricValue
    };
  }) : defaultSources;

  const onlineCount = data.filter((s) => s.online).length;

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">sensors</span>
          <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant font-mono">
            Data Sources
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary/15 text-tertiary text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            <span>{onlineCount}/3 Online</span>
          </div>
          <button
            type="button"
            onClick={onOpenDataHub}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Explore Data Hub</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* 3 Simplified Horizontal Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.map((source) => {
          const isExpanded = expandedId === source.id;
          return (
            <div
              key={source.id}
              onClick={() => toggleExpand(source.id)}
              className={`p-3.5 rounded-xl bg-surface-container border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
                isExpanded
                  ? 'border-primary/40 bg-surface-container-high ring-1 ring-primary/20'
                  : 'border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-container-high'
              }`}
            >
              {/* Default Simplified Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm select-none">🟢</span>
                  <span className="font-bold text-xs md:text-sm text-on-surface">
                    {source.shortName}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-tertiary font-semibold">
                  <span>{source.status}</span>
                  <span className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>
              </div>

              {/* Summary Value */}
              <div className="flex items-baseline justify-between text-xs text-on-surface-variant">
                <span>{source.metricLabel || 'Signal'}:</span>
                <span className="font-mono font-bold text-on-surface">{source.metricValue}</span>
              </div>

              {/* Progressive Disclosure (Telemetry details when clicked) */}
              {isExpanded && (
                <div className="pt-2.5 mt-1 border-t border-outline-variant/20 flex flex-col gap-1.5 text-[11px] animate-fadeIn">
                  <div className="text-on-surface-variant font-medium">
                    {source.fullName}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-on-surface-variant">
                    <div className="bg-surface-container-lowest p-1 rounded">
                      <span className="block text-on-surface-variant/70">Frequency</span>
                      <span className="font-mono font-bold text-on-surface">{source.updateFreq || '30s'}</span>
                    </div>
                    <div className="bg-surface-container-lowest p-1 rounded">
                      <span className="block text-on-surface-variant/70">Latency</span>
                      <span className="font-mono font-bold text-tertiary">{source.latency || '22ms'}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-on-surface-variant/80 italic pt-0.5">
                    {source.telemetry}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
