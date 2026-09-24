import React from 'react';

export default function CityVitalsPanel({ vitals }) {
  // Default values matching mockup structure if not yet provided by API
  const metrics = vitals || {
    traffic: {
      value: 84,
      unit: '%',
      delta: '+42% vs usual',
      baseline: 'Normal avg: 42%',
      status: 'Severe congestion',
      level: 'error',
    },
    rainfall: {
      value: 78.4,
      unit: 'mm/h',
      delta: '(Heavy shower)',
      baseline: 'Weather Radar Station',
      status: 'Cloudburst surge',
      level: 'primary',
    },
    civicReports: {
      value: 19,
      unit: 'reports',
      delta: '(+120% spike)',
      baseline: 'Waterlogging issues',
      status: 'Verified cluster',
      level: 'secondary',
    },
    transitDelay: {
      value: 26,
      unit: 'min',
      delta: 'delay',
      baseline: 'Yellow Line Buses',
      status: 'Underpass bottleneck',
      level: 'tertiary',
    }
  };

  return (
    <div className="bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">vital_signs</span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">City Vitals</h2>
        </div>
        <span className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container px-space-sm py-0.5 rounded-full">
          Live updates
        </span>
      </div>

      <div className="flex flex-col gap-space-sm">
        {/* Traffic Congestion */}
        <div className="p-space-sm bg-surface-container rounded-lg flex flex-col gap-1 transition-all">
          <div className="flex justify-between items-baseline">
            <span className="text-body-sm text-on-surface-variant">Traffic Congestion</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-headline-sm text-headline-sm text-error font-bold">
                {metrics.traffic.value}{metrics.traffic.unit}
              </span>
              <span className="text-error font-body-sm font-medium">
                ({metrics.traffic.delta})
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-error rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.traffic.value)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-body-sm text-on-surface-variant">
            <span>{metrics.traffic.baseline}</span>
            <span className="text-error font-medium">{metrics.traffic.status}</span>
          </div>
        </div>

        {/* Rainfall Rate */}
        <div className="p-space-sm bg-surface-container rounded-lg flex flex-col gap-1 transition-all">
          <div className="flex justify-between items-baseline">
            <span className="text-body-sm text-on-surface-variant">Rainfall Rate</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                {metrics.rainfall.value} {metrics.rainfall.unit}
              </span>
              <span className="text-primary font-body-sm font-medium">
                {metrics.rainfall.delta}
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (metrics.rainfall.value / 100) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-body-sm text-on-surface-variant">
            <span>{metrics.rainfall.baseline}</span>
            <span className="text-primary font-medium">{metrics.rainfall.status}</span>
          </div>
        </div>

        {/* Civic 311 Reports */}
        <div className="p-space-sm bg-surface-container rounded-lg flex flex-col gap-1 transition-all">
          <div className="flex justify-between items-baseline">
            <span className="text-body-sm text-on-surface-variant">Civic 311 Reports</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                {metrics.civicReports.value} {metrics.civicReports.unit}
              </span>
              <span className="text-secondary font-body-sm font-medium">
                {metrics.civicReports.delta}
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (metrics.civicReports.value / 30) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-body-sm text-on-surface-variant">
            <span>{metrics.civicReports.baseline}</span>
            <span className="text-secondary font-medium">{metrics.civicReports.status}</span>
          </div>
        </div>

        {/* Transit Delay Variance */}
        <div className="p-space-sm bg-surface-container rounded-lg flex flex-col gap-1 transition-all">
          <div className="flex justify-between items-baseline">
            <span className="text-body-sm text-on-surface-variant">Transit Delay Variance</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-headline-sm text-headline-sm text-tertiary font-bold">
                +{metrics.transitDelay.value} {metrics.transitDelay.unit}
              </span>
              <span className="text-tertiary font-body-sm font-medium">
                {metrics.transitDelay.delta}
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-tertiary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (metrics.transitDelay.value / 50) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-body-sm text-on-surface-variant">
            <span>{metrics.transitDelay.baseline}</span>
            <span className="text-tertiary font-medium">{metrics.transitDelay.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
