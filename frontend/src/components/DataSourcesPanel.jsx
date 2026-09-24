import React from 'react';

export default function DataSourcesPanel({ sources }) {
  const data = sources || [
    {
      id: 'weather',
      name: 'Weather API (Open-Meteo)',
      status: 'Connected',
      metricLabel: 'Precipitation Radar',
      metricValue: '78.4 mm/h shower',
      metricColor: 'text-primary',
      online: true,
    },
    {
      id: 'traffic',
      name: 'Traffic Sensors & Loops',
      status: 'Connected',
      metricLabel: 'Malviya Ring Corridor',
      metricValue: '4.2 km/h (Gridlock)',
      metricColor: 'text-error',
      online: true,
    },
    {
      id: 'incidents',
      name: 'Municipal 311 Reports',
      status: 'Connected',
      metricLabel: 'Public Grievance Inflow',
      metricValue: '14 active flood calls',
      metricColor: 'text-secondary',
      online: true,
    },
  ];

  const onlineCount = data.filter((s) => s.online).length;

  return (
    <div className="bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary text-[20px]">sensors</span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Live Data Sources</h2>
        </div>
        <span className="px-space-sm py-0.5 rounded-full bg-tertiary-container/30 text-tertiary font-body-sm font-bold">
          {onlineCount}/3 Online
        </span>
      </div>

      <div className="flex flex-col gap-space-xs">
        {data.map((source) => (
          <div
            key={source.id}
            className="bg-surface-container p-space-sm rounded-lg flex flex-col gap-1 transition-colors hover:bg-surface-container-high"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-[16px] ${source.online ? 'text-tertiary' : 'text-error'}`}>
                  {source.online ? 'check_circle' : 'cancel'}
                </span>
                <span className="font-body-sm text-body-sm font-bold text-on-surface">
                  {source.name}
                </span>
              </div>
              <span className={`font-body-sm font-semibold ${source.online ? 'text-tertiary' : 'text-error'}`}>
                {source.status}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-body-sm">
              <span className="text-on-surface-variant">{source.metricLabel}</span>
              <span className={`font-bold ${source.metricColor || 'text-on-surface'}`}>
                {source.metricValue}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
