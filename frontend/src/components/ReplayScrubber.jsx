import React from 'react';

export default function ReplayScrubber({
  isPlaying = false,
  onTogglePlay = () => {},
  elapsedMinutes = 18,
  totalMinutes = 30,
  speed = 1.0,
  onSpeedChange = () => {},
  onSeek = () => {},
  onReset = () => {}
}) {
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
    <div className="w-full bg-surface-container-high/95 backdrop-blur-md p-space-sm rounded-xl flex flex-col md:flex-row items-center justify-between gap-space-sm shadow-md border border-outline-variant/20 mt-space-sm">
      {/* Play/Pause & Elapsed Time */}
      <div className="flex items-center gap-space-sm">
        <button
          className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          type="button"
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause replay' : 'Play replay'}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <div className="flex items-center gap-1.5 font-body-sm">
          <span className="text-primary font-bold">
            Live Replay: {elapsedMinutes} min elapsed
          </span>
          <span className="text-on-surface-variant">/ {totalMinutes} min</span>
        </div>
      </div>

      {/* Scrubber Track */}
      <div className="flex-1 w-full flex items-center gap-3 px-space-sm">
        <span className="font-body-sm text-body-sm text-on-surface-variant">Start</span>
        <div className="flex-1 relative flex items-center">
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
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
            className="w-4 h-4 rounded-full bg-white shadow-md absolute -translate-x-1/2 pointer-events-none transition-all"
            style={{ left: `${percent}%` }}
          ></div>
        </div>
        <span className="font-body-sm text-body-sm text-on-surface-variant">{totalMinutes}m</span>
      </div>

      {/* Speed & Reset */}
      <div className="flex items-center gap-space-xs">
        <button
          type="button"
          onClick={handleSpeedCycle}
          className="px-space-sm py-1 rounded bg-surface-container font-body-sm text-body-sm text-tertiary font-semibold hover:bg-surface-bright transition-colors cursor-pointer"
          title="Cycle playback speed"
        >
          {speed}x Speed
        </button>
        <button
          className="px-space-sm py-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm transition-colors cursor-pointer"
          type="button"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
