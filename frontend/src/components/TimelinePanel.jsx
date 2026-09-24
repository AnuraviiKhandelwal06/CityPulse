import React from 'react';

export default function TimelinePanel({
  events = [],
  currentStep = 4,
  onStepBack = () => {},
  onStepForward = () => {}
}) {
  const defaultEvents = [
    {
      time: '00:00',
      title: 'Baseline Normal',
      desc: 'Normal flow, clear weather',
      color: 'bg-tertiary',
      textColor: 'text-tertiary',
      isAlert: false,
    },
    {
      time: '05:00',
      title: 'Rain Spike Detected',
      desc: 'Rain rate jumps to 78 mm/h',
      color: 'bg-primary',
      textColor: 'text-primary',
      isAlert: false,
    },
    {
      time: '10:00',
      title: 'Traffic Slows Down',
      desc: 'Vehicular speed drops below 15 km/h',
      color: 'bg-primary',
      textColor: 'text-primary',
      isAlert: false,
    },
    {
      time: '15:00',
      title: 'Waterlogging Reported',
      desc: '14 citizen 311 calls logged',
      color: 'bg-secondary',
      textColor: 'text-secondary',
      isAlert: false,
    },
    {
      time: '20:00',
      title: 'Critical Alert Triggered',
      desc: 'Disruption confirmed across all 3 feeds',
      color: 'bg-error',
      textColor: 'text-error',
      isAlert: true,
    },
  ];

  const timelineList = events.length > 0 ? events : defaultEvents;

  return (
    <div className="bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">timeline</span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Timeline of Events</h2>
        </div>
        <span className="font-body-sm text-body-sm text-on-surface-variant">Last 25 min</span>
      </div>

      <div className="flex flex-col gap-space-sm relative pl-4">
        <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-surface-container-high"></div>

        {timelineList.map((item, idx) => (
          <div key={idx} className="relative flex items-start gap-space-sm">
            <div className={`w-3 h-3 rounded-full ${item.color || 'bg-primary'} absolute -left-4 top-1 shadow-sm`}></div>
            <div className={`flex flex-col flex-1 ${item.isAlert ? 'bg-error-container/20 p-space-sm rounded-lg border border-error/20' : ''}`}>
              <div className="flex items-center gap-2">
                <span className={`font-body-sm text-body-sm font-bold ${item.textColor || 'text-primary'}`}>
                  {item.time}
                </span>
                <span className={`font-body-sm text-body-sm font-semibold ${item.isAlert ? 'text-error' : 'text-on-surface'}`}>
                  {item.title}
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {item.desc}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-space-xs pt-1">
        <button
          className="flex-1 py-2 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          type="button"
          onClick={onStepBack}
        >
          <span className="material-symbols-outlined text-[16px] text-primary">skip_previous</span>
          <span>Step -5m</span>
        </button>
        <button
          className="flex-1 py-2 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          type="button"
          onClick={onStepForward}
        >
          <span className="material-symbols-outlined text-[16px] text-primary">skip_next</span>
          <span>Step +5m</span>
        </button>
      </div>
    </div>
  );
}
