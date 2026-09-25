import React, { useState } from 'react';

export default function SignalsPanel({ vitals }) {
  const [expandedCard, setExpandedCard] = useState(null);

  const metrics = vitals || {
    rainfall: {
      value: 82.5,
      unit: 'mm/h',
      delta: '(Cloudburst surge)',
      baseline: '5.0 mm/h seasonal normal',
      status: 'Heavy rainfall',
      level: 'primary',
    },
    traffic: {
      value: 88,
      unit: '%',
      delta: '+46% vs baseline',
      baseline: 'Normal average: 42%',
      status: 'Severe congestion',
      level: 'error',
    },
    civicReports: {
      value: 19,
      unit: 'reports',
      delta: '(12.7x surge)',
      baseline: '1.5 tickets/hr baseline',
      status: 'Waterlogging reports',
      level: 'secondary',
    },
    transitDelay: {
      value: 26,
      unit: 'min',
      delta: '+22m schedule lag',
      baseline: '4 min schedule buffer',
      status: 'Transit delay',
      level: 'tertiary',
    }
  };

  const cards = [
    {
      id: 'rainfall',
      icon: '🌧',
      title: 'Heavy rainfall',
      value: `${metrics.rainfall?.value || 82.5} ${metrics.rainfall?.unit || 'mm/h'}`,
      status: metrics.rainfall?.status || 'Heavy precipitation',
      delta: metrics.rainfall?.delta || '(Cloudburst surge)',
      baseline: metrics.rainfall?.baseline || '5.0 mm/h standard baseline',
      color: 'border-primary/40',
      badge: 'bg-primary/15 text-primary',
      sensorSource: 'Open-Meteo Radar Grid (Station 104)'
    },
    {
      id: 'traffic',
      icon: '🚗',
      title: 'Severe congestion',
      value: `${metrics.traffic?.value || 88}${metrics.traffic?.unit || '%'}`,
      status: metrics.traffic?.status || 'Severe gridlock',
      delta: metrics.traffic?.delta || '+46% vs usual',
      baseline: metrics.traffic?.baseline || '42% normal speed baseline',
      color: 'border-error/40',
      badge: 'bg-error/15 text-error',
      sensorSource: 'Arterial Inductive Loop & GPS Telemetry'
    },
    {
      id: 'civic',
      icon: '💧',
      title: 'Waterlogging reports',
      value: `${metrics.civicReports?.value || 19} ${metrics.civicReports?.unit || 'reports'}`,
      status: metrics.civicReports?.status || 'Underpass flooding cluster',
      delta: metrics.civicReports?.delta || '(12.7x surge)',
      baseline: metrics.civicReports?.baseline || '1.5 tickets/hr baseline',
      color: 'border-secondary/40',
      badge: 'bg-secondary/15 text-secondary',
      sensorSource: 'Municipal 311 Grievance Feed (Cluster #912)'
    },
    {
      id: 'transit',
      icon: '🚌',
      title: 'Transit delay',
      value: `+${metrics.transitDelay?.value || 26} ${metrics.transitDelay?.unit || 'min'}`,
      status: metrics.transitDelay?.status || 'Corridor bottleneck',
      delta: metrics.transitDelay?.delta || 'delay vs schedule',
      baseline: metrics.transitDelay?.baseline || '4 min standard schedule buffer',
      color: 'border-amber-500/40',
      badge: 'bg-amber-500/15 text-amber-500',
      sensorSource: 'DTC Fleet Telematics & Yellow Line Feeder'
    }
  ];

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant font-mono">
            What's Happening
          </span>
          <span className="text-xs text-on-surface-variant/70 font-normal">
            (Live Sensor Signals)
          </span>
        </div>
        <span className="text-xs text-on-surface-variant font-medium">
          Click any card for sensor details
        </span>
      </div>

      {/* 4 Clean Signal Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((card) => {
          const isExpanded = expandedCard === card.id;
          return (
            <div
              key={card.id}
              onClick={() => toggleExpand(card.id)}
              className={`p-4 rounded-xl bg-surface-container-low border transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between gap-3 ${
                isExpanded
                  ? `${card.color} ring-1 ring-primary/30 bg-surface-container`
                  : 'border-outline-variant/25 hover:border-outline-variant/50'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl select-none">{card.icon}</span>
                  <span className="font-semibold text-xs text-on-surface-variant">
                    {card.title}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badge}`}>
                  Live
                </span>
              </div>

              {/* Metric Value */}
              <div>
                <span className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight font-headline-lg">
                  {card.value}
                </span>
                <span className="text-xs text-on-surface-variant block mt-0.5 font-medium">
                  {card.status}
                </span>
              </div>

              {/* Progressive Disclosure (Expanded baseline comparison) */}
              {isExpanded ? (
                <div className="pt-2.5 border-t border-outline-variant/20 flex flex-col gap-1 text-[11px] animate-fadeIn">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Baseline:</span>
                    <span className="font-medium text-on-surface">{card.baseline}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Delta:</span>
                    <span className="font-semibold text-primary">{card.delta}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Feed:</span>
                    <span className="truncate max-w-[150px] font-mono text-[10px]">{card.sensorSource}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant/60 pt-1 border-t border-outline-variant/10">
                  <span>{card.delta}</span>
                  <span className="material-symbols-outlined text-[14px]">expand_more</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
