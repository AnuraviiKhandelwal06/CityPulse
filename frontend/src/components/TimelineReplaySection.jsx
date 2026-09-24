import React from 'react';

export default function TimelineReplaySection({
  isPlaying = false,
  onTogglePlay = () => {},
  elapsedMinutes = 20,
  totalMinutes = 30,
  speed = 1.0,
  onSpeedChange = () => {},
  onSeek = () => {},
  onReset = () => {},
  onStepBack = () => {},
  onStepForward = () => {},
  events = []
}) {
  const currentStep = Math.min(4, Math.max(0, Math.round(elapsedMinutes / 5)));

  const defaultMilestones = [
    { step: 0, time: '10:00', title: 'Normal baseline', icon: '🟢', desc: 'Arterial flow normal, dry roads' },
    { step: 1, time: '10:05', title: 'Rain increased', icon: '🌧', desc: 'Precipitation surge to 78.4 mm/h' },
    { step: 2, time: '10:10', title: 'Traffic slowed', icon: '🚗', desc: 'Corridor speed drops to 8.5 km/h' },
    { step: 3, time: '10:15', title: 'Waterlogging reported', icon: '💧', desc: '14 citizen 311 flood calls filed' },
    { step: 4, time: '10:20', title: 'Disruption detected', icon: '🔴', desc: 'Cross-domain critical alert triggered' }
  ];

  const milestones = defaultMilestones;
  const percent = Math.min(100, Math.max(0, (elapsedMinutes / totalMinutes) * 100));

  const handleSliderChange = (e) => {
    const newPercent = parseFloat(e.target.value);
    const newElapsed = Math.round((newPercent / 100) * totalMinutes);
    onSeek(newElapsed);
  };

  const handleSpeedCycle = () => {
    const speeds = [1.0, 2.0, 4.0, 0.5];
    const currentIndex = speeds.indexOf(speed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    onSpeedChange(nextSpeed);
  };

  return (
    <div className="w-full bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-outline-variant/15">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">history</span>
          <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant font-mono">
            Timeline &amp; Simulation Replay
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-on-surface-variant font-medium">Scenario progress:</span>
          <span className="font-bold text-primary font-mono">{elapsedMinutes}m / {totalMinutes}m</span>
        </div>
      </div>

      {/* 5-Milestone Progression Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {milestones.map((m) => {
          const isActive = currentStep === m.step;
          const isPassed = currentStep >= m.step;
          return (
            <div
              key={m.step}
              onClick={() => onSeek(m.step * 5)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                isActive
                  ? 'bg-primary-container/30 border-primary text-on-surface shadow-sm ring-1 ring-primary/40'
                  : isPassed
                    ? 'bg-surface-container border-outline-variant/30 text-on-surface hover:bg-surface-container-high'
                    : 'bg-surface-container-lowest/50 border-outline-variant/15 text-on-surface-variant opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">
                  {m.time}
                </span>
                <span className="text-sm select-none">{m.icon}</span>
              </div>
              <span className="font-semibold text-xs text-on-surface truncate">
                {m.title}
              </span>
              <span className="text-[10px] text-on-surface-variant leading-tight truncate">
                {m.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrubber & Playback Controls Bar */}
      <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-3 bg-surface-container p-3 rounded-xl border border-outline-variant/20">
        {/* Play/Pause & Step Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            title={isPlaying ? 'Pause replay' : 'Play replay sequence'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
            <span>{isPlaying ? 'Pause' : 'Play Replay'}</span>
          </button>

          <button
            type="button"
            onClick={onStepBack}
            className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-colors cursor-pointer border border-outline-variant/20"
            title="Step back 5 minutes"
          >
            <span className="material-symbols-outlined text-[16px]">skip_previous</span>
          </button>

          <button
            type="button"
            onClick={onStepForward}
            className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-colors cursor-pointer border border-outline-variant/20"
            title="Step forward 5 minutes"
          >
            <span className="material-symbols-outlined text-[16px]">skip_next</span>
          </button>
        </div>

        {/* Scrubber Slider */}
        <div className="flex-1 w-full flex items-center gap-2.5 px-2">
          <span className="text-[11px] font-mono text-on-surface-variant">0m</span>
          <div className="flex-1 relative flex items-center">
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={percent}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="w-4 h-4 rounded-full bg-white shadow-md border border-primary absolute -translate-x-1/2 pointer-events-none transition-all"
              style={{ left: `${percent}%` }}
            ></div>
          </div>
          <span className="text-[11px] font-mono text-on-surface-variant">{totalMinutes}m</span>
        </div>

        {/* Speed & Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSpeedCycle}
            className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-primary font-mono text-xs font-semibold border border-outline-variant/20 transition-colors cursor-pointer"
            title="Cycle playback speed"
          >
            {speed}x Speed
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface text-xs font-medium border border-outline-variant/20 transition-colors cursor-pointer"
            title="Reset scenario to baseline"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
