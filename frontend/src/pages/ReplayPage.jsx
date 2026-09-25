import React from 'react';
import TimelineReplaySection from '../components/TimelineReplaySection';

export default function ReplayPage({
  isSimulating = false,
  replayPlaying = false,
  replayElapsed = 20,
  replaySpeed = 1.0,
  onTogglePlay = () => {},
  onSpeedChange = () => {},
  onSeek = () => {},
  onReset = () => {},
  onStepTimeline = () => {},
  vitals = null,
  currentAlert = null,
  prediction = null,
  timeline = []
}) {
  const currentStep = Math.min(4, Math.max(0, Math.round(replayElapsed / 5)));

  const scenarioStages = [
    {
      step: 0,
      time: '10:00 (T+0m)',
      title: 'Baseline Normal Operations',
      weather: '1.2 mm/h clear flow',
      traffic: '42% congestion • 46.5 km/h',
      civic: '0 active flood complaints',
      engine: 'Nominal baseline (No anomalies)',
      mlRisk: '0% (Low Risk)',
      icon: '🟢',
      badge: 'Nominal'
    },
    {
      step: 1,
      time: '10:05 (T+5m)',
      title: 'Cloudburst Rainfall Spikes',
      weather: '78.4 mm/h cloudburst surge',
      traffic: '48% congestion • 34.0 km/h',
      civic: '0 flood complaints',
      engine: 'Weather anomaly flagged (16.5x baseline)',
      mlRisk: '100% (High Risk)',
      icon: '🌧',
      badge: 'Weather Anomaly'
    },
    {
      step: 2,
      time: '10:10 (T+10m)',
      title: 'Traffic Velocity Collapses',
      weather: '82.5 mm/h sustained rain',
      traffic: '84% congestion • 8.5 km/h (Gridlock)',
      civic: '2 initial flood calls',
      engine: 'Traffic anomaly flagged (2.1x baseline)',
      mlRisk: '99% (High Risk)',
      icon: '🚗',
      badge: 'Traffic Anomaly'
    },
    {
      step: 3,
      time: '10:15 (T+15m)',
      title: 'Waterlogging Complaints Surge',
      weather: '82.5 mm/h heavy rain',
      traffic: '88% congestion • 4.2 km/h',
      civic: '14 citizen 311 flood calls',
      engine: 'Civic anomaly flagged (12.7x baseline)',
      mlRisk: '100% (High Risk)',
      icon: '💧',
      badge: 'Civic Grievance'
    },
    {
      step: 4,
      time: '10:20 (T+20m)',
      title: 'Critical Disruption Surfaced',
      weather: '82.5 mm/h extreme rain',
      traffic: '88% congestion • 4.2 km/h',
      civic: '19 citizen flood calls',
      engine: 'CRITICAL ALERT (0.8 km & 20 min overlap)',
      mlRisk: '100% (High Risk)',
      icon: '🔴',
      badge: 'Critical Disruption'
    },
  ];

  const currentStage = scenarioStages[currentStep] || scenarioStages[4];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">replay</span>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-headline-lg text-on-surface">
              Simulation Replay &amp; Event History
            </h1>
            <p className="text-xs text-on-surface-variant font-medium">
              Time-travel inspection across the 5-stage municipal disruption scenario
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-on-surface-variant uppercase">Current Point:</span>
          <span className="px-3 py-1 rounded-xl bg-primary/15 text-primary font-mono font-bold text-xs">
            {currentStage.time}
          </span>
        </div>
      </div>

      {/* Main Scrubber Control Card */}
      <TimelineReplaySection
        isPlaying={isSimulating || replayPlaying}
        onTogglePlay={onTogglePlay}
        elapsedMinutes={replayElapsed}
        totalMinutes={30}
        speed={replaySpeed}
        onSpeedChange={onSpeedChange}
        onSeek={onSeek}
        onReset={onReset}
        onStepBack={() => onStepTimeline(-1)}
        onStepForward={() => onStepTimeline(1)}
        events={timeline}
      />

      {/* Current Replay Timestamp Telemetry Snapshot */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            <span className="text-xl select-none">{currentStage.icon}</span>
            <div>
              <h2 className="text-base font-bold text-on-surface font-headline-sm">
                Active Replay State: {currentStage.title}
              </h2>
              <span className="text-xs text-on-surface-variant font-mono">Timestamp: {currentStage.time}</span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-container-high text-on-surface border border-outline-variant/20">
            {currentStage.badge}
          </span>
        </div>

        {/* 4 Multi-Stream Telemetry Cards at this Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
              <span>🌧</span>
              <span>Weather Doppler Radar</span>
            </div>
            <span className="text-lg font-bold text-primary font-mono">{currentStage.weather}</span>
            <span className="text-[10px] text-on-surface-variant">Station 104 Catchment</span>
          </div>

          <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
              <span>🚗</span>
              <span>Traffic Velocity &amp; Flow</span>
            </div>
            <span className="text-lg font-bold text-error font-mono">{currentStage.traffic}</span>
            <span className="text-[10px] text-on-surface-variant">Arterial Inductive Loops</span>
          </div>

          <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
              <span>💧</span>
              <span>Citizen 311 Inflow</span>
            </div>
            <span className="text-lg font-bold text-secondary font-mono">{currentStage.civic}</span>
            <span className="text-[10px] text-on-surface-variant">Municipal Dispatch Feed</span>
          </div>

          <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
              <span>🔮</span>
              <span>ML Predictive Nowcast</span>
            </div>
            <span className="text-lg font-bold text-on-surface font-mono">{currentStage.mlRisk}</span>
            <span className="text-[10px] text-on-surface-variant">HistGradientBoosting GBDT</span>
          </div>
        </div>
      </div>

      {/* 5-Stage Chronological Breakdown */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-4">
        <h3 className="font-bold text-base text-on-surface font-headline-sm">
          Complete 5-Stage Scenario Evolution (Click Any Step to Seek)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {scenarioStages.map((stage) => {
            const isCurrent = stage.step === currentStep;
            return (
              <div
                key={stage.step}
                onClick={() => onSeek(stage.step * 5)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isCurrent
                    ? 'bg-primary-container/30 border-primary ring-2 ring-primary/30 shadow-md scale-[1.02]'
                    : 'bg-surface-container border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-container-high'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl select-none">{stage.icon}</span>
                    <span className="text-[10px] font-mono font-bold text-primary">{stage.time.split(' ')[0]}</span>
                  </div>
                  <h4 className="font-bold text-xs text-on-surface leading-tight">
                    {stage.title}
                  </h4>
                </div>

                <div className="pt-2 border-t border-outline-variant/15 text-[10px] text-on-surface-variant flex flex-col gap-1">
                  <div><strong>Rain:</strong> {stage.weather.split(' ')[0]} {stage.weather.split(' ')[1]}</div>
                  <div><strong>Speed:</strong> {stage.traffic.split('•')[1] || stage.traffic}</div>
                  <div><strong>311:</strong> {stage.civic.split(' ')[0]} {stage.civic.split(' ')[1]}</div>
                </div>

                <div className="text-[10px] font-bold text-primary flex items-center justify-between pt-1 border-t border-outline-variant/10">
                  <span>{isCurrent ? '● Active Point' : 'Jump to Step'}</span>
                  <span>&rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
